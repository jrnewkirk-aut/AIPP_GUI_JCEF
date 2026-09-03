"""Run one approved AIPP input deck through WSL and Apptainer."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import queue
import subprocess
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


REPORT_LEVELS = {0: "none", 1: "full", 2: "customer"}


@dataclass(frozen=True)
class RunnerConfig:
    wsl_distribution: str = ""
    image: str = ""
    aipp_executable: str = "/usr/bin/aipp"
    run_root: Path = Path.home() / "AIPP" / "runs"
    wsl_executable: str = "wsl.exe"
    apptainer_executable: str = "apptainer"

    @classmethod
    def from_environment(cls) -> "RunnerConfig":
        root = os.environ.get("AIPP_RUN_ROOT")
        return cls(
            wsl_distribution=os.environ.get("AIPP_WSL_DISTRO", cls.wsl_distribution),
            image=os.environ.get("AIPP_IMAGE", cls.image),
            aipp_executable=os.environ.get("AIPP_EXECUTABLE", cls.aipp_executable),
            run_root=Path(root).expanduser() if root else cls.run_root,
            wsl_executable=os.environ.get("AIPP_WSL_EXECUTABLE", cls.wsl_executable),
            apptainer_executable=os.environ.get("AIPP_APPTAINER", cls.apptainer_executable),
        )


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def windows_to_wsl(path: Path, config: RunnerConfig) -> str:
    native = str(path)
    if len(native) >= 3 and native[1] == ":" and native[2] in ("\\", "/"):
        drive = native[0].lower()
        suffix = native[3:].replace("\\", "/")
        return f"/mnt/{drive}/{suffix}"
    result = subprocess.run(
        wsl_command(config, ["wslpath", "-a", str(path)]),
        check=True,
        capture_output=True,
        text=True,
    )
    converted = result.stdout.strip()
    if not converted.startswith("/"):
        raise RuntimeError(f"WSL returned an invalid path for {path}: {converted!r}")
    return converted


def wsl_command(config: RunnerConfig, command: list[str]) -> list[str]:
    prefix = [config.wsl_executable]
    if config.wsl_distribution:
        prefix.extend(["-d", config.wsl_distribution])
    return prefix + ["--"] + command


def resolve_image(config: RunnerConfig) -> str:
    if config.image:
        return config.image
    home_result = subprocess.run(wsl_command(config, ["printenv", "HOME"]), check=True, capture_output=True, text=True)
    home = home_result.stdout.strip()
    if not home.startswith("/") or "\n" in home:
        raise RuntimeError("WSL did not return a valid home directory")
    result = subprocess.run(wsl_command(config, ["sh", "-lc", f'ls -1t "{home}"/*.sif 2>/dev/null | head -n 1']), check=True, capture_output=True, text=True)
    image = result.stdout.strip()
    if not image.startswith("/") or not image.endswith(".sif"):
        raise RuntimeError("No .sif image was found in the WSL user's home directory")
    return image


def approved_run_dir(run_dir: Path, run_root: Path) -> Path:
    directory = run_dir.expanduser().resolve()
    root = run_root.expanduser().resolve()
    try:
        directory.relative_to(root)
    except ValueError as error:
        raise ValueError(f"Run directory must be below approved run root: {root}") from error
    if not directory.is_dir():
        raise ValueError(f"Run directory does not exist: {directory}")
    return directory


def build_command(run_dir: Path, config: RunnerConfig, report_level: int, wsl_run_dir: str | None = None, input_name: str = "input.json", output_name: str = "output.json") -> list[str]:
    mounted = wsl_run_dir or windows_to_wsl(run_dir, config)
    return wsl_command(config, [
        config.apptainer_executable,
        "exec",
        "--contain",
        "--bind",
        f"{mounted}:/mnt:rw",
        resolve_image(config),
        config.aipp_executable,
        "-i",
        f"/mnt/{input_name}",
        "-o",
        f"/mnt/{output_name}",
        "-r",
        str(report_level),
    ])


def initial_manifest(run_dir: Path, input_path: Path, config: RunnerConfig, report_level: int) -> dict:
    return {
        "schema_version": 1,
        "run_id": f"run-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}",
        "state": "STARTING",
        "created_at": utc_now(),
        "started_at": None,
        "completed_at": None,
        "run_directory": str(run_dir),
        "input_file": input_path.name,
        "input_sha256": sha256_file(input_path),
        "output_file": "output.json",
        "console_log": "console.ndjson",
        "report_level": report_level,
        "report_name": REPORT_LEVELS[report_level],
        "wsl_distribution": config.wsl_distribution,
        "apptainer_image": config.image,
        "aipp_executable": config.aipp_executable,
        "command_contract": "aipp-apptainer-v1",
        "exit_code": None,
        "artifacts": [],
        "error": None,
    }


def write_manifest(path: Path, manifest: dict) -> None:
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def artifacts(run_dir: Path, manifest_name: str) -> list[dict]:
    found = []
    for path in sorted(run_dir.rglob("*")):
        if not path.is_file() or path.name == manifest_name:
            continue
        found.append({
            "path": path.relative_to(run_dir).as_posix(),
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        })
    return found


def capture_stream(stream, name: str, events: queue.Queue) -> None:
    try:
        for line in iter(stream.readline, ""):
            events.put((name, line))
    finally:
        stream.close()


def run(run_dir: Path, config: RunnerConfig, report_level: int) -> int:
    if report_level not in REPORT_LEVELS:
        raise ValueError(f"Unsupported report level {report_level}; supported levels are 0, 1, and 2")
    directory = approved_run_dir(run_dir, config.run_root)
    input_path = directory / "input.json"
    if not input_path.is_file():
        raise ValueError(f"Required input file is missing: {input_path}")

    manifest_name = "run_manifest.json"
    manifest_path = directory / manifest_name
    manifest = initial_manifest(directory, input_path, config, report_level)
    write_manifest(manifest_path, manifest)
    log_path = directory / manifest["console_log"]
    started = time.monotonic()
    process = None
    try:
        command = build_command(directory, config, report_level)
        manifest["started_at"] = utc_now()
        manifest["state"] = "RUNNING"
        manifest["command"] = command
        write_manifest(manifest_path, manifest)
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
        events: queue.Queue = queue.Queue()
        threads = [
            threading.Thread(target=capture_stream, args=(process.stdout, "stdout", events), daemon=True),
            threading.Thread(target=capture_stream, args=(process.stderr, "stderr", events), daemon=True),
        ]
        for thread in threads:
            thread.start()
        sequence = 0
        with log_path.open("w", encoding="utf-8", newline="") as log:
            while any(thread.is_alive() for thread in threads) or not events.empty():
                try:
                    stream, line = events.get(timeout=0.1)
                except queue.Empty:
                    continue
                sequence += 1
                event = {"sequence": sequence, "timestamp": utc_now(), "stream": stream, "type": "console", "text": line}
                log.write(json.dumps(event, ensure_ascii=False) + "\n")
                log.flush()
        for thread in threads:
            thread.join()
        exit_code = process.wait()
        manifest["exit_code"] = exit_code
        manifest["state"] = "COMPLETED" if exit_code == 0 else "FAILED"
        manifest["completed_at"] = utc_now()
        manifest["elapsed_seconds"] = round(time.monotonic() - started, 3)
        manifest["artifacts"] = artifacts(directory, manifest_name)
        write_manifest(manifest_path, manifest)
        return exit_code
    except Exception as error:
        if process is not None and process.poll() is None:
            process.kill()
            process.wait()
        manifest["state"] = "PREFLIGHT_FAILED" if manifest["started_at"] is None else "FAILED"
        manifest["completed_at"] = utc_now()
        manifest["error"] = str(error)
        manifest["elapsed_seconds"] = round(time.monotonic() - started, 3)
        manifest["artifacts"] = artifacts(directory, manifest_name)
        write_manifest(manifest_path, manifest)
        raise


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run one approved AIPP input deck through WSL and Apptainer.")
    parser.add_argument("--run-dir", required=True, type=Path, help="Existing run directory containing input.json")
    parser.add_argument("--report-level", type=int, choices=sorted(REPORT_LEVELS), default=1)
    parser.add_argument("--dry-run", action="store_true", help="Validate inputs and print the planned command")
    args = parser.parse_args(argv)
    config = RunnerConfig.from_environment()
    try:
        directory = approved_run_dir(args.run_dir, config.run_root)
        input_path = directory / "input.json"
        if not input_path.is_file():
            raise ValueError(f"Required input file is missing: {input_path}")
        command = build_command(directory, config, args.report_level, wsl_run_dir="<wsl-run-dir>")
        if args.dry_run:
            print(json.dumps({"run_directory": str(directory), "input_sha256": sha256_file(input_path), "command": command}, indent=2))
            return 0
        return run(directory, config, args.report_level)
    except Exception as error:
        print(f"AIPP runner error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

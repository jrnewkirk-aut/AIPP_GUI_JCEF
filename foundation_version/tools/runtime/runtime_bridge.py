"""Localhost AIPP Runtime Bridge (RT-3)."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import queue
import threading
import time
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from run_aipp import REPORT_LEVELS, RunnerConfig, artifacts, build_command, resolve_image, sha256_file, windows_to_wsl, wsl_command


REPORT_OPERATIONS = {
    "plot": {"executable": "/usr/bin/plot_aipp_outputs", "output": "runtime_output.json_plots"},
    "match": {"executable": "/usr/bin/aipp_match", "output": "aipp_match_output.json"},
}


SUPPORTED_STATES = {"QUEUED", "STARTING", "RUNNING", "COMPLETED", "FAILED", "CANCELLING", "CANCELLED"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def validate_deck(value: object) -> dict:
    if not isinstance(value, dict) or not isinstance(value.get("aipp_calculation"), dict):
        raise ValueError("deck must contain an aipp_calculation object")
    calculation = value["aipp_calculation"]
    required = ("header", "auxiliary_files", "time_specs", "reaction_specs", "assembly")
    for name in required:
        if not isinstance(calculation.get(name), dict):
            raise ValueError(f"aipp_calculation.{name} must be an object")
    assembly = calculation["assembly"]
    for name in ("chambers", "walls", "orifices"):
        if not isinstance(assembly.get(name), list):
            raise ValueError(f"aipp_calculation.assembly.{name} must be an array")
    if "pistons" in assembly and not isinstance(assembly["pistons"], list):
        raise ValueError("aipp_calculation.assembly.pistons must be an array")
    return value


def execution_deck(value: dict) -> dict:
    """Restore JSON real-number spelling required by the current AIPP parser."""
    deck = json.loads(json.dumps(value))
    calculation = deck["aipp_calculation"]
    for name, path in calculation.get("auxiliary_files", {}).items():
        if isinstance(path, str) and path.startswith("auxiliary_files/"):
            calculation["auxiliary_files"][name] = "/" + path
    rkf_path = calculation.get("time_specs", {}).get("RKF_config_file")
    if isinstance(rkf_path, str) and rkf_path.startswith("auxiliary_files/"):
        calculation["time_specs"]["RKF_config_file"] = "/" + rkf_path
    reactions_path = calculation.get("reaction_specs", {}).get("reactions_file")
    if isinstance(reactions_path, str) and reactions_path.startswith("auxiliary_files/"):
        calculation["reaction_specs"]["reactions_file"] = "/" + reactions_path
    for name in ("speed_scaling",):
        if name in calculation["reaction_specs"] and isinstance(calculation["reaction_specs"][name], (int, float)):
            calculation["reaction_specs"][name] = float(calculation["reaction_specs"][name])
    for orifice in calculation["assembly"]["orifices"]:
        if isinstance(orifice.get("viscous_flow_factor"), (int, float)):
            orifice["viscous_flow_factor"] = float(orifice["viscous_flow_factor"])
        coefficient = orifice.get("discharge_coefficient")
        if isinstance(coefficient, dict) and isinstance(coefficient.get("Cd_value"), (int, float)):
            coefficient["Cd_value"] = float(coefficient["Cd_value"])
    return deck


class Run:
    def __init__(self, run_id: str, directory: Path, config: RunnerConfig, report_level: int, input_name: str = "input.json", output_name: str = "output.json", command: list[str] | None = None, operation: str = "aipp"):
        self.run_id = run_id
        self.directory = directory
        self.config = config
        self.report_level = report_level
        self.input_name = input_name
        self.output_name = output_name
        self.command = command
        self.operation = operation
        self.manifest_path = directory / f"{run_id}_manifest.json"
        self.log_path = directory / f"{run_id}_console.ndjson"
        self.events: list[dict] = []
        self.lock = threading.RLock()
        self.process = None
        self.cancel_requested = False
        self.manifest = {
            "schema_version": 1,
            "run_id": run_id,
            "state": "QUEUED",
            "created_at": utc_now(),
            "started_at": None,
            "completed_at": None,
            "run_directory": str(directory),
            "bind_source_directory": str(directory),
            "container_bind_directory": "/mnt",
            "input_file": input_name,
            "input_sha256": None,
            "output_file": output_name,
            "console_log": self.log_path.name,
            "report_level": report_level,
            "report_name": REPORT_LEVELS[report_level],
            "operation": operation,
            "wsl_distribution": config.wsl_distribution,
            "apptainer_image": config.image or "newest .sif in WSL home",
            "aipp_executable": config.aipp_executable,
            "command_contract": "aipp-apptainer-v1",
            "exit_code": None,
            "artifacts": [],
            "error": None,
        }

    def write_manifest(self) -> None:
        self.manifest_path.write_text(json.dumps(self.manifest, indent=2) + "\n", encoding="utf-8")

    def snapshot(self) -> dict:
        with self.lock:
            return {**self.manifest, "event_count": len(self.events)}

    def start(self) -> None:
        self.manifest["input_sha256"] = sha256_file(self.directory / self.input_name)
        self.write_manifest()
        threading.Thread(target=self._execute, name=f"aipp-{self.run_id}", daemon=True).start()

    def _execute(self) -> None:
        started = time.monotonic()
        events: queue.Queue = queue.Queue()
        try:
            with self.lock:
                self.manifest["state"] = "STARTING"
                self.manifest["started_at"] = utc_now()
                self.write_manifest()
            command = self.command or build_command(self.directory, self.config, self.report_level, input_name=self.input_name, output_name=self.output_name)
            with self.lock:
                self.manifest["command"] = command
                self.write_manifest()
            self.process = __import__("subprocess").Popen(command, stdout=__import__("subprocess").PIPE, stderr=__import__("subprocess").PIPE, text=True, bufsize=1)
            with self.lock:
                self.manifest["state"] = "RUNNING"
                self.write_manifest()
            threads = []
            for stream, name in ((self.process.stdout, "stdout"), (self.process.stderr, "stderr")):
                thread = threading.Thread(target=self._capture, args=(stream, name, events), daemon=True)
                thread.start()
                threads.append(thread)
            with self.log_path.open("w", encoding="utf-8", newline="") as log:
                while any(thread.is_alive() for thread in threads) or not events.empty():
                    try:
                        name, text, arrived = events.get(timeout=0.05)
                    except queue.Empty:
                        if self.cancel_requested and self.process.poll() is None:
                            self.process.terminate()
                        continue
                    with self.lock:
                        event = {"run_id": self.run_id, "sequence": len(self.events) + 1, "timestamp": utc_now(), "stream": name, "type": "console", "text": text}
                        self.events.append(event)
                    log.write(json.dumps(event, ensure_ascii=False) + "\n")
                    log.flush()
            for thread in threads:
                thread.join()
            exit_code = self.process.wait()
            with self.lock:
                self.manifest["exit_code"] = exit_code
                self.manifest["state"] = "CANCELLED" if self.cancel_requested else ("COMPLETED" if exit_code == 0 else "FAILED")
                self.manifest["completed_at"] = utc_now()
                self.manifest["elapsed_seconds"] = round(time.monotonic() - started, 3)
                self.manifest["artifacts"] = self._artifacts()
                self.write_manifest()
        except Exception as error:
            with self.lock:
                self.manifest["state"] = "FAILED"
                self.manifest["completed_at"] = utc_now()
                self.manifest["error"] = str(error)
                self.manifest["elapsed_seconds"] = round(time.monotonic() - started, 3)
                self.manifest["artifacts"] = self._artifacts()
                self.write_manifest()

    def _artifacts(self) -> list[dict]:
        return [{"path": path.relative_to(self.directory).as_posix(), "bytes": path.stat().st_size, "sha256": sha256_file(path)}
                for path in sorted(self.directory.rglob("*")) if path.is_file() and path != self.manifest_path]

    @staticmethod
    def _capture(stream, name: str, events: queue.Queue) -> None:
        for line in iter(stream.readline, ""):
            events.put((name, line, time.monotonic()))
        stream.close()

    def cancel(self) -> dict:
        with self.lock:
            if self.manifest["state"] in {"QUEUED", "STARTING", "RUNNING"}:
                self.cancel_requested = True
                self.manifest["state"] = "CANCELLING"
                self.write_manifest()
            if self.process is not None and self.process.poll() is None:
                self.process.terminate()
            return self.snapshot()

    def events_since(self, sequence: int) -> list[dict]:
        with self.lock:
            return [event for event in self.events if event["sequence"] > sequence]


class Bridge:
    def __init__(self, config: RunnerConfig):
        self.config = config
        self.runs: dict[str, Run] = {}
        self.lock = threading.RLock()

    def create_run(self, deck: dict, report_level: int, source_path: str | None = None, output_name: str | None = None) -> Run:
        if report_level not in REPORT_LEVELS:
            raise ValueError("unsupported report level")
        validate_deck(deck)
        if source_path:
            source = Path(source_path).expanduser().resolve()
            if not source.is_file():
                raise ValueError(f"input deck does not exist: {source}")
            root = source.parent
            input_name = f"{source.stem}_runtime_input.json"
            output_name = output_name or f"{source.stem}_runtime_output.json"
        else:
            raise ValueError("a saved input deck path is required; save the deck before running")
        run_id = f"run-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
        run = Run(run_id, root, self.config, report_level, input_name, output_name)
        run.directory.mkdir(parents=True, exist_ok=True)
        (run.directory / input_name).write_text(json.dumps(execution_deck(deck), indent=2) + "\n", encoding="utf-8")
        with self.lock:
            if any(r.snapshot()["state"] in {"QUEUED", "STARTING", "RUNNING", "CANCELLING"} for r in self.runs.values()):
                raise RuntimeError("only one active run is supported")
            self.runs[run_id] = run
        run.start()
        return run

    def create_report_run(self, source_path: str, operation: str) -> Run:
        if operation not in REPORT_OPERATIONS:
            raise ValueError("unsupported report operation")
        source = Path(source_path).expanduser().resolve()
        if not source.is_file() or source.parent != source.parent.resolve():
            raise ValueError("report source file does not exist")
        root = source.parent
        mounted = windows_to_wsl(root, self.config)
        profile = REPORT_OPERATIONS[operation]
        if operation == "plot":
            command_args = [profile["executable"], f"/mnt/{source.name}", f"/mnt/{profile['output']}"]
            output_name = profile["output"]
        else:
            command_args = [profile["executable"], f"/mnt/{source.name}"]
            output_name = profile["output"]
        command = wsl_command(self.config, [self.config.apptainer_executable, "exec", "--contain", "--bind", f"{mounted}:/mnt:rw", resolve_image(self.config), *command_args])
        run_id = f"run-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
        run = Run(run_id, root, self.config, 0, source.name, output_name, command, operation)
        with self.lock:
            if any(r.snapshot()["state"] in {"QUEUED", "STARTING", "RUNNING", "CANCELLING"} for r in self.runs.values()):
                raise RuntimeError("only one active run is supported")
            self.runs[run_id] = run
        run.start()
        return run

    def get(self, run_id: str) -> Run | None:
        with self.lock:
            return self.runs.get(run_id)


class Handler(BaseHTTPRequestHandler):
    bridge: Bridge

    def _authorized(self) -> bool:
        expected = os.environ.get("AIPP_BRIDGE_TOKEN")
        return not expected or self.headers.get("Authorization") == f"Bearer {expected}"

    def _json(self, status: int, value: dict | list) -> None:
        data = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 20 * 1024 * 1024:
            raise ValueError("request body is too large")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_POST(self) -> None:
        if not self._authorized():
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
            return
        try:
            if self.path == "/reports":
                body = self._body()
                source_path = body.get("sourcePath", body.get("source_path"))
                run = self.bridge.create_report_run(source_path, str(body.get("operation", "")))
                self._json(HTTPStatus.ACCEPTED, run.snapshot())
                return
            if self.path == "/runs":
                body = self._body()
                deck = body.get("deck", body.get("input"))
                report_level = int(body.get("reportLevel", body.get("report_level", 1)))
                source_path = body.get("sourcePath", body.get("source_path"))
                output_path = body.get("outputPath", body.get("output_path"))
                if output_path:
                    output = Path(output_path).expanduser().resolve()
                    source = Path(source_path).expanduser().resolve() if source_path else None
                    if source is None or output.parent != source.parent:
                        raise ValueError("custom output must be in the same Windows directory as the input deck")
                run = self.bridge.create_run(deck, report_level, source_path, output.name if output_path else None)
                self._json(HTTPStatus.ACCEPTED, run.snapshot())
                return
            parsed = urlparse(self.path)
            parts = parsed.path.strip("/").split("/")
            if len(parts) == 3 and parts[0] == "runs" and parts[2] == "cancel":
                run = self.bridge.get(parts[1])
                if not run:
                    self._json(HTTPStatus.NOT_FOUND, {"error": "run not found"})
                    return
                self._json(HTTPStatus.OK, run.cancel())
                return
            self._json(HTTPStatus.NOT_FOUND, {"error": "endpoint not found"})
        except (ValueError, TypeError, json.JSONDecodeError, RuntimeError) as error:
            self._json(HTTPStatus.BAD_REQUEST, {"error": str(error)})

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        if not self._authorized():
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
            return
        if self.path == "/health":
            self._json(HTTPStatus.OK, {"status": "ok", "service": "aipp-runtime-bridge", "version": "rt9"})
            return
        parsed = urlparse(self.path)
        if parsed.path == "/reports":
            query = parse_qs(parsed.query)
            source_path = Path(query.get("sourcePath", [""])[0]).expanduser().resolve()
            if not source_path.is_file():
                self._json(HTTPStatus.BAD_REQUEST, {"error": "source deck does not exist"})
                return
            reports = []
            for path in sorted(source_path.parent.rglob("*")):
                if path.is_file() and path.suffix.lower() in {".html", ".xhtml", ".csv"}:
                    reports.append({"path": path.relative_to(source_path.parent).as_posix(), "bytes": path.stat().st_size, "kind": path.suffix.lower()[1:]})
            self._json(HTTPStatus.OK, {"directory": str(source_path.parent), "reports": reports})
            return
        if parsed.path == "/report-content":
            query = parse_qs(parsed.query)
            source_path = Path(query.get("sourcePath", [""])[0]).expanduser().resolve()
            relative = Path(query.get("path", [""])[0])
            target = (source_path.parent / relative).resolve()
            if not source_path.is_file() or source_path.parent not in target.parents or not target.is_file() or target.suffix.lower() not in {".html", ".xhtml", ".csv"}:
                self._json(HTTPStatus.BAD_REQUEST, {"error": "report path is not allowed"})
                return
            data = target.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8" if target.suffix.lower() != ".csv" else "text/csv; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        parts = parsed.path.strip("/").split("/")
        if len(parts) >= 2 and parts[0] == "runs": 
            run = self.bridge.get(parts[1])
            if not run:
                self._json(HTTPStatus.NOT_FOUND, {"error": "run not found"})
                return
            if len(parts) == 2:
                self._json(HTTPStatus.OK, run.snapshot())
                return
            if len(parts) == 3 and parts[2] == "events":
                query = parse_qs(parsed.query)
                since = int(query.get("since", [0])[0])
                events = run.events_since(since)
                self._json(HTTPStatus.OK, {"run_id": run.run_id, "events": events, "next_sequence": events[-1]["sequence"] if events else since, "complete": run.snapshot()["state"] in {"COMPLETED", "FAILED", "CANCELLED"}})
                return
            if len(parts) == 3 and parts[2] == "artifacts":
                self._json(HTTPStatus.OK, {"run_id": run.run_id, "artifacts": run.snapshot()["artifacts"]})
                return
        self._json(HTTPStatus.NOT_FOUND, {"error": "endpoint not found"})

    def log_message(self, format: str, *args) -> None:
        return


def serve(host: str, port: int, config: RunnerConfig) -> None:
    bridge = Bridge(config)
    class BoundHandler(Handler):
        pass
    BoundHandler.bridge = bridge
    server = ThreadingHTTPServer((host, port), BoundHandler)
    print(json.dumps({"state": "READY", "host": host, "port": port, "run_root": str(config.run_root)}), flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve the local AIPP Runtime Bridge.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    args = parser.parse_args()
    serve(args.host, args.port, RunnerConfig.from_environment())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

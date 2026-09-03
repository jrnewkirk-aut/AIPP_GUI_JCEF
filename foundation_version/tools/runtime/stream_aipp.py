"""Standalone RT-2 proof harness for incremental AIPP stdout/stderr capture."""
from __future__ import annotations

import argparse
import json
import queue
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from run_aipp import REPORT_LEVELS, RunnerConfig, approved_run_dir, build_command


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def capture(stream, name: str, events: queue.Queue) -> None:
    try:
        for line in iter(stream.readline, ""):
            events.put((name, line, time.monotonic()))
    finally:
        stream.close()


def stream_command(command: list[str], log_path: Path, cancel_after: float | None = None) -> dict:
    started = time.monotonic()
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
    events: queue.Queue = queue.Queue()
    threads = [
        threading.Thread(target=capture, args=(process.stdout, "stdout", events), daemon=True),
        threading.Thread(target=capture, args=(process.stderr, "stderr", events), daemon=True),
    ]
    for thread in threads:
        thread.start()
    first_event = None
    sequence = 0
    cancelled = False
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("w", encoding="utf-8", newline="") as log:
        while any(thread.is_alive() for thread in threads) or not events.empty():
            if cancel_after is not None and not cancelled and time.monotonic() - started >= cancel_after:
                process.terminate()
                cancelled = True
            try:
                stream, text, arrived = events.get(timeout=0.05)
            except queue.Empty:
                continue
            sequence += 1
            if first_event is None:
                first_event = round(arrived - started, 3)
            event = {"sequence": sequence, "timestamp": utc_now(), "stream": stream, "type": "console", "text": text}
            log.write(json.dumps(event, ensure_ascii=False) + "\n")
            log.flush()
    for thread in threads:
        thread.join()
    exit_code = process.wait()
    return {
        "state": "CANCELLED" if cancelled else ("COMPLETED" if exit_code == 0 else "FAILED"),
        "exit_code": exit_code,
        "cancelled": cancelled,
        "event_count": sequence,
        "first_event_seconds": first_event,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "log_file": str(log_path),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Probe incremental AIPP stdout/stderr capture on Windows.")
    parser.add_argument("--run-dir", required=True, type=Path)
    parser.add_argument("--report-level", type=int, choices=sorted(REPORT_LEVELS), default=0)
    parser.add_argument("--cancel-after", type=float, default=None, help="Terminate the probe after this many seconds")
    args = parser.parse_args(argv)
    config = RunnerConfig.from_environment()
    try:
        directory = approved_run_dir(args.run_dir, config.run_root)
        command = build_command(directory, config, args.report_level)
        result = stream_command(command, directory / "stream_probe.ndjson", args.cancel_after)
        print(json.dumps(result, indent=2))
        return 0 if result["state"] in {"COMPLETED", "CANCELLED"} else 1
    except Exception as error:
        print(f"RT-2 stream probe error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

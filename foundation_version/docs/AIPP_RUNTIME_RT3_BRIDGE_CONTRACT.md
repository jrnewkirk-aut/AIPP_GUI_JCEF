# AIPP Runtime RT-3 Bridge Contract

**Verified:** September 2, 2026

## Scope

`tools/runtime/runtime_bridge.py` is a localhost-only, standard-library HTTP bridge. It owns one active AIPP run at a time and launches the fixed RT-1 Apptainer runner command. It is intentionally separate from the browser and Scilab integration; those are RT-4 and RT-5.

By default, WSL commands use the user's configured default WSL distribution (`wsl.exe -- ...`). Set `AIPP_WSL_DISTRO` to a distribution name when a specific distribution is required; then commands use `wsl.exe -d <name> -- ...`.

By default, the bridge discovers the newest `.sif` file directly under the selected WSL user's home directory. Set `AIPP_IMAGE` to an absolute WSL image path to override discovery.

## Endpoints

```text
POST /runs
GET  /runs/{id}
GET  /runs/{id}/events?since=N
POST /runs/{id}/cancel
GET  /runs/{id}/artifacts
```

`POST /runs` accepts a deck under `deck` or `input`, an optional saved input `sourcePath`, and an optional `reportLevel`/`report_level` value. Only report levels 0, 1, and 2 are accepted. When `sourcePath` is supplied, the bridge uses its parent directory as the Apptainer bind source mounted at `/mnt`, writes uniquely named immutable runtime input/output/log artifacts beside the saved input deck, and returns HTTP 202 with the run snapshot. The legacy internal run root is used only when no source path is supplied.

Events are returned as JSON with `run_id`, sequential `sequence`, timestamp, stream (`stdout` or `stderr`), type, and text. Event polling is incremental using the `since` query parameter. The bridge persists the same events to `console.ndjson` and retains the full log when a client disconnects.

The bridge binds to `127.0.0.1` by default. If `AIPP_BRIDGE_TOKEN` is set, requests require `Authorization: Bearer <token>`. Request bodies are limited to 20 MiB. Arbitrary commands, image paths, WSL distributions, executables, and shell fragments are not accepted from HTTP clients.

## Run lifecycle

The implemented states are `QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLING`, and `CANCELLED`. The bridge owns authoritative state and records timestamps, exit code, input hash, fixed command metadata, elapsed time, and artifact hashes in `run_manifest.json`.

## Verification

Ten runtime unit tests pass across RT-1, RT-2, and RT-3. The real bridge was started on `127.0.0.1:8766` with the verified Ubuntu/Apptainer configuration. The uploaded AIPP deck completed through HTTP with:

- HTTP 202 run creation
- final state `COMPLETED`
- exit code `0`
- 3,100 events retrieved through `/events`
- complete event polling response
- `console.ndjson`, `input.json`, `output.json`, and `output.json.log` reported by `/artifacts`

## Current boundary

The bridge currently keeps its run registry in process memory, so it is not yet restart-recoverable. It uses polling rather than SSE/WebSocket. Scilab does not start or health-check it yet, and the Runtime tab does not call it yet. Those are RT-4 and RT-5 responsibilities.

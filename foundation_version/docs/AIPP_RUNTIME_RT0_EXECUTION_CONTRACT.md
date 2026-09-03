# AIPP Runtime RT-0 Execution Contract

**Verified:** September 2, 2026
**Environment:** Windows 11, WSL 2, Ubuntu 24.04.4 LTS, Apptainer 1.5.0-rc.2

## Verified runtime

- WSL distribution: `Ubuntu`
- Apptainer executable: `/usr/bin/apptainer`
- AIPP image: `/home/joseph/aipp_runner_20260901.sif`
- AIPP executable in the image: `/usr/bin/aipp`
- Image auxiliary data: `/auxiliary_files/`
- Image runscript: present but empty; use `apptainer exec`

## Verified command

AIPP resolves relative auxiliary-file paths from its container working directory. The working directory must therefore be `/`, where the image supplies `/auxiliary_files/`.

```text
 wsl.exe -d Ubuntu -- apptainer exec \
  --contain \
  --pwd / \
  --bind <input-deck-directory>:/mnt:rw \
  /home/joseph/aipp_runner_20260901.sif \
  /usr/bin/aipp \
  -i /mnt/input.json \
  -o /mnt/output.json \
  -r <report-level>
```

The browser or Scilab layer must not construct arbitrary commands. The runner/bridge constructs this argument list from trusted configuration and the directory containing the saved input deck. Runtime-generated input, output, log, and manifest artifacts are written in that same directory; no separate AIPP-root staging directory is used for execution.

## Input and output behavior

The uploaded `AIPP_Basic_Cylinder_Feed_Tank.json` was executed successfully from `/home/joseph/aipp_runner_20260901.sif` with the run directory bound at `/aipp/run`.

Observed artifacts for a run named `aipp_agent_r1.out`:

- Output JSON: approximately 973 KB
- Console log: approximately 165 KB
- Plots directory: `aipp_agent_r1.out_plots/`
- Process exit code: `0`
- Console output: approximately 3,100 lines
- First output reached the Windows parent process at approximately 2.53 seconds, before process exit

The generated output contains an embedded multi-line `system_graph` value with literal line breaks. It is therefore not strict JSON according to Python's standard JSON parser, despite using a `.json` filename. The runtime bridge should preserve the output bytes as produced and report parse status separately rather than silently rewriting the file.

## Report levels

The current image's executable accepts only:

- `-r 0`: no report; verified exit code `0`
- `-r 1`: full report; verified exit code `0`
- `-r 2`: customer report; verified exit code `0`

The executable rejects the following with exit code `1` and `Specify a valid reporting level`:

- `-r 3`: match report, not supported by this image
- `-r 4`: CSV output, not supported by this image

The plan's report-level descriptions should remain documented as future/image-dependent capabilities, not exposed as supported choices for the current SIF until a newer image confirms them.

## Initial implementation scope

RT-1 should create one run directory containing:

- Immutable `input.json` snapshot
- AIPP-produced `output.json` bytes
- Captured `console.log` or structured event log
- Run manifest with command profile, image, input hash, timestamps, exit code, and artifact list

## RT-1 runner implementation

The controlled runner is `tools/runtime/run_aipp.py`. It accepts an existing approved
run directory and a report level; it does not accept arbitrary commands, images,
distributions, executables, or shell fragments.

```text
AIPP_RUN_ROOT="D:\\AIPP\\runs" python tools/runtime/run_aipp.py \
  --run-dir "D:\\AIPP\\runs\\run-001" \
  --report-level 1
```

The run directory must contain `input.json` and must be below `AIPP_RUN_ROOT` (or the
runner's default `%USERPROFILE%\\AIPP\\runs` root). The runner writes `run_manifest.json`
and `console.ndjson`, captures stdout and stderr as ordered structured events, preserves
the AIPP output and any generated files, and records SHA-256 hashes for all artifacts.
`--dry-run` validates the directory and prints the planned fixed command without starting
AIPP. Four unit tests cover path containment, fixed command construction, input hashing,
and artifact filtering.

The successful acceptance probe used the uploaded deck in a disposable run directory and
completed with exit code `0`, 3,100 NDJSON console events, a 972,755-byte output file,
and a completed manifest. An intentionally invalid deck was classified as `FAILED`
with its nonzero AIPP exit code and persisted console log.

## RT-2 streaming proof

The standalone harness `tools/runtime/stream_aipp.py` launches the same fixed command
from a Windows process, reads stdout and stderr concurrently, assigns sequential event
numbers as lines arrive, writes `stream_probe.ndjson`, and supports termination through
`--cancel-after`. Its tests cover mixed streams, high-volume output, and cancellation.

The real successful deck produced 3,100 sequential events, all on stdout, with the first
event received after approximately 2.828 seconds and process exit code `0`. A separate
invalid-deck probe confirmed that nonzero exit status and failure output remain observable.
Cross-pipe ordering is recorded in arrival order; the operating system does not provide
a strict chronological ordering guarantee between two independent pipes.

RT-2 can use a Windows subprocess observer to validate incremental output. The verified command emitted output before exit, so a bridge can own the long-running process without relying on blocking Scilab `host()` output capture.

## Known unresolved contract items

- Exact cancellation response and timeout behavior are not yet measured.
- The output's malformed `system_graph` serialization needs an explicit policy: preserve raw output and optionally expose a tolerant diagnostic, or obtain a newer AIPP build that emits strict JSON.
- The image's report modes `3` and `4` require confirmation from a different/newer SIF.
- Required run-directory handling for auxiliary files outside the image has not been needed for this deck because the image includes `/auxiliary_files/`.

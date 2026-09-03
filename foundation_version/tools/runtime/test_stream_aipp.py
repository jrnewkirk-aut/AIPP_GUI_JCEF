import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from stream_aipp import stream_command


class StreamProbeTests(unittest.TestCase):
    def test_preserves_stdout_stderr_arrival_order(self):
        code = "import sys; print('out-1', flush=True); print('err-1', file=sys.stderr, flush=True); print('out-2', flush=True)"
        with tempfile.TemporaryDirectory() as root:
            result = stream_command([sys.executable, "-c", code], Path(root) / "events.ndjson")
            self.assertEqual(result["state"], "COMPLETED")
            self.assertEqual(result["exit_code"], 0)
            rows = [json.loads(line) for line in (Path(root) / "events.ndjson").read_text().splitlines()]
            self.assertEqual([row["sequence"] for row in rows], [1, 2, 3])
            self.assertEqual([row["stream"] for row in rows].count("stdout"), 2)
            self.assertEqual([row["stream"] for row in rows].count("stderr"), 1)

    def test_captures_high_volume_output(self):
        code = "import sys; [print(f'line-{i}', flush=True) for i in range(1200)]; print('err-final', file=sys.stderr, flush=True)"
        with tempfile.TemporaryDirectory() as root:
            result = stream_command([sys.executable, "-c", code], Path(root) / "events.ndjson")
            self.assertEqual(result["exit_code"], 0)
            self.assertEqual(result["event_count"], 1201)

    def test_cancellation_is_classified(self):
        code = "import time; print('started', flush=True); time.sleep(2)"
        with tempfile.TemporaryDirectory() as root:
            result = stream_command([sys.executable, "-c", code], Path(root) / "events.ndjson", cancel_after=0.5)
            self.assertTrue(result["cancelled"])
            self.assertEqual(result["state"], "CANCELLED")
            self.assertIsNotNone(result["exit_code"])
            self.assertGreaterEqual(result["event_count"], 0)


if __name__ == "__main__":
    unittest.main()

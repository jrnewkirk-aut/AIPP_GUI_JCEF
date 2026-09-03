import json
import sys
import tempfile
import threading
import time
import unittest
from http.client import HTTPConnection
from pathlib import Path
from unittest.mock import patch

import runtime_bridge
from run_aipp import RunnerConfig


DECK = {
    "aipp_calculation": {
        "header": {},
        "auxiliary_files": {},
        "time_specs": {},
        "reaction_specs": {},
        "assembly": {"chambers": [], "walls": [], "orifices": [], "pistons": []},
    }
}


class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        config = RunnerConfig(run_root=Path(self.temp.name))
        self.bridge = runtime_bridge.Bridge(config)
        self.source = Path(self.temp.name) / "source.json"
        self.source.write_text(json.dumps(DECK), encoding="utf-8")
        handler_type = type("TestHandler", (runtime_bridge.Handler,), {})
        handler_type.bridge = self.bridge
        self.server = runtime_bridge.ThreadingHTTPServer(("127.0.0.1", 0), handler_type)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def request(self, method, path, body=None):
        connection = HTTPConnection("127.0.0.1", self.port, timeout=3)
        payload = json.dumps(body).encode() if body is not None else None
        connection.request(method, path, payload, {"Content-Type": "application/json"} if payload else {})
        response = connection.getresponse()
        result = json.loads(response.read())
        connection.close()
        return response.status, result

    def wait_complete(self, run_id):
        for _ in range(50):
            _, result = self.request("GET", f"/runs/{run_id}")
            if result["state"] in {"COMPLETED", "FAILED", "CANCELLED"}:
                return result
            time.sleep(0.02)
        self.fail("bridge run did not complete")

    def test_start_status_events_and_artifacts(self):
        code = "import sys; print('out', flush=True); print('err', file=sys.stderr, flush=True)"
        with patch.object(runtime_bridge, "build_command", return_value=[sys.executable, "-c", code]):
            status, started = self.request("POST", "/runs", {"deck": DECK, "sourcePath": str(self.source), "reportLevel": 0})
            self.assertEqual(status, 202)
            final = self.wait_complete(started["run_id"])
        self.assertEqual(final["state"], "COMPLETED")
        self.assertEqual(final["exit_code"], 0)
        _, events = self.request("GET", f"/runs/{started['run_id']}/events")
        self.assertEqual([event["stream"] for event in events["events"]].count("stdout"), 1)
        self.assertEqual([event["stream"] for event in events["events"]].count("stderr"), 1)
        _, artifacts = self.request("GET", f"/runs/{started['run_id']}/artifacts")
        self.assertIn("source_runtime_input.json", [item["path"] for item in artifacts["artifacts"]])

    def test_only_one_active_run_is_allowed(self):
        code = "import time; time.sleep(1)"
        with patch.object(runtime_bridge, "build_command", return_value=[sys.executable, "-c", code]):
            status, started = self.request("POST", "/runs", {"deck": DECK, "sourcePath": str(self.source)})
            self.assertEqual(status, 202)
            status, result = self.request("POST", "/runs", {"deck": DECK, "sourcePath": str(self.source)})
            self.assertEqual(status, 400)
            self.assertIn("one active run", result["error"])
            self.request("POST", f"/runs/{started['run_id']}/cancel")

    def test_invalid_deck_is_rejected(self):
        status, result = self.request("POST", "/runs", {"deck": {"invalid": True}})
        self.assertEqual(status, 400)
        self.assertIn("aipp_calculation", result["error"])

    def test_health_endpoint_is_local_service_probe(self):
        status, result = self.request("GET", "/health")
        self.assertEqual(status, 200)
        self.assertEqual(result["status"], "ok")

    def test_source_path_uses_input_directory_and_unique_artifact_names(self):
        with tempfile.TemporaryDirectory() as root_name:
            source = Path(root_name) / "deck.json"
            source.write_text(json.dumps(DECK), encoding="utf-8")
            with patch.object(runtime_bridge, "build_command", return_value=[sys.executable, "-c", "print('ok', flush=True)"]):
                run = self.bridge.create_run(DECK, 0, str(source), "custom_output.json")
                final = self.wait_complete(run.run_id)
            self.assertEqual(final["state"], "COMPLETED")
            self.assertEqual(final["run_directory"], str(source.parent.resolve()))
            self.assertTrue((source.parent / "deck_runtime_input.json").is_file())
            self.assertEqual(final["output_file"], "custom_output.json")

    def test_default_output_name_can_overwrite_existing_output(self):
        source = self.source
        (source.parent / "source_runtime_output.json").write_text("old", encoding="utf-8")
        with patch.object(runtime_bridge, "build_command", return_value=[sys.executable, "-c", "print('ok', flush=True)"]):
            run = self.bridge.create_run(DECK, 0, str(source))
            final = self.wait_complete(run.run_id)
        self.assertEqual(final["output_file"], "source_runtime_output.json")

    def test_execution_deck_uses_image_absolute_auxiliary_paths(self):
        deck = json.loads(json.dumps(DECK))
        deck["aipp_calculation"]["auxiliary_files"] = {"species_library": "auxiliary_files/species_library.json"}
        deck["aipp_calculation"]["time_specs"]["RKF_config_file"] = "auxiliary_files/RKF_config.json"
        deck["aipp_calculation"]["reaction_specs"]["reactions_file"] = "auxiliary_files/basic_reactions.json"
        execution = runtime_bridge.execution_deck(deck)["aipp_calculation"]
        self.assertEqual(execution["auxiliary_files"]["species_library"], "/auxiliary_files/species_library.json")
        self.assertEqual(execution["time_specs"]["RKF_config_file"], "/auxiliary_files/RKF_config.json")
        self.assertEqual(execution["reaction_specs"]["reactions_file"], "/auxiliary_files/basic_reactions.json")


if __name__ == "__main__":
    unittest.main()

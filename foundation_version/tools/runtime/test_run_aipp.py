import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).with_name("run_aipp.py")
SPEC = importlib.util.spec_from_file_location("run_aipp", MODULE_PATH)
run_aipp = importlib.util.module_from_spec(SPEC)
sys.modules["run_aipp"] = run_aipp
SPEC.loader.exec_module(run_aipp)


class RunnerTests(unittest.TestCase):
    def test_approved_run_dir_rejects_sibling(self):
        with tempfile.TemporaryDirectory() as root_name:
            root = Path(root_name)
            allowed = root / "runs"
            sibling = root / "other"
            allowed.mkdir()
            sibling.mkdir()
            with self.assertRaises(ValueError):
                run_aipp.approved_run_dir(sibling, allowed)

    def test_build_command_uses_fixed_apptainer_contract(self):
        config = run_aipp.RunnerConfig(image="/home/test/aipp.sif")
        command = run_aipp.build_command(Path("C:/AIPP/runs/run-1"), config, 1, "/mnt/c/AIPP/runs/run-1")
        self.assertEqual(command[0:2], ["wsl.exe", "--"])
        self.assertIn("exec", command)
        self.assertNotIn("--pwd", command)
        self.assertIn("--contain", command)
        self.assertIn("/usr/bin/aipp", command)
        self.assertIn("/mnt/input.json", command)
        self.assertIn("/mnt/output.json", command)
        self.assertEqual(command[-6:], ["-i", "/mnt/input.json", "-o", "/mnt/output.json", "-r", "1"])
        self.assertNotIn("sh", command)

    def test_default_image_uses_newest_wsl_home_sif(self):
        config = run_aipp.RunnerConfig()
        results = [type("Process", (), {"stdout": "/home/test\n"})(), type("Process", (), {"stdout": "/home/test/aipp_new.sif\n"})()]
        with patch.object(run_aipp.subprocess, "run", side_effect=results) as run:
            self.assertEqual(run_aipp.resolve_image(config), "/home/test/aipp_new.sif")
        self.assertEqual(run.call_args.args[0], ["wsl.exe", "--", "sh", "-lc", 'ls -1t "/home/test"/*.sif 2>/dev/null | head -n 1'])

    def test_manifest_records_input_hash_and_report(self):
        with tempfile.TemporaryDirectory() as root_name:
            directory = Path(root_name)
            input_path = directory / "input.json"
            input_path.write_text('{"aipp_calculation":{}}', encoding="utf-8")
            manifest = run_aipp.initial_manifest(directory, input_path, run_aipp.RunnerConfig(), 2)
            self.assertEqual(manifest["report_name"], "customer")
            self.assertEqual(len(manifest["input_sha256"]), 64)
            self.assertEqual(manifest["state"], "STARTING")

    def test_artifacts_excludes_manifest(self):
        with tempfile.TemporaryDirectory() as root_name:
            directory = Path(root_name)
            (directory / "run_manifest.json").write_text("{}", encoding="utf-8")
            (directory / "output.json").write_text("{}", encoding="utf-8")
            found = run_aipp.artifacts(directory, "run_manifest.json")
            self.assertEqual([item["path"] for item in found], ["output.json"])


if __name__ == "__main__":
    unittest.main()

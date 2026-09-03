from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[2]
for p in r.rglob("*.json"): json.loads(p.read_text())
tm=json.loads((r/"tests/manifests/test_manifest.json").read_text()); assert len(tm["tests"])==95 and len({x["id"] for x in tm["tests"]})==95
s=(r/"scilab/testing/test_runner.sci").read_text(); body=s.split("function rows=p4RunScilabTests",1)[1].split("endfunction",1)[0]; assert "SC-ARC-001" in body and "SC-ARC-002" in body
ui=(r/"browser_files/js/testing/05_runner_ui.js").read_text(); assert "MISSING_DECLARED_TEST" in ui and "TEST_INVENTORY_MISMATCH" in ui and "test_inventory" in ui
manifest_src=(r/"browser_files/js/testing/03_manifests.js").read_text(); assert all(x["id"] in manifest_src for x in tm["tests"]); assert "SC-ARC-001" in manifest_src and "SC-ARC-002" in manifest_src
test=(r/"browser_files/dist/bundle.test.html").read_text(); assert "P5.3.2-0.1" in test and "SC-ARC-001" in test and "MISSING_DECLARED_TEST" in test
prod=(r/"browser_files/dist/bundle.prod.html").read_text(); assert "MISSING_DECLARED_TEST" not in prod and "SC-ARC-001" not in prod and "__JCEF_TEST_API__" not in prod
print("P5.3.1 correction validation: PASS (95 declared tests, embedded manifest synchronized, missing-test gate active)")

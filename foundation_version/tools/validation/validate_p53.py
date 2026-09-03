from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[2]
for p in r.rglob("*.json"): json.loads(p.read_text(encoding="utf-8"))
t=json.loads((r/"tests/manifests/test_manifest.json").read_text())
assert len(t["tests"])==95
assert len({x["id"] for x in t["tests"]})==95
a=json.loads((r/"tests/manifests/p5.3/architecture_manifest.json").read_text())
ids={m["id"] for m in a["modules"]}
assert all(d in ids for m in a["modules"] for d in m.get("dependencies",[]))
assert a["primary_browser_controls"]==1
prod=(r/"browser_files/dist/bundle.prod.html").read_text()
assert all(x not in prod for x in a["production_forbidden_tokens"])
test=(r/"browser_files/dist/bundle.test.html").read_text()
for x in ["MF-ARC-001","BR-ARC-001","INT-ARC-001","P5.3.0-0.1","regression_baseline"]: assert x in test,x
report=(r/"browser_files/js/testing/05_runner_ui.js").read_text()
assert "application_version:P2.applicationVersion" in report and "regression_baseline:P4.regressionBaseline" in report
print("P5.3 static architecture qualification: PASS (95 declared tests)")

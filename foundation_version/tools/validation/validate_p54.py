from pathlib import Path
import json
r=Path(__file__).resolve().parents[2]
for p in r.rglob("*.json"): json.loads(p.read_text())
t=json.loads((r/"tests/manifests/test_manifest.json").read_text()); assert len(t["tests"])==103 and len({x["id"] for x in t["tests"]})==103
assert (r/"app/starter_main.sce").is_file()
s=(r/"app/starter_main.sce").read_text(); assert "p54StarterConfig" in s and "p521RuntimeModules" in s and "p52CreateMainWindow" in s
c=(r/"app/app_config.sci").read_text(); assert '"include_plotting", %f' in c and '"include_testing", %f' in c and '"jcef_debug", %f' in c
b=(r/"browser_files/dist/bundle.test.html").read_text(); assert "P5.4.0-0.1" in b and all(x in b for x in ["MF-ST-001","BR-ST-001","INT-ST-001","INT-ST-002"])
p=(r/"browser_files/dist/bundle.prod.html").read_text(); assert all(x not in p for x in ["MF-ST-001","__JCEF_TEST_API__","P4.register","P3.","runAcceptanceButton"])
rel=json.loads((r/"tests/manifests/p5.4/release_manifest.json").read_text()); assert rel["accepted_source_result"]["passed"]==95 and rel["acceptance_target"]["passed"]==103
print("P5.4 reusable starter static validation: PASS (103 declared tests)")

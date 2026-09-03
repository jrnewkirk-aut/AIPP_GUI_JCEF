from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[2]
for p in r.rglob("*.json"):json.loads(p.read_text())
t=json.loads((r/"tests/manifests/test_manifest.json").read_text());assert len(t["tests"])==115 and len({x["id"] for x in t["tests"]})==115
assert all((r/x).is_file() for x in json.loads((r/"application/application_manifest.json").read_text())["host_modules"]+json.loads((r/"application/application_manifest.json").read_text())["browser_modules"])
router=(r/"scilab/protocol/protocol_router.sci").read_text();assert "p55RouteApplicationMessage" in router and 'case "application.example.ping.request"' not in router
runner=(r/"scilab/testing/test_runner.sci").read_text();assert "SC-APP-001" in runner and "SC-APP-002" in runner
test=(r/"browser_files/dist/bundle.test.html").read_text();assert all(x in test for x in ["MF-APP-001","BR-APP-001","INT-APP-001","P5.5.0-0.2"])
prod=(r/"browser_files/dist/bundle.prod.html").read_text();assert "DUPLICATE_APPLICATION_SERVICE" in prod and all(x not in prod for x in ["MF-APP-001","P4.register","__JCEF_TEST_API__","runAcceptanceButton"])
rel=json.loads((r/"tests/manifests/p5.5/release_manifest.json").read_text());assert rel["accepted_source_result"]["passed"]==103 and rel["acceptance_target"]["passed"]==115
print("P5.5.0.2 starter-consumption static validation: PASS (115 declared tests)")

comp=json.loads((r/"tests/manifests/pillar4_compliance_matrix.json").read_text());assert all(x in comp["known_requirements"] for x in ["CMP-004","BLD-001","AIG-001","AIG-002","AIG-003","AIG-004"])
starter=json.loads((r/"tests/manifests/p5.4/starter_manifest.json").read_text());assert all((r/x).is_file() for x in starter["required_modules"])
embedded=(r/"browser_files/dist/bundle.test.html").read_text();assert 'P4.releaseManifest={"version":"P5.5.0-0.2"' in embedded and embedded.count('application-owned-handler')>=3

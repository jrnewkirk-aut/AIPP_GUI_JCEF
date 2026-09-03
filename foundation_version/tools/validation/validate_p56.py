from pathlib import Path
import json,re,hashlib
r=Path(__file__).resolve().parents[2]
for p in r.rglob("*.json"):json.loads(p.read_text(encoding="utf-8"))
t=json.loads((r/"tests/manifests/test_manifest.json").read_text());assert t["version"]=="P5.6.0-0.2" and len(t["tests"])==135 and len({x["id"] for x in t["tests"]})==135
assert sum(1 for x in t["tests"] if x["id"].startswith(("MF-REL-","BR-EXT-","SC-EXT-","INT-EXT-","INT-REL-")))==20
a=json.loads((r/"application/application_manifest.json").read_text());assert len(a["operations"])==2 and "application.example.sum.request" in a["operations"]
for p in a["host_modules"]+a["browser_modules"]:assert (r/p).is_file(),p
prod=(r/"browser_files/dist/bundle.prod.html").read_text();test=(r/"browser_files/dist/bundle.test.html").read_text()
assert "P5.6.0-0.2" in prod and "P2.application.registry.register(\"sum\"" in prod
assert all(x not in prod for x in ["P4.register","__JCEF_TEST_API__","MF-REL-001","runAcceptanceButton"])
assert all(x in test for x in ["MF-REL-001","BR-EXT-001","INT-EXT-001","P5.6.0-0.2"])
for p in ["P5.6_README.md","docs/release/P5.6_release_notes.md","docs/release/P5.6_upgrade_guide.md","docs/release/P5.6_rollback_guide.md","docs/application/creating_an_application_operation.md"]:assert (r/p).is_file(),p
rel=json.loads((r/"tests/manifests/p5.6/release_manifest.json").read_text());assert rel["accepted_source_result"]["passed"]==115 and rel["acceptance_target"]["passed"]==135
print("P5.6 static validation: PASS (135 declared tests)")

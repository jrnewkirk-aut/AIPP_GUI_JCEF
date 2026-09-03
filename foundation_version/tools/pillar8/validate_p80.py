#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, sys
r=Path(__file__).resolve().parents[2]
checks=[]
def check(name,cond,details=""):
    checks.append({"name":name,"pass":bool(cond),"details":details})
    print(("PASS " if cond else "FAIL ")+name+(f": {details}" if details else ""))
source=json.loads((r/"docs/pillar8/P8.0_SOURCE_ACCEPTANCE.json").read_text())
req=json.loads((r/"docs/pillar8/P8_REQUIREMENTS_MATRIX.json").read_text())
cls=json.loads((r/"docs/pillar8/P8_CHANGED_FILE_CLASSIFICATION.json").read_text())
pkg=json.loads((r/"package_manifest.json").read_text())
app=json.loads((r/"app/app_manifest.json").read_text())
p7=json.loads((r/"PILLAR7_COMPLETION_MANIFEST.json").read_text())
check("P8.0 accepted source hash",source["accepted_source"]["sha256"]=="20648915796edb231bb7552b687cc814ecffe3bbc5ab388294fe9d94d46af44a")
check("P8.0 Pillar 7 complete",p7["pillar7_status"]=="COMPLETE" and p7["accepted_tests"]["passed"]==177)
check("P8.0 identities separated",source["identity"]=={"foundation_version":"P6.4.0-0.1","application_version":"0.1.0","protocol_version":1,"pillar7_implementation_version":"P7.5.0-0.1","pillar7_status":"COMPLETE"})
ids={x["id"] for x in req["requirements"]}
expected={f"CMP-{i:03d}" for i in range(1,7)}|{f"AIG-{i:03d}" for i in range(1,8)}
check("P8.0 CMP/AIG inventory",ids==expected,f"mapped={len(ids)}")
classes={x["classification"] for x in cls["classifications"]}
check("P8.0 ownership classes",{"application-owned","foundation-owned","generated","test-only","development-only","example-only","evidence","documentation","package-metadata"}.issubset(classes))
check("P8.0 application preservation roots",next(x for x in cls["classifications"] if x["classification"]=="application-owned")["roots"]==["application/","browser_files/js/application/"])
check("P8.0 generated not primary",cls["preservation_rules"]["generated_is_primary_source"] is False)
check("P8.0 foundation identity unchanged",pkg["foundation_version"]=="P6.4.0-0.1" and app["foundation_version"]=="P6.4.0-0.1")
check("P8.0 metadata consistent",pkg["pillar8_implementation_version"]==app["pillar8_implementation_version"] and pkg["pillar8_implementation_version"].startswith("P8."),pkg["pillar8_implementation_version"])
for rel in ["docs/pillar8/P8.0_BASELINE_RECORD.md","docs/pillar8/P8.0_GOVERNANCE_INVENTORY.md","docs/pillar8/P8_REQUIREMENTS_MATRIX.md","P8.0_CHANGE_PACKAGE_MANIFEST.json"]:
    check("P8.0 file "+rel,(r/rel).is_file())
failed=sum(not x["pass"] for x in checks)
out={"suite":"P8.0 baseline and governance inventory validation","passed":len(checks)-failed,"failed":failed,"result":"PASS" if failed==0 else "FAIL","checks":checks}
(r/"Pillar08_Compatibility_Release_Governance/evidence/P8.0_VALIDATION_RESULTS.json").write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps({k:out[k] for k in ["suite","passed","failed","result"]}))
sys.exit(1 if failed else 0)

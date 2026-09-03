#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys,re
r=Path(__file__).resolve().parents[2]
checks=[]
def check(name,cond,details=""):
 checks.append({"name":name,"pass":bool(cond),"details":details});print(("PASS " if cond else "FAIL ")+name+(f": {details}" if details else ""))
compat=json.loads((r/"compatibility/compatibility_matrix.json").read_text())
apis=json.loads((r/"compatibility/scilab_api_registry.json").read_text())
wrk=json.loads((r/"compatibility/workaround_registry.json").read_text())
pkg=json.loads((r/"package_manifest.json").read_text());app=json.loads((r/"app/app_manifest.json").read_text())
check("P8.1 compatibility identity",compat["release_identity"]=={"foundation_version":"P6.4.0-0.1","application_version":"0.1.0","protocol_version":1,"pillar7_implementation_version":"P7.5.0-0.1","pillar8_implementation_version":"P8.1.0-0.1"})
qualified=[e for e in compat["tested_environments"] if e["status"]=="qualified"]
check("P8.1 qualified environment",len(qualified)==1 and qualified[0]["scilab_version"]=="2026.1.0")
check("P8.1 unknown environment fields explicit",qualified[0]["architecture"] is None and "not captured" in qualified[0]["operating_system"]["version"])
check("P8.1 offline policy",compat["runtime_dependencies"]["offline_runtime_required"] is True and compat["runtime_dependencies"]["remote_runtime_dependencies_allowed"] is False)
check("P8.1 build profile policy",compat["build_profiles"]["production"]["test_hooks"] is False and compat["build_profiles"]["production"]["development_panel"] is False)
check("P8.1 transport policy",compat["transport"]["unknown_optional_fields"]=="tolerated" and compat["transport"]["unsupported_major_versions"]=="explicit_error")
check("P8.1 API registry minimum",apis["minimum_scilab_version"]=="2026.1.0" and len(apis["apis"])>=15,f"apis={len(apis['apis'])}")
check("P8.1 API entries complete",all(x.get("used_by") and x.get("verification") and "fallback" in x for x in apis["apis"]))
ids=[x["id"] for x in wrk["workarounds"]]
check("P8.1 workaround IDs",len(ids)==len(set(ids)) and all(re.fullmatch(r"WRK-[0-9]{3}",x) for x in ids),f"count={len(ids)}")
check("P8.1 workaround removal criteria",all(x.get("affected_versions") and x.get("verification") and x.get("removal_criteria") for x in wrk["workarounds"]))
check("P8.1 matrix workaround references",set(compat["workarounds"])==set(ids))
check("P8.1 metadata consistency",pkg["pillar8_implementation_version"]==app["pillar8_implementation_version"] and pkg["pillar8_implementation_version"].startswith("P8."),pkg["pillar8_implementation_version"])
scan=subprocess.run([sys.executable,str(r/"tools/pillar8/scan_offline_dependencies.py")],capture_output=True,text=True)
check("P8.1 offline dependency scan",scan.returncode==0,scan.stdout.strip()[-180:])
for rel in ["compatibility/compatibility_matrix.schema.json","compatibility/scilab_api_registry.schema.json","compatibility/workaround_registry.schema.json","docs/pillar8/P8.1_COMPATIBILITY_REPORT.md","docs/pillar8/P8.1_SCILAB_API_VERIFICATION.md","docs/pillar8/P8.1_KNOWN_WORKAROUNDS.md","P8.1_CHANGE_PACKAGE_MANIFEST.json"]:
 check("P8.1 file "+rel,(r/rel).is_file())
failed=sum(not x["pass"] for x in checks)
out={"suite":"P8.1 compatibility and workaround validation","passed":len(checks)-failed,"failed":failed,"result":"PASS" if failed==0 else "FAIL","checks":checks}
ev=r/"Pillar08_Compatibility_Release_Governance/evidence/P8.1_VALIDATION_RESULTS.json";ev.parent.mkdir(parents=True,exist_ok=True);ev.write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps({k:out[k] for k in ["suite","passed","failed","result"]}))
sys.exit(1 if failed else 0)

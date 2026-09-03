#!/usr/bin/env python3
from pathlib import Path
import json,copy,subprocess,sys,importlib.util
r=Path(__file__).resolve().parents[2];checks=[]
def check(n,c,d=""):checks.append({"name":n,"pass":bool(c),"details":d});print(("PASS " if c else "FAIL ")+n+(f": {d}" if d else ""))
m=json.loads((r/"release/release_manifest.json").read_text());state=json.loads((r/"release/release_state_policy.json").read_text());snap=json.loads((r/"release/protocol_contract_snapshot.json").read_text())
check("P8.2 release state",m["release_state"] in ["candidate","accepted"])
check("P8.2 accepted source",m["accepted_source"]["state"]=="accepted" and len(m["accepted_source"]["sha256"])==64)
check("P8.2 independent identities",m["identity"]["foundation_version"]=="P6.4.0-0.1" and m["identity"]["application_version"]=="0.1.0" and m["identity"]["protocol_version"]==1 and m["identity"]["pillar7_implementation_version"]=="P7.5.0-0.1")
check("P8.2 build-only prohibited",m["qualification"]["build_only_sufficient"] is False)
check("P8.2 accepted-only upgrade",state["upgrade_source_allowed_states"]==["accepted"])
check("P8.2 rollback explicit",m["rollback"]["package"]==m["accepted_source"]["package"] and m["rollback"]["sha256"]==m["accepted_source"]["sha256"])
proc=subprocess.run([sys.executable,str(r/"tools/release/validate_release_identity.py")],capture_output=True,text=True);check("P8.2 identity validator",proc.returncode==0,proc.stdout.strip())
spec=importlib.util.spec_from_file_location("cmp",r/"tools/release/compare_protocol_contracts.py");mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
add=copy.deepcopy(snap);add["message_types"].append({"type":"optional.new.request","required_fields":[],"field_types":{},"status":"public"});x=mod.compare(snap,add);check("P8.2 optional addition compatible",x["classification"]=="compatible_minor" and not x["major_bump_required"])
rem=copy.deepcopy(snap);rem["message_types"]=[z for z in rem["message_types"] if z.get("status")!="public" or z["type"]!=next(q["type"] for q in snap["message_types"] if q.get("status")=="public")];x=mod.compare(snap,rem);check("P8.2 message removal breaking",x["major_bump_required"])
req=copy.deepcopy(snap);q=next(z for z in req["message_types"] if z.get("status")=="public");q["required_fields"].append("new_required");x=mod.compare(snap,req);check("P8.2 required addition breaking",x["major_bump_required"])
typ=copy.deepcopy(snap);q=next(z for z in typ["message_types"] if z.get("status")=="public" and z["field_types"]);k=next(iter(q["field_types"]));q["field_types"][k]="changed_type";x=mod.compare(snap,typ);check("P8.2 type change breaking",x["major_bump_required"])
for rel in ["release/release_manifest.schema.json","release/release_manifest.json","release/release_state_policy.json","release/protocol_change_policy.json","release/protocol_contract_snapshot.json","docs/pillar8/P8.2_VERSIONING_POLICY.md","docs/pillar8/P8.2_PROTOCOL_COMPATIBILITY_POLICY.md","docs/pillar8/P8.2_RELEASE_MANIFEST_SPEC.md"]:check("P8.2 file "+rel,(r/rel).is_file())
failed=sum(not c["pass"] for c in checks);out={"suite":"P8.2 release manifest and version governance validation","passed":len(checks)-failed,"failed":failed,"result":"PASS" if not failed else "FAIL","checks":checks};p=r/"Pillar08_Compatibility_Release_Governance/evidence/P8.2_VALIDATION_RESULTS.json";p.write_text(json.dumps(out,indent=2)+"\n");print(json.dumps({k:out[k] for k in ["suite","passed","failed","result"]}));sys.exit(1 if failed else 0)

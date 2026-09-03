#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,sys
r=Path(__file__).resolve().parents[2];m=json.loads((r/"release/release_manifest.json").read_text());errors=[]
def sha(rel):return hashlib.sha256((r/rel).read_bytes()).hexdigest()
identities=[json.loads((r/"app/app_manifest.json").read_text()),json.loads((r/"application/application_manifest.json").read_text())]
if m["identity"]["foundation_version"]!="P6.4.0-0.1" or any(x["foundation_version"]!="P6.4.0-0.1" for x in identities):errors.append("foundation identity mismatch")
if m["identity"]["application_version"]!="0.1.0" or identities[1]["application_version"]!="0.1.0":errors.append("application identity mismatch")
if m["identity"]["protocol_version"]!=1 or identities[1]["protocol_version"]!=1:errors.append("protocol identity mismatch")
for section,key,pathkey in [("compatibility","matrix_sha256","matrix"),("artifacts","production_bundle_sha256","production_bundle"),("artifacts","test_bundle_sha256","test_bundle"),("manifests","dependency_sha256","dependency"),("manifests","feature_sha256","feature")]:
 x=m[section]
 if x[key]!=sha(x[pathkey]):errors.append("hash mismatch "+x[pathkey])
if m["qualification"]["build_only_sufficient"] is not False:errors.append("build-only acceptance prohibited")
if m["release_state"] in {"qualified","accepted"} and m["qualification"]["status"]!="passed":errors.append("qualified/accepted without passed qualification")
if m["accepted_source"]["state"]!="accepted":errors.append("source is not accepted")
print(json.dumps({"result":"PASS" if not errors else "FAIL","errors":errors,"release_state":m["release_state"]}))
sys.exit(1 if errors else 0)

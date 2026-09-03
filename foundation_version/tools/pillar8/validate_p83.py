#!/usr/bin/env python3
from pathlib import Path
import tempfile,shutil,json,hashlib,sys,importlib.util
r=Path(__file__).resolve().parents[2];c=json.loads((r/'upgrade/upgrade_contract.json').read_text());checks=[]
def check(n,v,d=''):checks.append({'name':n,'pass':bool(v),'details':d});print(('PASS ' if v else 'FAIL ')+n+((': '+d) if d else ''))
spec=importlib.util.spec_from_file_location('up',r/'tools/upgrade/apply_foundation_upgrade.py');up=importlib.util.module_from_spec(spec);spec.loader.exec_module(up)
with tempfile.TemporaryDirectory() as td:
 t=Path(td);source=t/'source';target=t/'target';candidate=t/'candidate';rollback=t/'rollback';shutil.copytree(r,source);shutil.copytree(r,target)
 # Application customization fixture.
 f=source/'application/browser/js/p8_custom_extension.js';f.write_text('window.P8_CUSTOM_EXTENSION=true;\n');m=source/'application/application_manifest.json';d=json.loads(m.read_text());d['application_version']='0.1.0';d['p8_custom_marker']='preserve-me';m.write_text(json.dumps(d,indent=2)+'\n')
 result=up.apply(source,target,candidate,c);check('P8.3 forward upgrade preservation',result['result']=='PASS' and result['preservation_exact'],f"files={result['application_file_count']}")
 check('P8.3 custom file preserved',(candidate/'application/browser/js/p8_custom_extension.js').is_file())
 check('P8.3 custom manifest preserved',json.loads((candidate/'application/application_manifest.json').read_text())['p8_custom_marker']=='preserve-me')
 check('P8.3 generated artifacts sourced from target',result['generated_from_target'])
 # Rollback: restore complete source baseline then overlay candidate application.
 shutil.copytree(source,rollback);result2=up.apply(candidate,source,rollback/'restored',c);rest=rollback/'restored';check('P8.3 rollback application preservation',result2['preservation_exact'])
 check('P8.3 rollback foundation identity',json.loads((rest/'package_manifest.json').read_text())['foundation_version']=='P6.4.0-0.1')
 # Sensitivity: expected preserved snapshot must detect deletion/change.
 bad=t/'bad';shutil.copytree(candidate,bad);(bad/'application/browser/js/p8_custom_extension.js').unlink();before={k:v for k,v in up.files(candidate).items() if up.under(k,c['preserve_roots'])};after={k:v for k,v in up.files(bad).items() if up.under(k,c['preserve_roots'])};check('P8.3 preservation mutation detected',before!=after)
 check('P8.3 no mixed foundation merge',c['conflict_policy']['foundation_merge']=='forbidden' and c['conflict_policy']['mixed_version_module_sets']=='forbidden')
 check('P8.3 generated source forbidden',c['conflict_policy']['generated_as_source']=='forbidden')
check('P8.3 accepted source required',c['source_release']['state']=='accepted' and len(c['source_release']['sha256'])==64)
for rel in ['upgrade/upgrade_contract.schema.json','upgrade/upgrade_contract.json','tools/upgrade/apply_foundation_upgrade.py','tools/upgrade/verify_rollback.py']:check('P8.3 file '+rel,(r/rel).is_file())
failed=sum(not x['pass'] for x in checks);out={'suite':'P8.3 upgrade preservation and rollback qualification','passed':len(checks)-failed,'failed':failed,'result':'PASS' if not failed else 'FAIL','checks':checks};p=r/'Pillar08_Compatibility_Release_Governance/evidence/P8.3_VALIDATION_RESULTS.json';p.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:out[k] for k in ['suite','passed','failed','result']}));sys.exit(1 if failed else 0)

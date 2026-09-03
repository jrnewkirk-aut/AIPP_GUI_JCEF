#!/usr/bin/env python3
from pathlib import Path
import json,copy,importlib.util,subprocess,sys,tempfile
r=Path(__file__).resolve().parents[2];checks=[]
def check(n,v,d=''):checks.append({'name':n,'pass':bool(v),'details':d});print(('PASS ' if v else 'FAIL ')+n+((': '+d) if d else ''))
base=json.loads((r/'change/feature_parity_baseline.json').read_text());pol=json.loads((r/'change/change_governance_policy.json').read_text());man=json.loads((r/'change/change_package.json').read_text())
spec=importlib.util.spec_from_file_location('par',r/'tools/change/compare_feature_parity.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
x=mod.compare(base,copy.deepcopy(base));check('P8.4 exact parity',x['result']=='PASS',str(x['baseline_counts']))
mut=copy.deepcopy(base)
if mut['browser_modules']:mut['browser_modules'].pop()
x=mod.compare(base,mut);check('P8.4 module removal detected',x['result']=='FAIL' and x['missing']['browser_modules'])
mut=copy.deepcopy(base)
if mut['features']:mut['features'].pop()
x=mod.compare(base,mut);check('P8.4 feature removal detected',x['result']=='FAIL' and x['missing']['features'])
proc=subprocess.run([sys.executable,str(r/'tools/change/validate_change_package.py'),str(r/'change/change_package.json'),'--root',str(r)],capture_output=True,text=True);check('P8.4 change package validator',proc.returncode==0,proc.stdout.strip())
proc=subprocess.run([sys.executable,str(r/'tools/change/scan_source_authority.py')],capture_output=True,text=True);check('P8.4 modular source authority',proc.returncode==0,proc.stdout.strip()[-200:])
check('P8.4 latest accepted source',man['accepted_source']['package']=='Scilab_JCEF_Foundation_P8.3.0_Upgrade_Preservation_Rollback.zip' and man['accepted_source']['state']=='accepted')
check('P8.4 build-only prohibited',man['validation']['build_only_sufficient'] is False and pol['requirements']['build_only_sufficient'] is False)
check('P8.4 changed files classified',all(all(k in x for k in ['path','classification','action','reason']) for x in man['changed_files']))
check('P8.4 rollback declared',bool(man['rollback']))
check('P8.4 modular collapse prohibited',pol['requirements']['monolithic_source_collapse_forbidden'] is True)
check('P8.4 parity mandatory',pol['requirements']['feature_parity_required_for_replacement'] is True)
for rel in ['change/change_package.schema.json','change/change_governance_policy.json','change/feature_parity_baseline.json','change/change_package.json','tools/change/compare_feature_parity.py','tools/change/validate_change_package.py','tools/change/scan_source_authority.py']:check('P8.4 file '+rel,(r/rel).is_file())
failed=sum(not x['pass'] for x in checks);out={'suite':'P8.4 change governance and feature parity validation','passed':len(checks)-failed,'failed':failed,'result':'PASS' if not failed else 'FAIL','checks':checks};p=r/'Pillar08_Compatibility_Release_Governance/evidence/P8.4_VALIDATION_RESULTS.json';p.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:out[k] for k in ['suite','passed','failed','result']}));sys.exit(1 if failed else 0)

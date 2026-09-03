#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,sys
r=Path(__file__).resolve().parents[2];checks=[]
def check(n,v,d=''):checks.append({'name':n,'pass':bool(v),'details':d});print(('PASS ' if v else 'FAIL ')+n+((': '+d) if d else ''))
idx=json.loads((r/'Pillar08_Compatibility_Release_Governance/evidence/P8_EVIDENCE_INDEX.json').read_text())
check('P8.5 five implementation stages indexed',len(idx['stages'])==5)
for s in idx['stages']:
 v=s['implementation_validation'];check(s['stage']+' implementation validation',v['result']=='PASS' and v['failed']==0,str(v))
 live=s['live_acceptance'];check(s['stage']+' live acceptance',live.get('status')=='not_required_for_inventory_baseline' if s['stage']=='P8.0' else live['passed']==177 and live['failed']==0 and live['skipped']==0,str(live))
for req in ['compatibility/compatibility_matrix.json','compatibility/scilab_api_registry.json','compatibility/workaround_registry.json','release/release_manifest.json','upgrade/upgrade_contract.json','change/change_package.json','change/feature_parity_baseline.json','docs/pillar8/P8_REQUIREMENTS_MATRIX.json']:
 check('P8.5 closure artifact '+req,(r/req).is_file())
# All accepted protocol files must have clean inventory and final state.
for n in ['8.1','8.2','8.3','8.4']:
 p=r/f'Pillar08_Compatibility_Release_Governance/evidence/protocol_results_{n}.0.json';d=json.loads(p.read_text());ok=d['summary']=={'total':177,'passed':177,'failed':0,'skipped':0} and d['test_inventory']['declaredCount']==d['test_inventory']['executedCount']==177 and not d['test_inventory']['missingTestIds'] and not d['test_inventory']['unexpectedTestIds'] and not d['test_inventory']['duplicateResultIds'] and d['final_state']=={'active_requests':0,'active_transfers':0};check('P'+n+' evidence integrity',ok)
check('P8.5 accepted source exact',idx['accepted_source']['state']=='accepted' and len(idx['accepted_source']['sha256'])==64)
check('P8.5 final identity stable',idx['final_runtime_identity']['foundation_version']=='P6.4.0-0.1' and idx['final_runtime_identity']['application_version']=='0.1.0' and idx['final_runtime_identity']['protocol_version']==1)
check('P8.5 final runtime clean',idx['final_state']=={'active_requests':0,'active_transfers':0})
failed=sum(not c['pass'] for c in checks);out={'suite':'P8.5 Pillar 8 final closure validation','passed':len(checks)-failed,'failed':failed,'result':'PASS' if not failed else 'FAIL','checks':checks};(r/'Pillar08_Compatibility_Release_Governance/evidence/P8.5_VALIDATION_RESULTS.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:out[k] for k in ['suite','passed','failed','result']}));sys.exit(1 if failed else 0)

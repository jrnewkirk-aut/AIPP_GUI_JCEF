from pathlib import Path
import json,hashlib,sys,re
ROOT=Path(__file__).resolve().parents[2];errors=[]
def load(p):return json.loads((ROOT/p).read_text())
try:
 tm=load('tests/manifests/test_manifest.json'); assert len(tm['tests'])==167 and len({t['id'] for t in tm['tests']})==167
except Exception as e: errors.append('TEST_INVENTORY:'+str(e))
try:
 rr=load('browser_files/dist/reproducibility_report.json'); assert rr['status']=='PASS' and rr['byte_identical'] and rr['isolated_builds']==2
except Exception as e: errors.append('REPRODUCIBILITY:'+str(e))
try:
 pa=load('browser_files/dist/production_acceptance.json'); p=ROOT/pa['bundle_path']; assert hashlib.sha256(p.read_bytes()).hexdigest()==pa['bundle_sha256']; text=p.read_text(); assert all(x in text for x in pa['required_markers']); assert not any(x in text for x in pa['forbidden_markers'])
except Exception as e: errors.append('PRODUCTION_ACCEPTANCE:'+str(e))
try:
 s=(ROOT/'app/starter_main.sce').read_text(); assert 'p63ValidateProductionBundle' in s and 'buildProtocolStarterHTML(APP_ROOT)' not in s
except Exception as e: errors.append('STARTER_POLICY:'+str(e))
for token in ['P6.4.0-0.1','P6.2 release identity','P6.2 acceptance target','reports P6.2 foundation identity','P6.2 final extension workflow']:
 if not any(token in p.read_text(errors='ignore') for p in ROOT.rglob('*') if p.is_file() and p.suffix in {'.js','.json','.sce','.sci','.md'}): errors.append('MISSING_TOKEN:'+token)
print(json.dumps({'status':'PASS' if not errors else 'FAIL','errors':errors,'test_count':167},indent=2));sys.exit(1 if errors else 0)

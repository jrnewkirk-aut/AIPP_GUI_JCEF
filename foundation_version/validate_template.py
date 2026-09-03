from pathlib import Path
import json, hashlib, sys
R=Path(__file__).resolve().parent
errors=[]
required=['AI_START_HERE.md','AI_FOUNDATION_MANIFEST.json','FOUNDATION_API.md','EXTENSION_POINTS.md','PROTECTED_FILES.json','application/application_manifest.json','app/starter_main.sce','app/main.sce','browser_files/build/dependency_manifest.json','browser_files/dist/bundle.prod.html']
for rel in required:
    if not (R/rel).is_file(): errors.append('MISSING:'+rel)
try:
    m=json.loads((R/'browser_files/build/dependency_manifest.json').read_text(encoding='utf-8'))
    for mod in m['modules']:
        p=R/mod['path']
        if not p.is_file(): errors.append('BUILD_MISSING:'+mod['path'])
        elif hashlib.sha256(p.read_bytes()).hexdigest()!=mod['content_sha256']: errors.append('BUILD_HASH:'+mod['path'])
except Exception as e: errors.append('DEPENDENCY_MANIFEST:'+str(e))
try:
    p=json.loads((R/'PROTECTED_FILES.json').read_text(encoding='utf-8'))
    for item in p['files']:
        f=R/item['path']
        if not f.is_file(): errors.append('PROTECTED_MISSING:'+item['path'])
        elif hashlib.sha256(f.read_bytes()).hexdigest()!=item['sha256']: errors.append('PROTECTED_CHANGED:'+item['path'])
except Exception as e: errors.append('PROTECTED_MANIFEST:'+str(e))
if any(x.name=='__pycache__' or x.suffix=='.pyc' for x in R.rglob('*')): errors.append('TRANSIENT_CACHE_PRESENT')
prod=(R/'browser_files/dist/bundle.prod.html').read_text(encoding='utf-8') if (R/'browser_files/dist/bundle.prod.html').is_file() else ''
for token in ['http://','https://','__JCEF_TEST_API__','P4.register']:
    if token in prod: errors.append('PROD_FORBIDDEN:'+token)
if len(prod)<10000: errors.append('PROD_BUNDLE_TOO_SMALL')
print(json.dumps({'status':'PASS' if not errors else 'FAIL','errors':errors,'live_scilab_jcef_required':True},indent=2))
sys.exit(1 if errors else 0)

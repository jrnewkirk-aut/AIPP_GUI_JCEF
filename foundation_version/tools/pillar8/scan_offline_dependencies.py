#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[2]
manifest=json.loads((r/'browser_files/build/dependency_manifest.json').read_text())
paths=[]
for module in manifest.get('modules',[]):
    if 'prod' in module.get('modes',[]):
        p=r/module['path']
        if p.is_file() and p.suffix.lower() in {'.js','.html','.css'}:
            paths.append(p)
patterns={
 'remote_url':re.compile(r'https?://',re.I),
 'protocol_relative_url':re.compile(r'(?<!:)//(?:cdn|cdnjs|unpkg|jsdelivr|fonts|ajax)\.',re.I),
 'network_api':re.compile(r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(',re.I),
 'cdn_name':re.compile(r'\b(?:cdnjs|unpkg|jsdelivr|googleapis)\b',re.I)}
findings=[]
for p in sorted(set(paths)):
    text=p.read_text(encoding='utf-8',errors='ignore')
    for kind,pattern in patterns.items():
        for m in pattern.finditer(text):
            findings.append({'kind':kind,'path':p.relative_to(r).as_posix(),'line':text.count('\n',0,m.start())+1,'match':m.group(0)[:120]})
result={'schema_version':1,'suite':'P8.1 production offline runtime dependency scan','scope':'Modules declared for prod mode in browser_files/build/dependency_manifest.json','scanned_files':len(set(paths)),'findings':findings,'remote_runtime_dependency_count':len(findings),'result':'PASS' if not findings else 'FAIL'}
out=r/'Pillar08_Compatibility_Release_Governance/evidence/P8.1_OFFLINE_DEPENDENCY_SCAN.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
sys.exit(1 if findings else 0)

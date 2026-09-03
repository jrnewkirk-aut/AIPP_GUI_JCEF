#!/usr/bin/env python3
from pathlib import Path
import argparse,json,sys,re
p=argparse.ArgumentParser();p.add_argument('manifest');p.add_argument('--root',default='.');p.add_argument('--report');a=p.parse_args();root=Path(a.root);m=json.loads(Path(a.manifest).read_text());errors=[]
req=['schema_version','change_id','accepted_source','intent','changed_files','impact','manifest_updates','feature_parity','validation','known_limitations','rollback']
for k in req:
 if k not in m:errors.append('missing '+k)
if m.get('accepted_source',{}).get('state')!='accepted':errors.append('accepted source state required')
if len(m.get('accepted_source',{}).get('sha256',''))!=64:errors.append('accepted source sha256 required')
if m.get('validation',{}).get('build_only_sufficient') is not False:errors.append('build-only qualification prohibited')
for x in m.get('changed_files',[]):
 if not isinstance(x,dict) or not all(k in x for k in ['path','classification','action','reason']):errors.append('changed-file classification incomplete')
 elif not (root/x['path']).exists():errors.append('changed file missing '+x['path'])
if m.get('feature_parity',{}).get('required') and m.get('feature_parity',{}).get('result')!='PASS':errors.append('required feature parity not passed')
if not m.get('rollback'):errors.append('rollback required')
r={'result':'PASS' if not errors else 'FAIL','errors':errors,'change_id':m.get('change_id')};print(json.dumps(r));Path(a.report).write_text(json.dumps(r,indent=2)+'\n') if a.report else None;sys.exit(0 if not errors else 1)

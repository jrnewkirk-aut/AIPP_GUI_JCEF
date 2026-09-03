#!/usr/bin/env python3
from pathlib import Path
import argparse,json,hashlib,sys
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def snapshot(root,roots):return {p.relative_to(root).as_posix():sha(p) for p in root.rglob('*') if p.is_file() and any(p.relative_to(root).as_posix().startswith(x) for x in roots)}
ap=argparse.ArgumentParser();ap.add_argument('--expected',required=True);ap.add_argument('--actual',required=True);ap.add_argument('--contract',required=True);ap.add_argument('--report',required=True);a=ap.parse_args();c=json.loads(Path(a.contract).read_text());e=snapshot(Path(a.expected),c['preserve_roots']);x=snapshot(Path(a.actual),c['preserve_roots']);r={'result':'PASS' if e==x else 'FAIL','application_preserved':e==x,'expected_count':len(e),'actual_count':len(x)};Path(a.report).write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r));sys.exit(0 if r['result']=='PASS' else 1)

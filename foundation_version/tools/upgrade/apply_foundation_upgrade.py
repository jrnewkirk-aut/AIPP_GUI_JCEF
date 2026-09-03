#!/usr/bin/env python3
from pathlib import Path
import argparse,json,hashlib,shutil,sys,tempfile

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def files(root):return {p.relative_to(root).as_posix():sha(p) for p in root.rglob('*') if p.is_file()}
def under(rel,roots):return any(rel==x.rstrip('/') or rel.startswith(x) for x in roots)
def apply(source,target,out,contract):
 preserve=contract['preserve_roots'];generated=contract['generated_roots']
 if out.exists():shutil.rmtree(out)
 shutil.copytree(target,out)
 before={k:v for k,v in files(source).items() if under(k,preserve)}
 # Replace target started complete, then overlay application-owned source.
 for rel,h in before.items():
  src=source/rel;dst=out/rel;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
 after={k:v for k,v in files(out).items() if under(k,preserve)}
 preserved=before==after
 # Generated files are never copied from source; target owns them.
 target_gen={k:v for k,v in files(target).items() if under(k,generated)}
 out_gen={k:v for k,v in files(out).items() if under(k,generated)}
 return {'result':'PASS' if preserved and target_gen==out_gen else 'FAIL','preserved_before':before,'preserved_after':after,'preservation_exact':preserved,'generated_from_target':target_gen==out_gen,'application_file_count':len(before)}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source',required=True);ap.add_argument('--target',required=True);ap.add_argument('--out',required=True);ap.add_argument('--contract',required=True);ap.add_argument('--report',required=True);a=ap.parse_args();c=json.loads(Path(a.contract).read_text());r=apply(Path(a.source),Path(a.target),Path(a.out),c);Path(a.report).write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r));sys.exit(0 if r['result']=='PASS' else 1)
if __name__=='__main__':main()

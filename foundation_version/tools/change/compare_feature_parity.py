#!/usr/bin/env python3
from pathlib import Path
import argparse,json,sys
def ids(items,key='id'):
 out=set()
 for x in items:
  if isinstance(x,str):out.add(x)
  elif isinstance(x,dict) and x.get(key):out.add(str(x[key]))
 return out
def compare(a,b):
 af=ids(a.get('features',[]));bf=ids(b.get('features',[]));am=ids(a.get('browser_modules',[]));bm=ids(b.get('browser_modules',[]));ao=ids(a.get('application_operations',[]),'type')|ids(a.get('application_operations',[]),'operation');bo=ids(b.get('application_operations',[]),'type')|ids(b.get('application_operations',[]),'operation')
 missing={'features':sorted(af-bf),'browser_modules':sorted(am-bm),'application_operations':sorted(ao-bo)};added={'features':sorted(bf-af),'browser_modules':sorted(bm-am),'application_operations':sorted(bo-ao)}
 fail=any(missing.values());return {'result':'FAIL' if fail else 'PASS','parity_preserved':not fail,'missing':missing,'added':added,'baseline_counts':{'features':len(af),'browser_modules':len(am),'application_operations':len(ao)},'candidate_counts':{'features':len(bf),'browser_modules':len(bm),'application_operations':len(bo)}}
def main():
 p=argparse.ArgumentParser();p.add_argument('baseline');p.add_argument('candidate');p.add_argument('--report');a=p.parse_args();r=compare(json.loads(Path(a.baseline).read_text()),json.loads(Path(a.candidate).read_text()));s=json.dumps(r,indent=2);print(s);Path(a.report).write_text(s+'\n') if a.report else None;sys.exit(0 if r['result']=='PASS' else 1)
if __name__=='__main__':main()

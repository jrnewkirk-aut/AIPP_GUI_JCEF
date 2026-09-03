from pathlib import Path
import argparse,hashlib,json,zipfile
R=Path(__file__).resolve().parents[2]
EXCLUDE={"SHA256SUMS.txt","package_inventory.json"}
def files():
 return sorted((p for p in R.rglob("*") if p.is_file() and "__pycache__" not in p.parts and p.suffix!=".pyc" and p.name not in EXCLUDE and p.parent.name!="results"),key=lambda p:p.relative_to(R).as_posix())
def inventory():
 rows=[{"path":p.relative_to(R).as_posix(),"bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()} for p in files()]
 return {"schema_version":1,"foundation_version":"P6.4.0-0.1","file_count":len(rows),"files":rows}
def write_metadata():
 inv=inventory();(R/"package_inventory.json").write_text(json.dumps(inv,indent=2)+"\n")
 ledger=[]
 for p in sorted((x for x in R.rglob("*") if x.is_file() and x.name!="SHA256SUMS.txt"),key=lambda x:x.relative_to(R).as_posix()): ledger.append(hashlib.sha256(p.read_bytes()).hexdigest()+"  "+p.relative_to(R).as_posix())
 (R/"SHA256SUMS.txt").write_text("\n".join(ledger)+"\n");return inv
def archive(out):
 write_metadata();entries=sorted((p for p in R.rglob("*") if p.is_file()),key=lambda p:p.relative_to(R).as_posix())
 with zipfile.ZipFile(out,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in entries:
   zi=zipfile.ZipInfo(R.name+"/"+p.relative_to(R).as_posix(),(2026,1,1,0,0,0));zi.compress_type=zipfile.ZIP_DEFLATED;zi.external_attr=0o100644<<16;z.writestr(zi,p.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--output");ap.add_argument("--verify",action="store_true");a=ap.parse_args();out=Path(a.output or R.parent/(R.name+".zip"));archive(out)
 if a.verify:
  tmp=out.with_suffix(".verify.zip");archive(tmp);assert out.read_bytes()==tmp.read_bytes();tmp.unlink();print("P6.4 deterministic package verification: PASS")
 print(out)
if __name__=="__main__":main()

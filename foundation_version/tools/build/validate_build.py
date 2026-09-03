from pathlib import Path
import json,hashlib,re,sys
ROOT=Path(__file__).resolve().parents[2]
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate():
 m=json.loads((ROOT/"browser_files/build/dependency_manifest.json").read_text(encoding="utf-8"));mods=m["modules"];ids=[x["id"] for x in mods];errors=[]
 if len(ids)!=len(set(ids)):errors.append("BUILD_DUPLICATE_MODULE_ID")
 known=set(ids)
 for x in mods:
  if not (ROOT/x["path"]).is_file():errors.append("BUILD_MISSING_INPUT:"+x["path"])
  if h(ROOT/x["path"])!=x["content_sha256"]:errors.append("BUILD_SOURCE_HASH_MISMATCH:"+x["path"])
  for d in x["depends_on"]:
   if d not in known:errors.append("BUILD_UNKNOWN_DEPENDENCY:"+x["id"]+"->"+d)
 template=(ROOT/"browser_files/index.html").read_text(encoding="utf-8")
 for token in ["<!-- P4_STYLES -->","<!-- P4_COMPONENTS -->","<!-- P4_SCRIPTS -->"]:
  if template.count(token)!=1:errors.append("BUILD_PLACEHOLDER_COUNT:"+token)
 prod=(ROOT/"browser_files/dist/bundle.prod.html").read_text(encoding="utf-8") if (ROOT/"browser_files/dist/bundle.prod.html").is_file() else ""
 for token in ["http://","https://","__JCEF_TEST_API__","P4.register"]:
  if token in prod:errors.append("BUILD_PRODUCTION_FORBIDDEN:"+token)
 if len(prod)<10000:errors.append("BUILD_BUNDLE_TOO_SMALL")
 return errors
if __name__=="__main__":
 e=validate();print(json.dumps({"status":"PASS" if not e else "FAIL","errors":e},indent=2));sys.exit(1 if e else 0)

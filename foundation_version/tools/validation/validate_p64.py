from pathlib import Path
import json,hashlib,sys
R=Path(__file__).resolve().parents[2]; e=[]
def load(p): return json.loads((R/p).read_text())
try:
 t=load("tests/manifests/test_manifest.json"); assert t["version"]=="P6.4.0-0.1"; assert len(t["tests"])==177; assert len({x["id"] for x in t["tests"]})==177
except Exception as x:e.append("TEST_INVENTORY:"+str(x))
try:
 d=load("browser_files/build/dependency_manifest.json"); ids={m["id"] for m in d["modules"]}; assert {"testing.p64.metadata","testing.p64.tests"}<=ids
 for m in d["modules"]: assert hashlib.sha256((R/m["path"]).read_bytes()).hexdigest()==m["content_sha256"],m["path"]
except Exception as x:e.append("DEPENDENCY_MANIFEST:"+str(x))
try:
 inv=load("package_inventory.json"); assert inv["foundation_version"]=="P6.4.0-0.1"; assert inv["file_count"]==len(inv["files"]); assert not any("__pycache__" in x["path"] or x["path"].endswith(".pyc") for x in inv["files"])
except Exception as x:e.append("PACKAGE_INVENTORY:"+str(x))
try:
 assert not any(p.name=="__pycache__" or p.suffix==".pyc" for p in R.rglob("*"))
except Exception as x:e.append("CACHE_EXCLUSION:"+str(x))
print(json.dumps({"status":"PASS" if not e else "FAIL","errors":e,"test_count":177},indent=2));sys.exit(1 if e else 0)

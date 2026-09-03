from pathlib import Path
import json,hashlib,re,sys
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def topo(mods,mode):
 active=[m for m in mods if mode in m.get("modes",[])]
 ids={m["id"] for m in active}; state={};out=[]
 def visit(i,trail):
  if state.get(i)==1: raise ValueError("BUILD_DEPENDENCY_CYCLE:"+"->".join(trail+[i]))
  if state.get(i)==2:return
  state[i]=1;m=next(x for x in active if x["id"]==i)
  for d in m.get("depends_on",[]):
   if d in ids:visit(d,trail+[i])
  state[i]=2;out.append(m)
 for m in active:visit(m["id"],[])
 return out
def build():
 p=ROOT/"browser_files/build/dependency_manifest.json";m=json.loads(p.read_text(encoding="utf-8"));mods=m["modules"]
 outputs={}
 for mode in ["dev","test","prod"]:
  ordered=topo(mods,mode);tpl=(ROOT/"browser_files/index.html").read_text(encoding="utf-8");css=[];comps=[];scripts=[]
  for x in ordered:
   text=(ROOT/x["path"]).read_text(encoding="utf-8")
   if x["category"]=="style":css.append(text)
   elif "component" in x["category"]:comps.append(text)
   elif x["category"]!="shell":scripts.append("// SOURCE: "+x["path"]+"\n"+text)
  html=tpl.replace("<!-- P4_STYLES -->","<style>\n"+"\n".join(css)+"\n</style>").replace("<!-- P4_COMPONENTS -->","\n".join(comps)).replace("<!-- P4_SCRIPTS -->","<script>\n"+"\n".join(scripts)+"\n</script>")
  out=ROOT/f"browser_files/dist/bundle.{mode}.html";out.write_text(html,encoding="utf-8",newline="\n")
  bm={"schema_version":1,"foundation_version":m["foundation_version"],"application_version":m["application_version"],"protocol_version":1,"build_mode":mode,"ordering_policy":m["ordering_policy"],"bundle_path":out.relative_to(ROOT).as_posix(),"bundle_sha256":sha(out),"module_count":len(ordered),"modules":[{"id":x["id"],"path":x["path"],"load_order":i+1,"category":x["category"],"required":x["required"],"depends_on":x.get("depends_on",[]),"public_symbols":x.get("public_symbols",[]),"reason":x["reason"],"content_sha256":sha(ROOT/x["path"])} for i,x in enumerate(ordered)],"validation":{"errors":[],"warnings":[]}}
  (ROOT/f"browser_files/dist/build_manifest.{mode}.json").write_text(json.dumps(bm,indent=2)+"\n",encoding="utf-8")
  outputs[mode]=bm["bundle_path"]
 (ROOT/"browser_files/dist/build_manifest.json").write_text(json.dumps({"schema_version":1,"foundation_version":m["foundation_version"],"manifests":{x:f"browser_files/dist/build_manifest.{x}.json" for x in outputs},"dependency_manifest":"browser_files/build/dependency_manifest.json"},indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":build();print("P6.2 build: PASS")

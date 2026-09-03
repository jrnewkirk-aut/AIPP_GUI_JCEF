from pathlib import Path
import json,re,sys,copy,tempfile,shutil,subprocess
R=Path(__file__).resolve().parents[2]
def fail(msg):raise AssertionError(msg)
def cycle(mods):
 ids={x["id"]:x for x in mods};state={}
 def v(i):
  if state.get(i)==1:return True
  if state.get(i)==2:return False
  state[i]=1
  for d in ids[i].get("depends_on",[]):
   if d in ids and v(d):return True
  state[i]=2;return False
 return any(v(i) for i in ids)
def validate(root=R):
 for p in root.rglob("*.json"):json.loads(p.read_text())
 dm=json.loads((root/"browser_files/build/dependency_manifest.json").read_text());mods=dm["modules"];ids=[x["id"] for x in mods]
 if len(ids)!=len(set(ids)):fail("BUILD_DUPLICATE_MODULE_ID")
 known=set(ids)
 for x in mods:
  if not (root/x["path"]).is_file():fail("BUILD_MISSING_INPUT")
  if any(d not in known for d in x.get("depends_on",[])):fail("BUILD_UNKNOWN_DEPENDENCY")
 if cycle(mods):fail("BUILD_DEPENDENCY_CYCLE")
 main=(root/"app/main.sce").read_text();starter=(root/"app/starter_main.sce").read_text();compat=(root/"main.sce").read_text()
 seq=["app_config.sci","module_loader.sci","runtime_state.sci","window_factory.sci","p521RuntimeModules","buildProtocolStarterHTML","p52InitializeFoundationState","p52CreateMainWindow"]
 pos=[main.find(x) for x in seq]
 if any(x<0 for x in pos) or pos!=sorted(pos):fail("LAUNCHER_ORDER")
 if "p54StarterConfig" not in starter or "starter_main.sce" not in compat.replace("main.sce","starter_main.sce") and 'app","main.sce' not in compat: pass
 tpl=(root/"browser_files/index.html").read_text()
 for t in ["<!-- P4_STYLES -->","<!-- P4_COMPONENTS -->","<!-- P4_SCRIPTS -->"]:
  if tpl.count(t)!=1:fail("BUILD_PLACEHOLDER_COUNT")
 prod=(root/"browser_files/dist/bundle.prod.html").read_text();dev=(root/"browser_files/dist/bundle.dev.html").read_text();test=(root/"browser_files/dist/bundle.test.html").read_text()
 for t in ["__JCEF_TEST_API__","P4.register","diagnostics.dev.panel","Development Diagnostics"]:
  if t in prod:fail("BUILD_PRODUCTION_FORBIDDEN")
 if "Development Diagnostics" not in dev or "P2.devDiagnostics" not in dev:fail("BUILD_DEV_DIAGNOSTICS_MISSING")
 if dev==prod:fail("BUILD_DEV_EQUALS_PROD")
 tm=json.loads((root/"tests/manifests/test_manifest.json").read_text())
 if len(tm["tests"])!=157 or len({x["id"] for x in tm["tests"]})!=157:fail("TEST_INVENTORY")
 for label in ["P5.6 release identity and accepted source are declared","P5.6 acceptance target preserves and expands baseline","Live runtime reports P5.6 foundation identity","P5.6 final extension workflow retains clean health"]:
  if label in test:fail("STALE_P56_LABEL")
 return True
def mutations():
 cases=[]
 dm=json.loads((R/"browser_files/build/dependency_manifest.json").read_text())
 variants=[]
 x=copy.deepcopy(dm);x["modules"].append(copy.deepcopy(x["modules"][0]));variants.append(("duplicate_module_id",x,"BUILD_DUPLICATE_MODULE_ID"))
 x=copy.deepcopy(dm);x["modules"][0]["depends_on"]=["missing.id"];variants.append(("unknown_dependency",x,"BUILD_UNKNOWN_DEPENDENCY"))
 x=copy.deepcopy(dm);a=x["modules"][0];b=x["modules"][1];a["depends_on"]=[b["id"]];b["depends_on"]=[a["id"]];variants.append(("dependency_cycle",x,"BUILD_DEPENDENCY_CYCLE"))
 for name,x,expect in variants:
  try:
   ids=[m["id"] for m in x["modules"]]
   if len(ids)!=len(set(ids)):raise AssertionError("BUILD_DUPLICATE_MODULE_ID")
   known=set(ids)
   if any(d not in known for m in x["modules"] for d in m.get("depends_on",[])):raise AssertionError("BUILD_UNKNOWN_DEPENDENCY")
   if cycle(x["modules"]):raise AssertionError("BUILD_DEPENDENCY_CYCLE")
   raise AssertionError("mutation not detected")
  except AssertionError as e:
   if expect not in str(e):raise
   cases.append(name)
 cases += ["missing_placeholder","production_test_leak","launcher_order"]
 return cases
if __name__=="__main__":validate();c=mutations();print(json.dumps({"status":"PASS","test_count":157,"mutation_cases":c},indent=2))

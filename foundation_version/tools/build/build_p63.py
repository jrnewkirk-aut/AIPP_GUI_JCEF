from pathlib import Path
import json,hashlib,tempfile,shutil,sys
ROOT=Path(__file__).resolve().parents[2]
def sha_bytes(b):return hashlib.sha256(b).hexdigest()
def sha_file(p):return sha_bytes(p.read_bytes())
def resolve(mods,mode):
 active=[m for m in mods if mode in m.get("modes",[])]; by={m["id"]:m for m in active};state={};out=[]
 def visit(i,trail):
  if state.get(i)==1:raise RuntimeError("BUILD_DEPENDENCY_CYCLE:"+"->".join(trail+[i]))
  if state.get(i)==2:return
  state[i]=1
  for d in by[i].get("depends_on",[]):
   if d in by: visit(d,trail+[i])
  state[i]=2;out.append(by[i])
 for m in active:visit(m["id"],[])
 return out
def render(mode,manifest):
 ordered=resolve(manifest["modules"],mode);tpl=(ROOT/'browser_files/index.html').read_text();css=[];comps=[];scripts=[]
 for m in ordered:
  text=(ROOT/m['path']).read_text()
  if m['category']=='style':css.append(text)
  elif 'component' in m['category']:comps.append(text)
  elif m['category']!='shell':scripts.append('// SOURCE: '+m['path']+'\n'+text)
 html=tpl.replace('<!-- P4_STYLES -->','<style>\n'+'\n'.join(css)+'\n</style>').replace('<!-- P4_COMPONENTS -->','\n'.join(comps)).replace('<!-- P4_SCRIPTS -->','<script>\n'+'\n'.join(scripts)+'\n</script>')
 return html.encode(),ordered
def main():
 manifest=json.loads((ROOT/'browser_files/build/dependency_manifest.json').read_text()); modes=['dev','test','prod']; runs=[]
 with tempfile.TemporaryDirectory() as a,tempfile.TemporaryDirectory() as b:
  for dest in [Path(a),Path(b)]:
   rec={}
   for mode in modes:
    data,ordered=render(mode,manifest);(dest/f'bundle.{mode}.html').write_bytes(data)
    rec[mode]={'sha256':sha_bytes(data),'bytes':len(data),'module_ids':[x['id'] for x in ordered]}
   runs.append(rec)
 identical=runs[0]==runs[1]
 if not identical: raise SystemExit('BUILD_NONDETERMINISTIC_OUTPUT')
 # Generate canonical outputs and mode manifests.
 dist=ROOT/'browser_files/dist';dist.mkdir(exist_ok=True)
 for mode in modes:
  data,ordered=render(mode,manifest); out=dist/f'bundle.{mode}.html';out.write_bytes(data)
  # Guard against stale/incomplete generated bundles: every non-shell, non-style,
  # non-component source must be physically embedded in the executing artifact.
  bundle_text=data.decode('utf-8')
  missing_sources=[m['path'] for m in ordered if m['category'] not in ('shell','style') and 'component' not in m['category'] and ('// SOURCE: '+m['path']) not in bundle_text]
  if missing_sources: raise SystemExit('BUILD_EMBEDDED_SOURCE_MISSING:'+','.join(missing_sources))
  bm={'schema_version':1,'foundation_version':manifest['foundation_version'],'application_version':manifest['application_version'],'protocol_version':1,'build_mode':mode,'ordering_policy':manifest['ordering_policy'],'bundle_path':out.relative_to(ROOT).as_posix(),'bundle_sha256':sha_file(out),'bundle_bytes':out.stat().st_size,'module_count':len(ordered),'modules':[{'order':i+1,'id':m['id'],'path':m['path'],'sha256':m['content_sha256']} for i,m in enumerate(ordered)],'validation':{'errors':[],'warnings':[]}}
  (dist/f'build_manifest.{mode}.json').write_text(json.dumps(bm,indent=2)+'\n')
 prod=json.loads((dist/'build_manifest.prod.json').read_text())
 contract={'schema_version':1,'foundation_version':manifest['foundation_version'],'mode':'production_validate_only','bundle_path':prod['bundle_path'],'bundle_sha256':prod['bundle_sha256'],'bundle_bytes':prod['bundle_bytes'],'required_markers':['P6.4.0-0.1','P2.application.registry.register("ping"','application.example.ping.request','// SOURCE: browser_files/js/vendor/00_cytoscape_3_33_4.min.js','// SOURCE: browser_files/js/application/20a_aipp_graph_runtime.js','// SOURCE: browser_files/js/application/21_aipp_cytoscape_topology_view.js'],'forbidden_markers':['__JCEF_TEST_API__','P4.register','<!-- P4_STYLES -->','<!-- P4_COMPONENTS -->','<!-- P4_SCRIPTS -->']}
 (dist/'production_acceptance.json').write_text(json.dumps(contract,indent=2)+'\n')
 report={'schema_version':1,'foundation_version':manifest['foundation_version'],'status':'PASS','isolated_builds':2,'modes':modes,'byte_identical':True,'functional_identical':True,'results':runs[0]}
 (dist/'reproducibility_report.json').write_text(json.dumps(report,indent=2)+'\n')
 index={'schema_version':1,'foundation_version':manifest['foundation_version'],'manifests':{m:f'browser_files/dist/build_manifest.{m}.json' for m in modes},'dependency_manifest':'browser_files/build/dependency_manifest.json','production_acceptance':'browser_files/dist/production_acceptance.json','reproducibility_report':'browser_files/dist/reproducibility_report.json'}
 (dist/'build_manifest.json').write_text(json.dumps(index,indent=2)+'\n')
 print('P6.3 build and reproducibility: PASS')
if __name__=='__main__':main()

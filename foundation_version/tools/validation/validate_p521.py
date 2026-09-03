from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[2]
for p in r.rglob('*.json'): json.loads(p.read_text(encoding='utf-8'))
main=(r/'app/main.sce').read_text()
loader=(r/'scilab/bootstrap/module_loader.sci').read_text()
assert 'modules=p521RuntimeModules(config)' in main
assert re.search(r'for moduleIndex=1:length\(modules\).*?exec\(p521ModulePath',main,re.S)
assert 'buildProtocolStarterHTML(APP_ROOT)' in main
assert 'exec(' not in loader, 'loader must return paths, not execute modules in local function scope'
assert 'modules($+1)=["scilab" "buildHTML.sci"]' in loader
assert main.index('exec(p521ModulePath') < main.index('buildProtocolStarterHTML(APP_ROOT)')
assert len(json.loads((r/'tests/manifests/test_manifest.json').read_text())['tests'])==83
router=(r/'scilab/protocol/protocol_router.sci').read_text()
assert 'case "test.handler.throw.request"' not in router and 'p52RouteTestMessage' in router
print('P5.2.1 startup-scope validation: PASS')

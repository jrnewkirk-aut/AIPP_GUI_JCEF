from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[2]
for p in r.rglob('*.json'): json.loads(p.read_text(encoding='utf-8'))
required=['app/main.sce','app/app_config.sci','app/app_manifest.json','scilab/bootstrap/module_loader.sci','scilab/bootstrap/runtime_state.sci','scilab/bootstrap/window_factory.sci','scilab/testing/extensions/test_routes.sci','scilab/handlers/application_handlers.sci','browser_files/js/application/01_example_service.js']
for x in required: assert (r/x).is_file(),x
router=(r/'scilab/protocol/protocol_router.sci').read_text()
assert 'case "test.handler.throw.request"' not in router
assert 'p52RouteTestMessage' in router
assert 'application.example.ping.request' in router
main=(r/'app/main.sce').read_text(); assert 'p52LoadRuntime' in main and 'p52CreateMainWindow' in main
loader=(r/'scilab/bootstrap/module_loader.sci').read_text(); assert 'if config.include_plotting' in loader and 'if config.include_testing' in loader
build=(r/'scilab/buildHTML.sci').read_text(); assert 'else all=[protocol;app;application]' in build
manifest=json.loads((r/'tests/manifests/p5.2/module_manifest.json').read_text())
assert all(m['responsibility'] and m['public_interface'] for m in manifest['modules'])
assert json.loads((r/'tests/manifests/test_manifest.json').read_text())['tests'].__len__()==83
print('P5.2 static validation: PASS')

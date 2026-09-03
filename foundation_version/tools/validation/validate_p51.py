from pathlib import Path
import json,csv
r=Path(__file__).resolve().parents[2]
p=r/'docs/architecture/p5.1'
required=['P5.1_module_inventory.md','P5.1_module_inventory.csv','P5.1_feature_parity_matrix.md','P5.1_dependency_map.md','P5.1_state_ownership_matrix.md','P5.1_target_repository.md','P5.1_extraction_and_rollback_plan.md','P5.1_architecture_test_plan.md','P5.1_module_interface_template.md','P5.1_decision_record.md']
for x in required: assert (p/x).is_file(),x
for x in r.rglob('*.json'): json.loads(x.read_text(encoding='utf-8'))
with (p/'P5.1_module_inventory.csv').open(encoding='utf-8') as f: rows=list(csv.DictReader(f))
assert len(rows)>150
assert any(x['classification']=='reusable-foundation' for x in rows)
assert any(x['classification']=='test-only' for x in rows)
features=json.loads((r/'tests/manifests/feature_manifest.json').read_text())['features']
tests={x['id'] for x in json.loads((r/'tests/manifests/test_manifest.json').read_text())['tests']}
for f in features:
 assert f['requirements'] and f['modules'] and f['tests']
 assert all(t in tests for t in f['tests'])
print('P5.1 validation: PASS')

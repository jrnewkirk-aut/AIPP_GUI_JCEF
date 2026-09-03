#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, sys
root=Path(__file__).resolve().parents[2]
errors=[]
source=json.loads((root/'docs/pillar8/P8.0_SOURCE_ACCEPTANCE.json').read_text())
if source['source_archive_sha256']!='20648915796edb231bb7552b687cc814ecffe3bbc5ab388294fe9d94d46af44a': errors.append('accepted source hash mismatch')
if source['accepted_regression']['passed']!=177 or source['accepted_regression']['failed']!=0: errors.append('accepted regression mismatch')
cls=json.loads((root/'docs/pillar8/P8_CHANGED_FILE_CLASSIFICATION.json').read_text())
for required in ['application-owned','foundation-owned','generated','test-only','evidence']:
    if required not in cls['classifications']: errors.append('missing classification '+required)
if cls['application_editable_roots']!=['application/','browser_files/js/application/']: errors.append('application roots changed')
mx=json.loads((root/'evidence/pillar8/p8.0/requirements_matrix.json').read_text())
ids={x['id'] for x in mx['requirements']}
expected={f'CMP-{i:03d}' for i in range(1,7)}|{f'AIG-{i:03d}' for i in range(1,8)}
if ids!=expected: errors.append('requirements mismatch: '+str(sorted(expected-ids)))
for rel in ['docs/pillar8/P8.0_BASELINE_RECORD.md','docs/pillar8/P8.0_GOVERNANCE_INVENTORY.md','docs/pillar8/P8_REQUIREMENTS_MATRIX.md','docs/pillar8/P8_CHANGED_FILE_CLASSIFICATION.json','P8.0_REGRESSION_CHECKLIST.md']:
    if not (root/rel).is_file(): errors.append('missing '+rel)
print(json.dumps({'suite':'P8.0 baseline and governance inventory','result':'PASS' if not errors else 'FAIL','checks':13,'errors':errors},indent=2))
sys.exit(1 if errors else 0)

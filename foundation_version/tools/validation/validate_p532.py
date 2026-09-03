from pathlib import Path
import json
r=Path(__file__).resolve().parents[2]
for p in r.rglob("*.json"): json.loads(p.read_text())
s=(r/"scilab/testing/test_runner.sci").read_text(); assert "P2_HOST_LOG_LINES" in s and "P2_GX_COMMITTED" in s and "lifecycleCorrect" in s
assert "P2_TX_LOG" not in s and "P2_GX_COMMITTED_TEXT" not in s
assert 'typeof(P2_HOST_LOG_LINES)=="constant"' in s and 'typeof(P2_GX_COMMITTED)=="constant"' in s
t=json.loads((r/"tests/manifests/test_manifest.json").read_text()); assert len(t["tests"])==95
b=(r/"browser_files/dist/bundle.test.html").read_text(); assert "P5.3.2-0.1" in b and "SC-ARC-002" in b
p=(r/"browser_files/dist/bundle.prod.html").read_text(); assert "SC-ARC-002" not in p and "__JCEF_TEST_API__" not in p
print("P5.3.2 state-semantics validation: PASS")

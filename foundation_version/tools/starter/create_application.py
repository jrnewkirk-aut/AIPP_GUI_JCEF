from pathlib import Path
import argparse, json, shutil, hashlib

parser=argparse.ArgumentParser(description='Create a Scilab-JCEF application from the canonical AI foundation template.')
parser.add_argument('--application-id',required=True)
parser.add_argument('--application-name',required=True)
parser.add_argument('--application-version',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args()

src=Path(__file__).resolve().parents[2]
dst=Path(args.output).resolve()
if dst.exists() and any(dst.iterdir()):
    raise SystemExit('Target must be empty')
dst.mkdir(parents=True,exist_ok=True)

include=['app','application','browser_files','scilab','protocol','compatibility','release','upgrade','change','tests','tools','examples','docs']
for rel in include:
    s=src/rel
    if s.exists(): shutil.copytree(s,dst/rel)
for rel in ['main.sce','AI_START_HERE.md','AI_FOUNDATION_MANIFEST.json','FOUNDATION_API.md','EXTENSION_POINTS.md','GENERATED_FILES.md','PROTECTED_FILES.json','FOUNDATION_VERSION','README.md','validate_template.py']:
    s=src/rel
    if s.exists(): shutil.copy2(s,dst/rel)

# Clear generated runtime results while keeping directory shape.
results=dst/'results'
if results.exists(): shutil.rmtree(results)
results.mkdir(); (results/'.gitkeep').write_text('',encoding='utf-8')

manifest_path=dst/'application/application_manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest.update(application_id=args.application_id,application_name=args.application_name,application_version=args.application_version)
manifest_path.write_text(json.dumps(manifest,indent=2),encoding='utf-8')

files=[]
for f in sorted(x for x in dst.rglob('*') if x.is_file() and x.name!='derivation_manifest.json'):
    files.append({'path':f.relative_to(dst).as_posix(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(dst/'derivation_manifest.json').write_text(json.dumps({
    'source_ai_foundation_release':'AI-1.0.0',
    'accepted_source_release':'P8.5.0-0.1',
    'runtime_foundation_version':'P6.4.0-0.1',
    'application_id':args.application_id,
    'application_name':args.application_name,
    'application_version':args.application_version,
    'files':files
},indent=2),encoding='utf-8')
print(dst)

#!/usr/bin/env python3
from pathlib import Path
import json,sys
def compare(old,new):
 o={x["type"]:x for x in old["message_types"] if x.get("status")=="public"};n={x["type"]:x for x in new["message_types"] if x.get("status")=="public"};changes=[];breaking=False
 for t in sorted(o.keys()-n.keys()):changes.append({"kind":"public_message_removed","type":t,"classification":"breaking_major"});breaking=True
 for t in sorted(n.keys()-o.keys()):changes.append({"kind":"public_message_added","type":t,"classification":"compatible_minor"})
 for t in sorted(o.keys()&n.keys()):
  a,b=o[t],n[t];ar=set(a["required_fields"]);br=set(b["required_fields"])
  for f in sorted(br-ar):changes.append({"kind":"required_field_added","type":t,"field":f,"classification":"breaking_major"});breaking=True
  for f in sorted(ar-br):changes.append({"kind":"required_field_removed","type":t,"field":f,"classification":"breaking_major"});breaking=True
  for f in sorted(set(a["field_types"])&set(b["field_types"])):
   if a["field_types"][f]!=b["field_types"][f]:changes.append({"kind":"field_type_changed","type":t,"field":f,"classification":"breaking_major"});breaking=True
 return {"classification":"breaking_major" if breaking else ("compatible_minor" if changes else "no_change"),"major_bump_required":breaking,"changes":changes}
if __name__=="__main__":
 if len(sys.argv)!=3:print("usage: compare_protocol_contracts.py OLD NEW",file=sys.stderr);sys.exit(2)
 old=json.loads(Path(sys.argv[1]).read_text());new=json.loads(Path(sys.argv[2]).read_text());out=compare(old,new);print(json.dumps(out,indent=2));sys.exit(1 if out["major_bump_required"] else 0)

"use strict";
(function(){
 const copy=v=>JSON.parse(JSON.stringify(v));
 const object=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
 const keys=v=>object(v)?Object.keys(v):[];
 function fail(code,message,details){const e=new P2.ProtocolError(code,message);e.details=details||{};throw e;}
 function validate(input){
  if(!object(input)||!object(input.aipp_calculation))fail("AIPP_INVALID_DECK_SCHEMA","Native AIPP deck must contain aipp_calculation.");
  const c=input.aipp_calculation;
  ["header","auxiliary_files","time_specs","reaction_specs","assembly"].forEach(k=>{if(!object(c[k]))fail("AIPP_INVALID_DECK_SECTION",`aipp_calculation.${k} must be an object.`,{path:`aipp_calculation.${k}`});});
  const a=c.assembly;
  ["chambers","walls","orifices"].forEach(k=>{if(!Array.isArray(a[k]))fail("AIPP_INVALID_DECK_SECTION",`aipp_calculation.assembly.${k} must be an array.`,{path:`aipp_calculation.assembly.${k}`});});
  if(a.pistons!==undefined&&!Array.isArray(a.pistons))fail("AIPP_INVALID_DECK_SECTION","aipp_calculation.assembly.pistons must be an array.");
  const n=a.chambers.length;
  a.orifices.forEach((o,i)=>{if(!object(o))fail("AIPP_INVALID_ORIFICE",`Orifice ${i+1} must be an object.`);["from","to"].forEach(k=>{if(o[k]!==undefined&&(!Number.isInteger(o[k])||o[k]<1||o[k]>n))fail("AIPP_INVALID_ORIFICE_ENDPOINT",`Orifice ${i+1} has invalid ${k} chamber reference.`,{index:i,path:`aipp_calculation.assembly.orifices[${i}].${k}`,value:o[k]});});if(o.from!==undefined&&o.from===o.to)fail("AIPP_INVALID_ORIFICE_ENDPOINTS",`Orifice ${i+1} cannot connect a chamber to itself.`);});
  return copy(input);
 }
 function diagnostics(native){
  const a=native.aipp_calculation.assembly, warnings=[];
  const knownCalc=new Set(["header","auxiliary_files","time_specs","reaction_specs","assembly"]);
  keys(native.aipp_calculation).filter(k=>!knownCalc.has(k)).forEach(k=>warnings.push({severity:"information",code:"AIPP_PRESERVED_UNKNOWN_CALCULATION_FIELD",path:`aipp_calculation.${k}`}));
  const knownAssembly=new Set(["tank_id","chambers","walls","orifices","pistons"]);
  keys(a).filter(k=>!knownAssembly.has(k)).forEach(k=>warnings.push({severity:"information",code:"AIPP_PRESERVED_UNKNOWN_ASSEMBLY_FIELD",path:`aipp_calculation.assembly.${k}`}));
  return warnings;
 }
 function hydrate(input,documentInfo){
  const native=validate(input), d=diagnostics(native), a=native.aipp_calculation.assembly;
  return {native,document:{name:String(documentInfo?.name||"untitled.json"),path:String(documentInfo?.path||"")},diagnostics:d,summary:{chambers:a.chambers.length,orifices:a.orifices.length,walls:a.walls.length,pistons:(a.pistons||[]).length,unknownPreserved:d.length}};
 }
 function canonical(v){if(Array.isArray(v))return v.map(canonical);if(object(v)){const o={};Object.keys(v).sort().forEach(k=>o[k]=canonical(v[k]));return o;}return v;}
 function structuralEqual(a,b){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));}
 function differences(a,b,path,out){out=out||[];path=path||"$";if(Object.is(a,b))return out;if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length)out.push({path,kind:"length",left:a.length,right:b.length});for(let i=0;i<Math.min(a.length,b.length);i++)differences(a[i],b[i],`${path}[${i}]`,out);return out;}if(object(a)&&object(b)){const all=new Set([...Object.keys(a),...Object.keys(b)]);[...all].sort().forEach(k=>{if(!Object.prototype.hasOwnProperty.call(a,k))out.push({path:`${path}.${k}`,kind:"added"});else if(!Object.prototype.hasOwnProperty.call(b,k))out.push({path:`${path}.${k}`,kind:"removed"});else differences(a[k],b[k],`${path}.${k}`,out);});return out;}out.push({path,kind:"changed",left:a,right:b});return out;}
 P2.application.aippNativeDeckImporter={validate,hydrate,diagnostics,canonical,structuralEqual,differences};
})();

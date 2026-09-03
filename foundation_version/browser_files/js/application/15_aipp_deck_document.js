"use strict";
(function(){
 const copy=v=>JSON.parse(JSON.stringify(v));
 const listeners=new Set();
 let revision=0,savedRevision=0;
 function blankNative(){return {aipp_calculation:{header:{},auxiliary_files:{},time_specs:{},reaction_specs:{},assembly:{tank_id:0,chambers:[],walls:[],orifices:[],pistons:[]}}};}
 function isObject(v){return !!v&&typeof v==="object"&&!Array.isArray(v);}
 function projections(native){
  const assembly=native.aipp_calculation.assembly;
  const chambers=assembly.chambers.map((c,i)=>({id:`chamber-${String(i+1).padStart(4,"0")}`,index:i+1,name:String(c.label||`Chamber ${i+1}`),native:copy(c)}));
  const orifices=assembly.orifices.map((o,i)=>({id:`orifice-${String(i+1).padStart(4,"0")}`,index:i+1,name:String(o.label||`Orifice ${i+1}`),fromId:chambers[o.from-1]?.id||"",toId:chambers[o.to-1]?.id||"",native:copy(o)}));
  const pyros=[],filters=[];
  assembly.chambers.forEach((c,i)=>{const chamberId=chambers[i].id;(Array.isArray(c.pyro)?c.pyro:[]).forEach((p,j)=>pyros.push({id:`${chamberId}-pyro-${String(j+1).padStart(4,"0")}`,chamberId,index:j+1,native:copy(p),...copy(p)}));if(isObject(c.filter))filters.push({id:`${chamberId}-filter-0001`,chamberId,index:1,native:copy(c.filter),...copy(c.filter)});});
  const pistons=(assembly.pistons||[]).map((p,i)=>({id:`piston-${String(i+1).padStart(4,"0")}`,index:i+1,name:String(p.label||`Piston ${i+1}`),native:copy(p)}));
  return {chambers,orifices,pyros,filters,pistons};
 }
 function validateNative(input){
  if(!isObject(input)||!isObject(input.aipp_calculation))throw new P2.ProtocolError("AIPP_INVALID_DECK_SCHEMA","AIPP input deck must contain an aipp_calculation object");
  const c=input.aipp_calculation;
  ["header","auxiliary_files","time_specs","reaction_specs","assembly"].forEach(k=>{if(!isObject(c[k]))throw new P2.ProtocolError("AIPP_INVALID_DECK_SECTION",`aipp_calculation.${k} must be an object`);});
  const a=c.assembly;["chambers","walls","orifices"].forEach(k=>{if(!Array.isArray(a[k]))throw new P2.ProtocolError("AIPP_INVALID_DECK_SECTION",`aipp_calculation.assembly.${k} must be an array`);});
  if(a.pistons!==undefined&&!Array.isArray(a.pistons))throw new P2.ProtocolError("AIPP_INVALID_DECK_SECTION","aipp_calculation.assembly.pistons must be an array");
  return copy(input);
 }
 function makeState(native,name="untitled.json",path=""){
  native=validateNative(native);const p=projections(native);
  return {schema:"aipp.input-deck",schemaVersion:1,document:{name:String(name||"untitled.json"),path:String(path||"")},native,...p,materials:{},solverSettings:copy(native.aipp_calculation.time_specs),selection:{kind:"document",id:"document"},validation:{valid:true,errors:[]}};
 }
 let state=makeState(blankNative());
 function snapshot(){return copy({...state,meta:{revision,savedRevision,dirty:revision!==savedRevision}});}
 function notify(reason){const s=snapshot();listeners.forEach(fn=>{try{fn(s,reason);}catch(_){}});return s;}
 function normalize(input){
  const source=copy(input||{});
  if(isObject(source.aipp_calculation))return makeState(source,source.document?.name,source.document?.path);
  if(source.schema!=="aipp.input-deck")throw new P2.ProtocolError("AIPP_INVALID_DECK_SCHEMA","AIPP input deck must contain an aipp_calculation object");
  if(source.schemaVersion!==1)throw new P2.ProtocolError("AIPP_UNSUPPORTED_DECK_VERSION",String(source.schemaVersion));
  const native=isObject(source.native)?source.native:blankNative();const next=makeState(native,source.document?.name,source.document?.path);
  ["chambers","orifices","pyros","filters"].forEach(k=>{if(Array.isArray(source[k]))next[k]=source[k];});
  next.materials=isObject(source.materials)?source.materials:{};next.solverSettings=isObject(source.solverSettings)?source.solverSettings:next.solverSettings;
  next.selection=isObject(source.selection)?source.selection:next.selection;next.validation=isObject(source.validation)?source.validation:next.validation;return next;
 }
 function replace(input,{markSaved=false,reason="replace"}={}){state=normalize(input);revision++;if(markSaved)savedRevision=revision;return notify(reason);}
 function mutate(reason,fn){const next=copy(state);fn(next);state=normalize(next);revision++;return notify(reason);}
 function setSection(name,value,reason="section"){if(!["chambers","orifices","pyros","filters","pistons","materials","solverSettings"].includes(name))throw new P2.ProtocolError("AIPP_UNKNOWN_DECK_SECTION",name);return mutate(reason,d=>{d[name]=copy(value);});}
 function markSaved(name,path){if(name)state.document.name=String(name);if(path!==undefined)state.document.path=String(path);savedRevision=revision;return notify("saved");}
 function serialize(){return JSON.stringify(state.native,null,2)+"\n";}
 function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 P2.application.aippDeckDocument={snapshot,replace,mutate,setSection,markSaved,serialize,subscribe,normalize,validateNative,blankNative};
})();

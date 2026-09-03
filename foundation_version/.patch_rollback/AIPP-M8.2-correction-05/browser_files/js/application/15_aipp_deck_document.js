"use strict";
(function(){
 const copy=v=>JSON.parse(JSON.stringify(v));
 const listeners=new Set();
 let revision=0,savedRevision=0;
 let state={schema:"aipp.input-deck",schemaVersion:1,document:{name:"untitled.json"},chambers:[],orifices:[],pyros:[],filters:[],materials:{},solverSettings:{},selection:{kind:"document",id:"document"},validation:{valid:true,errors:[]}};
 function snapshot(){return copy({...state,meta:{revision,savedRevision,dirty:revision!==savedRevision}});}
 function notify(reason){const s=snapshot();listeners.forEach(fn=>{try{fn(s,reason);}catch(_){}});return s;}
 function normalize(input){
  const d=copy(input||{});if(d.schema!=="aipp.input-deck")throw new P2.ProtocolError("AIPP_INVALID_DECK_SCHEMA","schema must be aipp.input-deck");
  if(d.schemaVersion!==1)throw new P2.ProtocolError("AIPP_UNSUPPORTED_DECK_VERSION",String(d.schemaVersion));
  d.document=d.document&&typeof d.document==="object"?d.document:{name:"untitled.json"};d.document.name=String(d.document.name||"untitled.json");d.document.path=String(d.document.path||"");
  ["chambers","orifices","pyros","filters"].forEach(k=>{if(!Array.isArray(d[k]))throw new P2.ProtocolError("AIPP_INVALID_DECK_SECTION",k+" must be an array");});
  d.materials=d.materials&&typeof d.materials==="object"&&!Array.isArray(d.materials)?d.materials:{};d.solverSettings=d.solverSettings&&typeof d.solverSettings==="object"&&!Array.isArray(d.solverSettings)?d.solverSettings:{};
  d.selection=d.selection&&typeof d.selection==="object"?d.selection:{kind:"document",id:"document"};d.validation=d.validation&&typeof d.validation==="object"?d.validation:{valid:true,errors:[]};delete d.meta;return d;
 }
 function replace(input,{markSaved=false,reason="replace"}={}){state=normalize(input);revision++;if(markSaved)savedRevision=revision;return notify(reason);}
 function mutate(reason,fn){const next=copy(state);fn(next);state=normalize(next);revision++;return notify(reason);}
 function setSection(name,value,reason="section"){if(!["chambers","orifices","pyros","filters","materials","solverSettings","selection","validation","document"].includes(name))throw new P2.ProtocolError("AIPP_UNKNOWN_DECK_SECTION",name);return mutate(reason,d=>d[name]=copy(value));}
 function select(kind,id){return setSection("selection",{kind:String(kind||"document"),id:String(id||"document")},"selection");}
 function markSaved(name){if(name)state.document.name=String(name);savedRevision=revision;return notify("saved");}
 function reset(name="untitled.json"){revision++;state=normalize({schema:"aipp.input-deck",schemaVersion:1,document:{name},chambers:[],orifices:[],pyros:[],filters:[],materials:{},solverSettings:{},selection:{kind:"document",id:"document"},validation:{valid:true,errors:[]}});savedRevision=revision;return notify("reset");}
 function serialize(){return JSON.stringify(state,null,2);}
 function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 P2.application.aippDeckDocument={snapshot,replace,mutate,setSection,select,markSaved,reset,serialize,subscribe,normalize};
})();

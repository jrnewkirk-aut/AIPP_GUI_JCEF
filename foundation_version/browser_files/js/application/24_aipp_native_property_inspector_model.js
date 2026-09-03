"use strict";
(function(){
 const copy=v=>JSON.parse(JSON.stringify(v));
 const listeners=new Set();let state={selection:null,original:null,working:null,dirty:false,errors:[]};
 function emit(){const s=snapshot();listeners.forEach(fn=>{try{fn(s);}catch(_){}});return s;}
 function snapshot(){return copy(state);}
 function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
 function load(detail){if(!detail){state={selection:null,original:null,working:null,dirty:false,errors:[]};return emit();}state={selection:copy(detail.selection),original:copy(detail.value||{}),working:copy(detail.value||{}),dirty:false,errors:[]};return emit();}
 function set(key,value){if(!state.selection)throw new P2.ProtocolError("AIPP_INSPECTOR_NO_SELECTION","Select a topology record first.");state.working[key]=value;state.dirty=!equal(state.working,state.original);state.errors=validate(state.selection,state.working);return emit();}
 function validate(selection,record){const errors=[];if(!record||typeof record!=="object"||Array.isArray(record))errors.push("Record must be an object.");if(selection?.kind==="orifice"){const snap=P2.application.aippDeckDocument.snapshot(),n=snap.native.aipp_calculation.assembly.chambers.length,from=Number(record.from),to=Number(record.to);if(!Number.isInteger(from)||from<1||from>n)errors.push("From chamber must reference an existing chamber.");if(!Number.isInteger(to)||to<1||to>n)errors.push("To chamber must reference an existing chamber.");if(from===to)errors.push("From and To chambers must be different.");}return errors;}
 function revert(){if(!state.selection)return snapshot();state.working=copy(state.original);state.dirty=false;state.errors=[];return emit();}
 function apply(){if(!state.selection)throw new P2.ProtocolError("AIPP_INSPECTOR_NO_SELECTION","Select a topology record first.");const errors=validate(state.selection,state.working);if(errors.length){state.errors=errors;emit();throw new P2.ProtocolError("AIPP_INSPECTOR_VALIDATION_FAILED",errors.join(" "));}const sel=copy(state.selection),working=copy(state.working),plural={chamber:"chambers",orifice:"orifices",wall:"walls"}[sel.kind];if(!plural)throw new P2.ProtocolError("AIPP_INSPECTOR_UNSUPPORTED_KIND",String(sel.kind));P2.application.aippDeckDocument.mutate("native-property-inspector",d=>{const list=d.native.aipp_calculation.assembly[plural];if(!list||!list[sel.index-1])throw new P2.ProtocolError("AIPP_UNKNOWN_TOPOLOGY_PATH",sel.path);list[sel.index-1]=copy(working);});state.original=copy(working);state.dirty=false;state.errors=[];emit();return snapshot();}
 function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 P2.application.aippNativePropertyInspector={load,set,validate,revert,apply,snapshot,subscribe};
})();

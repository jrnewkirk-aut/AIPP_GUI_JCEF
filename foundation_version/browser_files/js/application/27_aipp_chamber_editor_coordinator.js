"use strict";
(function(){
 const copy=v=>JSON.parse(JSON.stringify(v));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const C=()=>P2.application.aippChambers;
 const listeners=new Set();
 const quantityKeys=["volume","temperature","pressure","mass","density","moles"];
 const presets={
  air:{N2:0.78084,O2:0.20946,Ar:0.00934,CO2:0.00036},
  "dry air":{N2:0.78084,O2:0.20946,Ar:0.00934,CO2:0.00036},
  "standard air":{N2:0.78,O2:0.21,Ar:0.01},
  "moist air":{H2O:0.01,N2:0.775,O2:0.205,Ar:0.01},
  nitrogen:{N2:1},oxygen:{O2:1},argon:{Ar:1},helium:{He:1},
  "95% Ar, 5% He":{Ar:0.95,He:0.05},"90% Ar, 10% He":{Ar:0.90,He:0.10},
  "75% Ar, 25% He":{Ar:0.75,He:0.25},"65% Ar, 25% He, 10% O2":{Ar:0.65,He:0.25,O2:0.10},
  "90% N2, 10% O2":{N2:0.90,O2:0.10},"95% N2, 5% O2":{N2:0.95,O2:0.05},"50% N2, 50% Ar":{N2:0.50,Ar:0.50}
 };
 const unitCatalog=()=>P2.application.aippQuaffUnits.catalogs();
 const speciesCatalog=["Ar","CO","CO2","H2","H2O","He","N2","N2O","O2"];
 let state={selection:null,original:null,working:null,dirty:false,errors:[],activeTab:"properties",editedFields:{}};
 function emit(){const s=snapshot();listeners.forEach(fn=>{try{fn(s);}catch(_){}});return s;}
 function tankId(){return Number(P2.application.aippDeckDocument.snapshot().native.aipp_calculation.assembly.tank_id)||0;}
 function snapshot(){return copy({...state,tankId:tankId(),references:state.selection?C().dependencies(idAt(state.selection.index)):[],services:{pyros:!!P2.application.aippChamberPyros,filters:!!P2.application.aippChamberFilters}});}
 function idAt(index){const item=C().snapshot().items[index-1];if(!item)throw new P2.ProtocolError("AIPP_UNKNOWN_TOPOLOGY_PATH",String(index));return item.id;}
 function parseQuantity(text){const raw=String(text??"");const m=raw.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*(.*)$/);return m?{raw,valueText:m[1],value:Number(m[1]),unit:m[2].trim()}:null;}
 function load(selection){if(!selection||selection.kind!=="chamber"){state={selection:null,original:null,working:null,dirty:false,errors:[],activeTab:"properties",editedFields:{}};return emit();}const snap=P2.application.aippDeckDocument.snapshot(),record=snap.native.aipp_calculation.assembly.chambers[selection.index-1];if(!record)throw new P2.ProtocolError("AIPP_UNKNOWN_TOPOLOGY_PATH",selection.path);state={selection:copy(selection),original:copy(record),working:copy(record),dirty:false,errors:[],activeTab:"properties",editedFields:{}};return emit();}
 function set(path,value){if(!state.working)throw new P2.ProtocolError("AIPP_CHAMBER_EDITOR_NO_SELECTION","Select a chamber first.");const parts=String(path).split(".");let o=state.working;for(let i=0;i<parts.length-1;i++){if(!o[parts[i]]||typeof o[parts[i]]!=="object")o[parts[i]]={};o=o[parts[i]];}o[parts.at(-1)]=value;state.editedFields[path]=true;state.dirty=!equal(state.working,state.original);state.errors=validateRecord(state.working);return emit();}
 function setQuantity(key,valueText,unit){if(!quantityKeys.includes(key))throw new P2.ProtocolError("AIPP_UNKNOWN_CHAMBER_QUANTITY",key);const n=Number(valueText);if(!Number.isFinite(n))throw new P2.ProtocolError("AIPP_INVALID_CHAMBER_QUANTITY",key);return set(key,`${valueText}${unit?` ${unit}`:""}`);}
 function quantity(key){const value=state.working?.[key];return parseQuantity(value)||{raw:String(value??""),valueText:String(value??""),value:Number(value),unit:""};}
 function changeQuantityUnit(key,toUnit){const q=quantity(key),U=P2.application.aippQuaffUnits,from=U.canonicalSymbol(q.unit);if(!U.isAllowed(key,toUnit))throw new P2.ProtocolError("AIPP_INCOMPATIBLE_CHAMBER_UNIT",`${key}: ${toUnit}`);const value=from&&from!==toUnit?U.convert(key,q.value,from,toUnit):q.value;return setQuantity(key,String(Number(value.toPrecision(12))),toUnit);}
 function addMixtureSpecies(species="N2",fraction=0){const next=copy(state.working?.mol_fractions||{});let name=String(species||"N2"),i=2;while(Object.prototype.hasOwnProperty.call(next,name))name=`${species}_${i++}`;next[name]=Number(fraction);return set("mol_fractions",next);}
 function updateMixtureSpecies(oldName,newName,fraction){const next=copy(state.working?.mol_fractions||{}),name=String(newName||"").trim(),n=Number(fraction);if(!name||!Number.isFinite(n)||n<0)throw new P2.ProtocolError("AIPP_INVALID_MIXTURE_FRACTION",name);if(name!==oldName&&Object.prototype.hasOwnProperty.call(next,name))throw new P2.ProtocolError("AIPP_DUPLICATE_MIXTURE_SPECIES",name);delete next[oldName];next[name]=n;return set("mol_fractions",next);}
 function removeMixtureSpecies(name){const next=copy(state.working?.mol_fractions||{});delete next[name];return set("mol_fractions",next);}
 function normalizeMixture(){const next=copy(state.working?.mol_fractions||{}),total=Object.values(next).reduce((a,b)=>a+Number(b||0),0);if(!(total>0))throw new P2.ProtocolError("AIPP_INVALID_MIXTURE_TOTAL","At least one positive fraction is required.");Object.keys(next).forEach(k=>next[k]=Number(next[k]||0)/total);return set("mol_fractions",next);}
 function applyMixturePreset(name){if(!presets[name])throw new P2.ProtocolError("AIPP_UNKNOWN_MIXTURE_PRESET",name);return set("mol_fractions",copy(presets[name]));}
 function validateRecord(record=state.working){const errors=[];if(!record||typeof record!=="object"||Array.isArray(record))return["Chamber record must be an object."];for(const key of quantityKeys){if(record[key]===undefined)continue;const q=parseQuantity(record[key]);if(!q||!Number.isFinite(q.value))errors.push(`${key} must be a finite controlled quantity.`);else if(q.value<0)errors.push(`${key} must be non-negative.`);}if(record.mol_fractions!==undefined){if(!record.mol_fractions||typeof record.mol_fractions!=="object"||Array.isArray(record.mol_fractions))errors.push("mol_fractions must be an object.");else{const vals=Object.values(record.mol_fractions).map(Number);if(vals.some(v=>!Number.isFinite(v)||v<0))errors.push("Mixture fractions must be non-negative finite numbers.");const total=vals.reduce((a,b)=>a+b,0);if(vals.length&&!Number.isFinite(total))errors.push("Mixture total is invalid.");}}return errors;}
 function validate(){state.errors=validateRecord();emit();return copy(state.errors);}
 function revert(){if(!state.original)return snapshot();state.working=copy(state.original);state.dirty=false;state.errors=[];state.editedFields={};return emit();}
 function apply(){if(!state.selection)throw new P2.ProtocolError("AIPP_CHAMBER_EDITOR_NO_SELECTION","Select a chamber first.");const errors=validateRecord();if(errors.length){state.errors=errors;emit();throw new P2.ProtocolError("AIPP_CHAMBER_EDITOR_VALIDATION_FAILED",errors.join(" "));}const index=state.selection.index-1,working=copy(state.working),U=P2.application.aippQuaffUnits;for(const key of quantityKeys){if(!state.editedFields[key])continue;const q=parseQuantity(working[key]);if(!q||!q.unit)continue;const from=U.canonicalSymbol(q.unit),to=U.storageSymbol(key,from);if(!U.isAllowed(key,from))throw new P2.ProtocolError("AIPP_INVALID_QUAFF_UNIT",`${key}: ${q.unit}`);const value=from===to?q.value:U.convert(key,q.value,from,to);working[key]=`${String(Number(value.toPrecision(12)))} ${to}`;}P2.application.aippDeckDocument.mutate("chamber-editor-apply",d=>{const list=d.native.aipp_calculation.assembly.chambers;if(!list[index])throw new P2.ProtocolError("AIPP_UNKNOWN_TOPOLOGY_PATH",state.selection.path);list[index]=working;});state.original=copy(working);state.dirty=false;state.errors=[];state.editedFields={};return emit();}
 function setTab(tab){if(!["properties","pyros","filters","raw"].includes(tab))throw new P2.ProtocolError("AIPP_UNKNOWN_CHAMBER_EDITOR_TAB",tab);state.activeTab=tab;return emit();}
 function setAsTank(){if(!state.selection)throw new P2.ProtocolError("AIPP_CHAMBER_EDITOR_NO_SELECTION","Select a chamber first.");const index=state.selection.index;P2.application.aippDeckDocument.mutate("assembly-set-tank",d=>{d.native.aipp_calculation.assembly.tank_id=index;});P2.application.aippTopologyCanvas?.render?.(true);return emit();}
 function loadIndex(index){const item=C().snapshot().items[index-1];if(!item)throw new P2.ProtocolError("AIPP_UNKNOWN_TOPOLOGY_PATH",String(index));return load({kind:"chamber",index,label:item.name,path:`aipp_calculation.assembly.chambers[${index-1}]`});}
 function create(){const id=C().create();const index=C().snapshot().items.findIndex(x=>x.id===id)+1;return loadIndex(index);}
 function duplicate(){if(!state.selection)throw new P2.ProtocolError("AIPP_CHAMBER_EDITOR_NO_SELECTION","Select a chamber first.");const id=C().duplicate(idAt(state.selection.index));const index=C().snapshot().items.findIndex(x=>x.id===id)+1;return loadIndex(index);}
 function move(delta){if(!state.selection)throw new P2.ProtocolError("AIPP_CHAMBER_EDITOR_NO_SELECTION","Select a chamber first.");const id=idAt(state.selection.index);C().move(id,delta);const index=C().snapshot().items.findIndex(x=>x.id===id)+1;return loadIndex(index);}
 function remove(){if(!state.selection)throw new P2.ProtocolError("AIPP_CHAMBER_EDITOR_NO_SELECTION","Select a chamber first.");C().remove(idAt(state.selection.index));const items=C().snapshot().items;return items.length?loadIndex(1):load(null);}
 function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 P2.application.aippChamberEditor={load,set,setQuantity,changeQuantityUnit,quantity,applyMixturePreset,addMixtureSpecies,updateMixtureSpecies,removeMixtureSpecies,normalizeMixture,validate,revert,apply,setTab,setAsTank,create,duplicate,move,remove,snapshot,subscribe,parseQuantity,presets:()=>copy(presets),quantityKeys:()=>quantityKeys.slice(),unitCatalog:()=>copy(unitCatalog()),speciesCatalog:()=>speciesCatalog.slice()};
 P2.application.aippNativePropertyInspector.subscribe(s=>{if(s.selection?.kind==="chamber")load(s.selection);else if(state.selection)load(null);});
})();

"use strict";
(function(){
 const D=()=>P2.application.aippDeckDocument,copy=v=>JSON.parse(JSON.stringify(v));
 function capture(reason){
  const topology=P2.application.aippTopology?.snapshot?.()||{chambers:[],orifices:[]};
  const pyros=P2.application.aippChamberPyros?.snapshot?.()||{chamberId:"",pyros:[],selectedId:""};
  const filters=P2.application.aippChamberFilters?.snapshot?.()||{chamberId:"",filters:[],selectedId:""};
  D().mutate(reason,d=>{d.chambers=copy(topology.chambers);d.orifices=copy(topology.orifices);d.pyros=copy(pyros.pyros).map(x=>({...x,chamberId:pyros.chamberId}));d.filters=copy(filters.filters).map(x=>({...x,chamberId:filters.chamberId}));const lib=P2.application.aippMaterialLibrary?.current?.();d.materials=lib?copy(lib.materials):d.materials;d.selection=topology.selectedId?{kind:"topology",id:topology.selectedId}:d.selection;const errors=[...(P2.application.aippTopology?.validate?.()||[])];d.validation={valid:errors.length===0,errors};});
 }
 function wrap(api,names,prefix){if(!api)return;names.forEach(name=>{const original=api[name];if(typeof original!=="function"||original.__deckWrapped)return;function wrapped(...args){const result=original.apply(api,args);capture(prefix+"."+name);return result;}wrapped.__deckWrapped=true;api[name]=wrapped;});}
 function render(s){const name=document.getElementById("aippActiveDeckName"),inspector=document.getElementById("aippInspectorJson"),pill=document.querySelector(".aipp-valid-pill");if(name)name.textContent=s.document.name+(s.meta.dirty?" *":"");if(inspector)inspector.textContent=JSON.stringify({document:s.document.name,dirty:s.meta.dirty,revision:s.meta.revision,selection:s.selection,counts:{chambers:s.chambers.length,orifices:s.orifices.length,pyros:s.pyros.length,filters:s.filters.length},validation:s.validation},null,2);if(pill){pill.textContent=s.validation.valid?(s.meta.dirty?"Modified deck":"Deck synchronized"):"Validation errors";pill.classList.toggle("invalid",!s.validation.valid);}}
 function start(){
  wrap(P2.application.aippTopology,["reset","addChamber","addOrifice","removeOrifice","removeChamber"],"topology");
  wrap(P2.application.aippChamberPyros,["reset","create","select","update","assignFormulation","duplicate","remove","move"],"pyros");
  wrap(P2.application.aippChamberFilters,["reset","create","select","update","assignOrifices","duplicate","remove","remapAfterOrificeRemoval"],"filters");
  D().subscribe(render);capture("workspace.start");D().markSaved();render(D().snapshot());
 }
 P2.application.aippDeckBindings={start,capture};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();

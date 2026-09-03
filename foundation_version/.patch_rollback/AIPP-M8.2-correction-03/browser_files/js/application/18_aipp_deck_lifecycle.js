"use strict";
(function(){
 const copy=v=>JSON.parse(JSON.stringify(v));
 const D=()=>P2.application.aippDeckDocument;
 const blank=()=>({schema:"aipp.input-deck",schemaVersion:1,document:{name:"untitled.json",path:""},chambers:[],orifices:[],pyros:[],filters:[],materials:{},solverSettings:{},selection:{kind:"document",id:"document"},validation:{valid:true,errors:[]}});
 let busy=false,lastError=null;
 function message(error){return String(error&&error.message||error||"Unknown file lifecycle error");}
 function setBusy(value){busy=!!value;["aippDeckNew","aippDeckOpen","aippDeckSave","aippDeckSaveAs"].forEach(id=>{const e=document.getElementById(id);if(e)e.disabled=busy;});}
 function guardDiscard(action){const s=D().snapshot();return !s.meta.dirty||typeof window.confirm!=="function"||window.confirm("Discard unsaved changes and "+action+"?");}
 function validateCandidate(candidate){return D().normalize(candidate);}
 function newDeck(){if(!guardDiscard("create a new deck"))return false;D().replace(blank(),{markSaved:true,reason:"file.new"});lastError=null;return true;}
 async function openDeck(){
  if(busy||!guardDiscard("open another deck"))return false;setBusy(true);lastError=null;
  try{const r=await P2.application.aippDeckFiles.open(),p=r&&r.payload||{};if(p.cancelled)return false;let parsed;try{parsed=JSON.parse(String(p.deck_json||""));}catch(e){throw new P2.ProtocolError("AIPP_DECK_JSON_PARSE_FAILED",message(e));}
   const candidate=validateCandidate(parsed);candidate.document=candidate.document||{};candidate.document.name=String(p.name||candidate.document.name||"untitled.json");candidate.document.path=String(p.path||"");D().replace(candidate,{markSaved:true,reason:"file.open"});return true;
  }catch(e){lastError=e;throw e;}finally{setBusy(false);}
 }
 async function saveDeck(saveAs){
  if(busy)return false;setBusy(true);lastError=null;
  try{const before=D().snapshot();const text=D().serialize();const r=await P2.application.aippDeckFiles.save(text,before.document.name,before.document.path,!!saveAs),p=r&&r.payload||{};if(p.cancelled)return false;
   const after=D().snapshot();if(after.meta.revision!==before.meta.revision)throw new P2.ProtocolError("AIPP_DECK_CHANGED_DURING_SAVE","Deck changed while save was in progress.");D().markSaved(String(p.name||before.document.name),String(p.path||before.document.path||""));return true;
  }catch(e){lastError=e;throw e;}finally{setBusy(false);}
 }
 function bind(){const map={aippDeckNew:()=>newDeck(),aippDeckOpen:()=>openDeck(),aippDeckSave:()=>saveDeck(false),aippDeckSaveAs:()=>saveDeck(true)};Object.keys(map).forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener("click",()=>Promise.resolve(map[id]()).catch(err=>{if(P2.application.aippWorkspaceShell&&P2.application.aippWorkspaceShell.setState)P2.application.aippWorkspaceShell.setState("error",message(err));}));});}
 const api={blank,newDeck,openDeck,saveDeck,validateCandidate,get busy(){return busy;},get lastError(){return lastError;},_setBusy:setBusy};
 P2.application.aippDeckLifecycle=api;
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

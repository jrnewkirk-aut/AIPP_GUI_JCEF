"use strict";
(function(){
 const A=P2.application,D=()=>A.aippDeckDocument,copy=v=>JSON.parse(JSON.stringify(v));
 let serial=0,records=[],selectedId="",writing=false,lastNative="";
 const listeners=new Set();
 const nextId=()=>`wall-editor-${String(++serial).padStart(6,"0")}`;
 function assembly(snapshot){return snapshot.native.aipp_calculation.assembly;}
 function nativeSignature(snapshot){return JSON.stringify(assembly(snapshot).walls||[]);}
 function deterministicDefault(){return {temperature:"294.15 K",area:"1 m^2",thickness:"1 mm",material:"steel",left_connection:{type:"CONSTANT_TEMPERATURE",temperature:"294.15 K"},right_connection:{type:"CONSTANT_TEMPERATURE",temperature:"294.15 K"}};}
 function snapshot(){return {selectedId,items:records.map((r,i)=>({id:r.id,index:i+1,name:String(r.native.label||`Wall ${i+1}`),native:copy(r.native)}))};}
 function notify(reason){const s=snapshot();listeners.forEach(fn=>{try{fn(s,reason);}catch(_){}});return s;}
 function hydrate(deck,reason){const incoming=assembly(deck).walls||[],old=records.slice();records=incoming.map((native,i)=>({id:old[i]?.id||nextId(),native:copy(native)}));if(!records.some(r=>r.id===selectedId))selectedId=records[0]?.id||"";lastNative=JSON.stringify(incoming);notify(reason||"hydrate");}
 function commit(reason){writing=true;const values=records.map(r=>copy(r.native));D().mutate(`walls.${reason}`,d=>{d.native.aipp_calculation.assembly.walls=values;});writing=false;lastNative=JSON.stringify(values);notify(reason);}
 function requireId(id){const i=records.findIndex(r=>r.id===id);if(i<0)throw new P2.ProtocolError("AIPP_UNKNOWN_WALL",String(id));return i;}
 function create(native){records.push({id:nextId(),native:copy(native||deterministicDefault())});selectedId=records.at(-1).id;commit("create");return selectedId;}
 function select(id){requireId(id);selectedId=id;return notify("select");}
 function update(id,mutator){const i=requireId(id),next=copy(records[i].native);if(typeof mutator==="function")mutator(next);else if(mutator&&typeof mutator==="object")Object.assign(next,copy(mutator));records[i].native=next;commit("update");return copy(next);}
 function duplicate(id){const i=requireId(id),oldOrder=records.map(r=>r.id),record={id:nextId(),native:copy(records[i].native)};records.splice(i+1,0,record);selectedId=record.id;const map={};oldOrder.forEach((rid,idx)=>map[idx+1]=records.findIndex(r=>r.id===rid)+1);remapReferences(map);return record.id;}
 function dependencies(id,deckSnapshot){const oldIndex=requireId(id)+1,s=deckSnapshot||D().snapshot(),hits=[],a=assembly(s);(a.walls||[]).forEach((w,wi)=>{["left_connection","right_connection"].forEach(side=>{const c=w[side];if(c&&c.type==="WALL"&&Number(c.wall_index)===oldIndex)hits.push({kind:"wall_connection",path:`walls[${wi}].${side}.wall_index`,wallIndex:wi+1,referencedWallIndex:oldIndex});});});return hits;}
 function remove(id){const i=requireId(id),deps=dependencies(id);if(deps.length)throw new P2.ProtocolError("AIPP_WALL_IN_USE",JSON.stringify(deps));records.splice(i,1);selectedId=records[Math.min(i,records.length-1)]?.id||"";commit("remove");return snapshot();}
 function remapReferences(indexMap){D().mutate("walls.reorder",d=>{const a=d.native.aipp_calculation.assembly;a.walls=records.map(r=>copy(r.native));(a.walls||[]).forEach(w=>{["left_connection","right_connection"].forEach(side=>{const c=w[side];const n=c&&c.type==="WALL"&&indexMap[Number(c.wall_index)];if(n)c.wall_index=n;});});});lastNative=JSON.stringify(records.map(r=>r.native));notify("move");}
 function move(id,delta){const from=requireId(id),to=Math.max(0,Math.min(records.length-1,from+Number(delta)));if(from===to)return snapshot();const oldOrder=records.map(r=>r.id);records.splice(to,0,records.splice(from,1)[0]);const map={};oldOrder.forEach((rid,i)=>map[i+1]=records.findIndex(r=>r.id===rid)+1);remapReferences(map);return snapshot();}
 function replaceAll(values){if(!Array.isArray(values))throw new P2.ProtocolError("AIPP_INVALID_WALL_COLLECTION","walls must be an array");const old=records.slice();records=values.map((v,i)=>({id:old[i]?.id||nextId(),native:copy(v)}));selectedId=records[0]?.id||"";commit("replaceAll");return snapshot();}
 function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 function start(){hydrate(D().snapshot(),"start");D().subscribe(s=>{if(writing)return;const sig=nativeSignature(s);if(sig!==lastNative)hydrate(s,"deck");});}
 A.aippWalls={start,snapshot,subscribe,create,select,update,duplicate,remove,move,replaceAll,dependencies,deterministicDefault};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();

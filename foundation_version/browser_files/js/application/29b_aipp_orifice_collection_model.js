"use strict";
(function(){
 const A=P2.application,D=()=>A.aippDeckDocument,copy=v=>JSON.parse(JSON.stringify(v));
 let serial=0,records=[],selectedId="",writing=false,lastNative="";
 const listeners=new Set();
 const nextId=()=>`orifice-editor-${String(++serial).padStart(6,"0")}`;
 function assembly(snapshot){return snapshot.native.aipp_calculation.assembly;}
 function nativeSignature(snapshot){return JSON.stringify(assembly(snapshot).orifices||[]);}
 function deterministicDefault(){return {from:1,to:2,num_orif:1,diameter:"1.0 mm",viscous_flow_factor:1,open:true,one_way:false,opens_at:"0 Pa",discharge_coefficient:{basis:"constant",Cd_value:0.8}};}
 function snapshot(){return {selectedId,items:records.map((r,i)=>({id:r.id,index:i+1,name:String(r.native.label||`Orifice ${i+1}`),native:copy(r.native)}))};}
 function notify(reason){const s=snapshot();listeners.forEach(fn=>{try{fn(s,reason);}catch(_){}});return s;}
 function hydrate(deck,reason){const incoming=assembly(deck).orifices||[],old=records.slice();records=incoming.map((native,i)=>({id:old[i]?.id||nextId(),native:copy(native)}));if(!records.some(r=>r.id===selectedId))selectedId=records[0]?.id||"";lastNative=JSON.stringify(incoming);notify(reason||"hydrate");}
 function commit(reason){writing=true;const values=records.map(r=>copy(r.native));D().mutate(`orifices.${reason}`,d=>{d.native.aipp_calculation.assembly.orifices=values;});writing=false;lastNative=JSON.stringify(values);notify(reason);}
 function requireId(id){const i=records.findIndex(r=>r.id===id);if(i<0)throw new P2.ProtocolError("AIPP_UNKNOWN_ORIFICE",String(id));return i;}
 function create(native){records.push({id:nextId(),native:copy(native||deterministicDefault())});selectedId=records.at(-1).id;commit("create");return selectedId;}
 function select(id){requireId(id);selectedId=id;return notify("select");}
 function update(id,mutator){const i=requireId(id),next=copy(records[i].native);if(typeof mutator==="function")mutator(next);else if(mutator&&typeof mutator==="object")Object.assign(next,copy(mutator));records[i].native=next;commit("update");return copy(next);}
 function duplicate(id){const i=requireId(id),oldOrder=records.map(r=>r.id),record={id:nextId(),native:copy(records[i].native)};records.splice(i+1,0,record);selectedId=record.id;const map={};oldOrder.forEach((rid,idx)=>map[idx+1]=records.findIndex(r=>r.id===rid)+1);remapReferences(map);return record.id;}
 function walk(value,path,visit){if(Array.isArray(value))value.forEach((v,i)=>walk(v,`${path}[${i}]`,visit));else if(value&&typeof value==="object")Object.keys(value).forEach(k=>walk(value[k],path?`${path}.${k}`:k,visit));else visit(value,path);}
 function dependencies(id,deckSnapshot){const oldIndex=requireId(id)+1,s=deckSnapshot||D().snapshot(),hits=[],a=assembly(s);(a.chambers||[]).forEach((c,ci)=>{const f=c.filter;if(f&&Array.isArray(f.orifices)&&f.orifices.includes(oldIndex))hits.push({kind:"chamber_filter",path:`chambers[${ci}].filter.orifices`,chamberIndex:ci+1,orificeIndex:oldIndex});});walk(s.native,"",(v,path)=>{if(typeof v==="string"&&new RegExp(`^O${oldIndex}_(?:opened|closed)$`).test(v))hits.push({kind:"event",path,value:v,orificeIndex:oldIndex});});return hits;}
 function remove(id){const i=requireId(id),deps=dependencies(id);if(deps.length)throw new P2.ProtocolError("AIPP_ORIFICE_IN_USE",JSON.stringify(deps));records.splice(i,1);selectedId=records[Math.min(i,records.length-1)]?.id||"";commit("remove");return snapshot();}
 function remapReferences(indexMap){D().mutate("orifices.reorder",d=>{const a=d.native.aipp_calculation.assembly;a.orifices=records.map(r=>copy(r.native));(a.chambers||[]).forEach(c=>{const f=c.filter;if(f&&Array.isArray(f.orifices))f.orifices=f.orifices.map(n=>indexMap[Number(n)]||n);});walk(d.native,"",(v,path)=>{if(typeof v!=="string")return;const m=/^O(\d+)_(opened|closed)$/.exec(v);if(!m||!indexMap[Number(m[1])])return;const parts=path.replace(/\[(\d+)\]/g,".$1").split(".").filter(Boolean);let target=d.native;for(let j=0;j<parts.length-1;j++)target=target[parts[j]];target[parts.at(-1)]=`O${indexMap[Number(m[1])]}_${m[2]}`;});});lastNative=JSON.stringify(records.map(r=>r.native));notify("move");}
 function move(id,delta){const from=requireId(id),to=Math.max(0,Math.min(records.length-1,from+Number(delta)));if(from===to)return snapshot();const oldOrder=records.map(r=>r.id);records.splice(to,0,records.splice(from,1)[0]);const map={};oldOrder.forEach((rid,i)=>map[i+1]=records.findIndex(r=>r.id===rid)+1);remapReferences(map);return snapshot();}
 function replaceAll(values){if(!Array.isArray(values))throw new P2.ProtocolError("AIPP_INVALID_ORIFICE_COLLECTION","orifices must be an array");const old=records.slice();records=values.map((v,i)=>({id:old[i]?.id||nextId(),native:copy(v)}));selectedId=records[0]?.id||"";commit("replaceAll");return snapshot();}
 function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 function start(){hydrate(D().snapshot(),"start");D().subscribe(s=>{if(writing)return;const sig=nativeSignature(s);if(sig!==lastNative)hydrate(s,"deck");});}
 A.aippOrifices={start,snapshot,subscribe,create,select,update,duplicate,remove,move,replaceAll,dependencies,deterministicDefault};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();

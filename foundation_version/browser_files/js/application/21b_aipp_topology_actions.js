"use strict";
(function(){
 const q=id=>document.getElementById(id);
 const canvas=()=>P2.application.aippTopologyCanvas;
 const models={chamber:()=>P2.application.aippChambers,orifice:()=>P2.application.aippOrifices,wall:()=>P2.application.aippWalls,piston:()=>P2.application.aippPistons};
 const labels={chamber:"Chamber",orifice:"Orifice",wall:"Wall",piston:"Piston"};
 const plural={chamber:"chambers",orifice:"orifices",wall:"walls",piston:"pistons"};
 const addButtonIds={chamber:"aippTopologyAddChamber",orifice:"aippTopologyAddOrifice",wall:"aippTopologyAddWall",piston:"aippTopologyAddPiston"};
 function showError(message){const el=q("aippTopologyActionError");if(!el)return;if(!message){el.hidden=true;el.textContent="";return;}el.hidden=false;el.textContent=message;}
 function safeChamberIndex(preferred,count){return preferred<=count?preferred:0;}
 function addEntity(kind){showError("");try{const model=models[kind]();let native;if(kind==="orifice"||kind==="piston"){const count=P2.application.aippChambers.snapshot().items.length;native=model.deterministicDefault();if(kind==="orifice"){native.from=safeChamberIndex(1,count);native.to=safeChamberIndex(2,count);}else{native.left_connection.chamber_idx=safeChamberIndex(1,count);native.right_connection.chamber_idx=safeChamberIndex(2,count);}}model.create(native);}catch(e){showError(e?.message||`Unable to add ${labels[kind]}.`);}}
 function idForNode(data){const m=models[data.kind];if(!m)return null;const item=m().snapshot().items[data.nativeIndex-1];return item?item.id:null;}
 function tankIndex(){return Number(P2.application.aippDeckDocument.snapshot().native.aipp_calculation.assembly.tank_id)||0;}
 function setTank(data){showError("");try{P2.application.aippDeckDocument.mutate("assembly-set-tank",d=>{d.native.aipp_calculation.assembly.tank_id=data.nativeIndex;});canvas().render(true);}catch(e){showError(e?.message||"Unable to set tank chamber.");}}
 function removeNode(data){showError("");const id=idForNode(data);if(!id)return;try{models[data.kind]().remove(id);canvas().clearSelection();}catch(e){showError(e?.message||`Unable to remove ${labels[data.kind]||"entity"}: it is still referenced elsewhere.`);}}
 function duplicateNode(data){showError("");const id=idForNode(data);if(!id)return;try{const model=models[data.kind](),newId=model.duplicate(id);canvas().render(true);const item=model.snapshot().items.find(x=>x.id===newId);if(item)canvas().selectPath(`aipp_calculation.assembly.${plural[data.kind]}[${item.index-1}]`);}catch(e){showError(e?.message||`Unable to duplicate ${labels[data.kind]||"entity"}.`);}}
 function hideMenu(){const menu=q("aippTopologyContextMenu");if(!menu)return;menu.hidden=true;menu.innerHTML="";}
 function positionMenu(menu,x,y){const host=q("aippTopologyCanvas"),hostRect=host?host.getBoundingClientRect():{left:0,top:0,width:window.innerWidth,height:window.innerHeight};let left=x,top=y;const maxLeft=hostRect.left+hostRect.width-8,maxTop=hostRect.top+hostRect.height-8;if(left>maxLeft)left=maxLeft;if(top>maxTop)top=maxTop;menu.style.left=`${Math.max(0,left)}px`;menu.style.top=`${Math.max(0,top)}px`;}
 function menuItem(text,onSelect,danger){const li=document.createElement("li");const b=document.createElement("button");b.type="button";b.textContent=text;if(danger)b.className="aipp-danger";b.addEventListener("click",()=>{hideMenu();onSelect();});li.appendChild(b);return li;}
 function showAddMenu(x,y){const menu=q("aippTopologyContextMenu");if(!menu)return;menu.innerHTML="";Object.keys(labels).forEach(kind=>{menu.appendChild(menuItem(`Add ${labels[kind]}`,()=>addEntity(kind)));});menu.hidden=false;positionMenu(menu,x,y);}
 function showNodeMenu(x,y,data){const menu=q("aippTopologyContextMenu");if(!menu)return;menu.innerHTML="";const label=data.label||labels[data.kind]||"entity";if(data.kind==="chamber"&&data.nativeIndex!==tankIndex())menu.appendChild(menuItem("Set as Tank",()=>setTank(data)));menu.appendChild(menuItem("Duplicate",()=>duplicateNode(data)));menu.appendChild(menuItem(`Remove ${label}`,()=>removeNode(data),true));menu.hidden=false;positionMenu(menu,x,y);}
 function eventPoint(evt){const oe=evt?.originalEvent;if(oe&&typeof oe.clientX==="number")return{x:oe.clientX,y:oe.clientY};const host=q("aippTopologyCanvas"),r=host?host.getBoundingClientRect():{left:0,top:0};return{x:r.left+20,y:r.top+20};}
 function isEditableTarget(el){if(!el)return false;const tag=(el.tagName||"").toLowerCase();return tag==="input"||tag==="textarea"||tag==="select"||el.isContentEditable;}
 function bindCanvas(){const cy=canvas().instance;if(!cy||cy.__aippActionsBound)return;cy.__aippActionsBound=true;
  cy.on("cxttap","node",evt=>{const p=eventPoint(evt),data=evt.target.data();showNodeMenu(p.x,p.y,data);});
  cy.on("cxttap",evt=>{if(evt.target!==cy)return;const p=eventPoint(evt);showAddMenu(p.x,p.y);});
  const host=q("aippTopologyCanvas");if(host)host.addEventListener("contextmenu",e=>e.preventDefault());
 }
 function bind(){
  Object.keys(addButtonIds).forEach(kind=>{q(addButtonIds[kind])?.addEventListener("click",()=>addEntity(kind));});
  document.addEventListener("click",e=>{const menu=q("aippTopologyContextMenu");if(menu&&!menu.hidden&&!menu.contains(e.target))hideMenu();});
  document.addEventListener("keydown",e=>{
   if(e.key==="Escape"){hideMenu();return;}
   if(e.key!=="Delete"&&e.key!=="Backspace")return;
   if(isEditableTarget(e.target))return;
   const cy=canvas().instance;if(!cy)return;
   const node=cy.$("node:selected").first();if(node.empty())return;
   e.preventDefault();removeNode(node.data());
  });
  P2.application.aippDeckDocument.subscribe(()=>bindCanvas());
  bindCanvas();
 }
 P2.application.aippTopologyActions={addEntity,removeNode,duplicateNode,setTank,hideMenu,showAddMenu,showNodeMenu,idForNode};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

"use strict";
(function(){
 const q=id=>document.getElementById(id);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const groups=[
  {kind:"chamber",label:"Chambers",model:()=>P2.application.aippChambers},
  {kind:"wall",label:"Walls",model:()=>P2.application.aippWalls},
  {kind:"orifice",label:"Orifices",model:()=>P2.application.aippOrifices},
  {kind:"piston",label:"Pistons",model:()=>P2.application.aippPistons}
 ];
 function render(){
  const root=q("aippDeckNavigatorTree");
  if(!root)return;
  const N=P2.application.aippTopologyNavigation;
  const parts=[`<button type="button" class="aipp-nav-root" data-aipp-document-path="">Input deck</button>`];
  groups.forEach(g=>{
    const model=g.model&&g.model();
    if(!model)return;
   const items=model.snapshot().items;
   parts.push(`<div class="aipp-nav-group">${esc(g.label)}</div>`);
   if(!items.length){parts.push('<span class="aipp-nav-empty">None</span>');return;}
   items.forEach(item=>{
    const path=N.pathFor(g.kind,item.index);
    parts.push(`<button type="button" class="aipp-nav-item" data-aipp-document-path="${esc(path)}">${esc(item.name)}</button>`);
   });
  });
  root.innerHTML=parts.join("");
 }
 function bind(){render();P2.application.aippDeckDocument.subscribe(render);groups.forEach(g=>{const model=g.model&&g.model();model?.subscribe(render);});}
 P2.application.aippDeckNavigatorView={render};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

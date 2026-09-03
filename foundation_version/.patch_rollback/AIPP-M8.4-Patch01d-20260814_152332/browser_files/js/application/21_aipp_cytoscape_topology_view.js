"use strict";
(function(){
 let cy=null,lastSignature=""; const q=id=>document.getElementById(id);
 function style(){return [
  {selector:"node",style:{"font-family":"Arial, sans-serif","font-size":"12px","text-wrap":"wrap","text-max-width":"130px","text-valign":"center","text-halign":"center","overlay-opacity":0}},
  {selector:"node.aipp-chamber",style:{shape:"round-rectangle",width:150,height:76,"background-color":"#ffffff","border-width":3,"border-color":"#075b9c",label:"data(label)",color:"#075b9c","font-size":"16px","font-weight":"bold"}},
  {selector:"node.aipp-orifice",style:{shape:"round-rectangle",width:76,height:38,"background-color":"#079bd8","border-width":1,"border-color":"#0575a5",label:"data(label)",color:"#064b72","font-size":"10px","font-weight":"bold"}},
  {selector:"node.aipp-wall",style:{shape:"diamond",width:58,height:58,"background-color":"#eef8ff","border-width":2,"border-color":"#1377bd",label:"data(label)",color:"#075b9c","font-size":"10px"}},
  {selector:"edge.aipp-flow",style:{width:2,"line-color":"#778594","target-arrow-color":"#778594","target-arrow-shape":"triangle","curve-style":"bezier"}},
  {selector:"edge.aipp-association",style:{width:2,"line-color":"#778594","line-style":"dotted","target-arrow-shape":"none","curve-style":"bezier"}},
  {selector:"node:selected",style:{"border-width":5,"border-color":"#f59e0b","background-color":"#fff7df"}}
 ];}
 function layout(){return {name:"breadthfirst",directed:true,direction:"rightward",fit:true,padding:36,avoidOverlap:true,nodeDimensionsIncludeLabels:true,spacingFactor:1.35,animate:false,depthSort:(a,b)=>String(a.id()).localeCompare(String(b.id()))};}
 function signature(g){return JSON.stringify(g.elements.map(e=>e.data));}
 function showInspector(node){const out=q("aippInspectorJson");if(!out)return;const d=node.data(),deck=P2.application.aippDeckDocument.snapshot().native;let value=null;try{const a=deck.aipp_calculation.assembly;value=d.kind==="chamber"?a.chambers[d.nativeIndex-1]:d.kind==="orifice"?a.orifices[d.nativeIndex-1]:d.kind==="wall"?a.walls[d.nativeIndex-1]:null;}catch(_){}out.textContent=JSON.stringify({selection:{kind:d.kind,index:d.nativeIndex,label:d.label,path:d.documentPath},value},null,2);}
 function render(force){const host=q("aippTopologyCanvas"),g=P2.application.aippTopologyGraphAdapter.build(),sig=signature(g);q("aippTopologySummary").textContent=`${g.counts.chambers} chambers · ${g.counts.orifices} orifices · ${g.counts.walls} walls`;if(!host)return false;if(typeof window.cytoscape!=="function"){host.textContent="Topology renderer unavailable: Cytoscape did not initialize.";host.classList.add("aipp-topology-error");return false;}host.classList.remove("aipp-topology-error");if(!cy){cy=window.cytoscape({container:host,elements:g.elements,style:style(),layout:layout(),selectionType:"single",boxSelectionEnabled:false,autoungrabify:true,minZoom:.2,maxZoom:3,wheelSensitivity:.18});cy.on("tap","node",e=>showInspector(e.target));lastSignature=sig;}else if(force||sig!==lastSignature){cy.elements().remove();cy.add(g.elements);cy.layout(layout()).run();lastSignature=sig;}return true;}
 function fit(){if(cy)cy.fit(cy.elements(),36);}
 function bind(){q("aippTopologyFit")?.addEventListener("click",fit);P2.application.aippDeckDocument.subscribe(()=>render(true));render(true);}
 P2.application.aippTopologyCanvas={render,fit,get instance(){return cy;}};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

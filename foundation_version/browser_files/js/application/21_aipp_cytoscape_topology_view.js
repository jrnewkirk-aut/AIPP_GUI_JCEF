"use strict";
(function(){
 let cy=null,lastSignature="",selectedPath="";const listeners=new Set(),q=id=>document.getElementById(id);
 const topologySizes=Object.freeze({chamber:Object.freeze({width:260,height:130}),piston:Object.freeze({width:170,height:90}),orifice:Object.freeze({width:155,height:82}),wall:Object.freeze({width:170,height:90})});
 P2.application.aippTopologySizes=topologySizes;
 function style(){
  const proposed=[
   {selector:"node",style:{"background-opacity":0,"background-image":"data(nodeImage)","background-fit":"contain","background-clip":"none","background-width":"100%","background-height":"100%","border-width":0,label:"","overlay-opacity":0}},
   {selector:"node.aipp-chamber",style:{shape:"round-rectangle",width:topologySizes.chamber.width,height:topologySizes.chamber.height}},
   {selector:"node.aipp-piston",style:{shape:"round-rectangle",width:topologySizes.piston.width,height:topologySizes.piston.height}},
   {selector:"node.aipp-orifice",style:{shape:"round-rectangle",width:topologySizes.orifice.width,height:topologySizes.orifice.height}},
   {selector:"node.aipp-wall",style:{shape:"round-rectangle",width:topologySizes.wall.width,height:topologySizes.wall.height}},
   {selector:"edge.aipp-flow",style:{width:4,"line-color":"#53697d","target-arrow-color":"#53697d","target-arrow-shape":"triangle","arrow-scale":1.05,"curve-style":"bezier"}},
   {selector:"edge.aipp-association",style:{width:3,"line-color":"#bd6a00","line-style":"dashed","target-arrow-shape":"none","curve-style":"bezier"}}
  ];
  return proposed.concat([
   {selector:".aipp-dimmed",style:{opacity:.18}},
   {selector:"edge.aipp-related",style:{opacity:1,width:4,"line-color":"#1769e0","target-arrow-color":"#1769e0"}},
   {selector:"node.aipp-related",style:{opacity:1,"border-width":4,"border-color":"#7ab0ff"}},
   {selector:"node:selected",style:{opacity:1,"border-width":6,"border-color":"#f59e0b","background-color":"#fff7df"}}
  ]);
 }
  function signature(g){return JSON.stringify(g.elements.map(e=>e.data));}
 function record(data){const deck=P2.application.aippDeckDocument.snapshot().native;let value=null;try{const a=deck.aipp_calculation.assembly;value=data.kind==="chamber"?a.chambers[data.nativeIndex-1]:data.kind==="orifice"?a.orifices[data.nativeIndex-1]:data.kind==="wall"?a.walls[data.nativeIndex-1]:data.kind==="piston"?a.pistons[data.nativeIndex-1]:null;}catch(_){}return {selection:{id:data.id,kind:data.kind,index:data.nativeIndex,label:data.label,path:data.documentPath},value};}
 function inspect(node){const detail=record(node.data()),out=q("aippInspectorJson");if(out)out.textContent=JSON.stringify(detail,null,2);return detail;}
 function notify(detail){listeners.forEach(fn=>{try{fn(detail);}catch(_){}});try{document.dispatchEvent(new CustomEvent("aipp:topology-selection",{detail}));}catch(_){}return detail;}
 function decorate(node){P2.application.aippTopologyHoverCard?.close?.();cy.elements().removeClass("aipp-dimmed aipp-related");if(!node||node.empty()){selectedPath="";return notify(null);}cy.elements().addClass("aipp-dimmed");node.removeClass("aipp-dimmed");const connected=node.connectedEdges();connected.removeClass("aipp-dimmed").addClass("aipp-related");connected.connectedNodes().removeClass("aipp-dimmed").addClass("aipp-related");selectedPath=String(node.data("documentPath")||"");return notify(inspect(node));}
 function selectPath(path,{focus=false}={}){if(!cy)return false;const wanted=String(path||"");cy.$("node:selected").unselect();if(!wanted){decorate(null);return true;}const node=cy.nodes().filter(n=>String(n.data("documentPath"))===wanted).first();if(node.empty())return false;node.select();decorate(node);if(focus)cy.animate({center:{eles:node},duration:120});return true;}
 function clearSelection(){return selectPath("");}
 function render(force){const host=q("aippTopologyCanvas"),g=P2.application.aippTopologyGraphAdapter.build(),sig=signature(g),summary=q("aippTopologySummary");if(summary)summary.textContent=`${g.counts.chambers} chambers · ${g.counts.orifices} orifices · ${g.counts.walls} walls · ${g.counts.pistons} pistons`;if(!host)return false;const runtime=P2.application.aippGraphRuntime;if(!runtime||!runtime.available()){const d=runtime?runtime.diagnostics():{error:"Graph runtime adapter is unavailable."};host.textContent="Topology renderer unavailable: "+(d.error||"Cytoscape did not initialize.");host.classList.add("aipp-topology-error");return false;}host.classList.remove("aipp-topology-error");if(!cy){cy=runtime.create({container:host,elements:g.elements,style:style(),layout:{name:"preset"},selectionType:"single",boxSelectionEnabled:false,autoungrabify:true,minZoom:.2,maxZoom:3});cy.on("tap","node",e=>decorate(e.target));cy.on("tap",e=>{if(e.target===cy)clearSelection();});lastSignature=sig;relayout(false);}else if(force||sig!==lastSignature){const keep=selectedPath;cy.elements().remove();cy.add(g.elements);lastSignature=sig;relayout(false);if(keep&&!selectPath(keep))clearSelection();}return true;}
 function fit(){if(cy&&cy.elements().length)cy.fit(cy.elements(),70);}
 function relayout(animate=true){if(!cy)return false;const g=P2.application.aippTopologyGraphAdapter.build(),native=P2.application.aippDeckDocument.snapshot().native,keep=selectedPath;P2.application.aippTopologyLayout.apply(cy,g,{native,animate,fit:true});if(keep)selectPath(keep);return true;}
 function resetZoom(){if(!cy)return false;fit();return true;}
 function setPresentation(mode){window.dispatchEvent(new CustomEvent("aipp:topology-presentation-changed",{detail:{mode}}));return "phase05b";}
 function subscribeSelection(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 function bind(){q("aippTopologyFit")?.addEventListener("click",fit);q("aippTopologyRelayout")?.addEventListener("click",()=>relayout(true));q("aippTopologyResetZoom")?.addEventListener("click",resetZoom);P2.application.aippDeckDocument.subscribe(()=>render(true));render(true);}
 P2.application.aippTopologyCanvas={render,fit,relayout,resetZoom,selectPath,clearSelection,subscribeSelection,style,setPresentation,get presentation(){return "phase05b";},get selectedPath(){return selectedPath;},get instance(){return cy;}};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

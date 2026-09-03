"use strict";
(function(){
 let selected=null;
 function canvas(){return P2.application.aippTopologyCanvas;}
 function pathFor(kind,index){const plural={chamber:"chambers",orifice:"orifices",wall:"walls",piston:"pistons"}[kind];if(!plural||!Number.isInteger(index)||index<1)throw new P2.ProtocolError("AIPP_INVALID_TOPOLOGY_SELECTION",`${kind}:${index}`);return `aipp_calculation.assembly.${plural}[${index-1}]`;}
 function selectPath(path,options){const ok=canvas().selectPath(path,options);if(!ok)throw new P2.ProtocolError("AIPP_UNKNOWN_TOPOLOGY_PATH",String(path));return current();}
 function select(kind,index,options){return selectPath(pathFor(kind,index),options);}
 function clear(){canvas().clearSelection();return null;}
 function current(){return selected?JSON.parse(JSON.stringify(selected)):null;}
 function bind(){canvas().subscribeSelection(detail=>{selected=detail;document.querySelectorAll("[data-aipp-document-path]").forEach(el=>{const on=!!detail&&el.dataset.aippDocumentPath===detail.selection.path;el.classList.toggle("is-selected",on);el.setAttribute("aria-current",on?"true":"false");});});document.addEventListener("click",event=>{const target=event.target.closest("[data-aipp-document-path]");if(target)selectPath(target.dataset.aippDocumentPath,{focus:true});});}
 P2.application.aippTopologyNavigation={pathFor,selectPath,select,clear,current,bind};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

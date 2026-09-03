"use strict";
(function(){
 const CONTROL_ID="aippTopologyPresentation";
 function mount(){
  const canvas=P2.application.aippTopologyCanvas;
  if(!canvas)return false;
  canvas.setPresentation("phase05b");
  return true;
 }
 function bind(){if(!mount())setTimeout(mount,0);}
 P2.application.aippPhase05bPresentationControl={mount,controlId:CONTROL_ID};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

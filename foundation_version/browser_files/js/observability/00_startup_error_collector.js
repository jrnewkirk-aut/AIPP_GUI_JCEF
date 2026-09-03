"use strict";
(function(root){
  const MAX=100,startedAt=performance.now(),records=[];
  function text(value,max=240){const s=String(value??"");return s.length>max?s.slice(0,max):s;}
  function push(kind,message,details={}){const record={schema_version:"1.0",timestamp:new Date().toISOString(),runtime:"browser",level:"error",category:"startup",event:kind,request_id:null,transfer_id:null,details:{message:text(message),...details}};records.push(record);while(records.length>MAX)records.shift();try{root.P7?.logger?.error("startup",kind,{},record.details);}catch(_){}return record;}
  function onError(event){push("startup.console_error",event.message||"Browser startup error",{source:text(event.filename),line:event.lineno||0,column:event.colno||0,error_name:text(event.error?.name)});}
  function onRejection(event){const reason=event.reason;push("startup.unhandled_rejection",reason?.message||reason||"Unhandled rejection",{error_name:text(reason?.name),stack:text(reason?.stack,500)});}
  root.addEventListener("error",onError);
  root.addEventListener("unhandledrejection",onRejection);
  root.P7=Object.assign(root.P7||{},{startup:{startedAt,records,loadedAt:null,hostReadyAt:null,lastHandshakeAt:null,markLoaded(){this.loadedAt=performance.now();},markHostReady(){this.hostReadyAt=performance.now();this.lastHandshakeAt=new Date().toISOString();},snapshot(){return{started_at_ms:startedAt,loaded_at_ms:this.loadedAt,host_ready_at_ms:this.hostReadyAt,last_handshake_utc:this.lastHandshakeAt,error_count:records.length,errors:records.map(x=>JSON.parse(JSON.stringify(x)))};},clear(){records.length=0;},dispose(){root.removeEventListener("error",onError);root.removeEventListener("unhandledrejection",onRejection);}}});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>root.P7.startup.markLoaded(),{once:true});else root.P7.startup.markLoaded();
})(window);

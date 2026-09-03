"use strict";
(function(){
  function byId(id){return document.getElementById(id);}
  function clone(value){return value===undefined?null:JSON.parse(JSON.stringify(value));}
  function text(id,value){const e=byId(id);if(e)e.textContent=JSON.stringify(value,null,2);}
  const panel={enabled:true,profile:"development",category:"all",timer:null,lastSnapshot:null,
    identity(){return{foundation_version:P2.applicationVersion,application_version:P2.application?.version||"0.1.0",pillar7_implementation_version:P7.implementationVersion||"P7.3.0-0.1",protocol_version:P2.protocolVersion,scilab_version:P2.hostVersion,build_profile:"development",bundle_hash:P2.config?.get?.("bundleHash")||"unavailable",build_manifest_hash:P2.config?.get?.("buildManifestHash")||"unavailable"};},
    runtime(){const d=P2.diagnostics?.snapshot?.()||{},s=P7.startup?.snapshot?.()||{};return{browser_loaded:s.loaded_at_ms!==null,host_connected:P2.hostReady,host_ready:P2.hostReady,last_handshake_utc:s.last_handshake_utc,pending_requests:P2.requests?.size??0,active_transfers:d.activeTransfers??0,retained_transfers:d.transferHistory?.length??0,queue_depth:P7.performance?.gauges?.get?.("transport.queue.depth")??"unavailable"};},
    transfer(){const d=P2.diagnostics?.snapshot?.()||{},metrics=P7.performance?.snapshot?.()||{};const recent=(metrics.records||[]).filter(x=>["plot","performance"].some(k=>x.name?.includes(k))).slice(-20);return{last_message_summary:d.lastMessage??null,last_transfer_summary:d.transferHistory?.slice?.(-1)?.[0]??null,metric_summaries:recent};},
    errors(){const category=this.category,logs=(P7.logger?.snapshot?.()||[]).filter(x=>["warn","error"].includes(x.level)&&(category==="all"||x.category===category));return{startup:P7.startup?.snapshot?.()||null,recent_browser:logs.slice(-50),recent_host:P2.hostLogLines?.slice?.(-50)??"available through diagnostic.host_log.request",last_structured_error:logs.slice(-1)[0]||null};},
    snapshot(){P7.performance?.syncRuntime?.();return{identity:this.identity(),runtime:this.runtime(),transfer_and_plotting:this.transfer(),warnings_and_errors:this.errors(),performance:P7.performance?.snapshot?.()||null,generated_at:new Date().toISOString()};},
    refresh(){const snap=this.snapshot();this.lastSnapshot=snap;text("diagnosticIdentity",snap.identity);text("diagnosticRuntime",snap.runtime);text("diagnosticTransfer",snap.transfer_and_plotting);text("diagnosticErrors",snap.warnings_and_errors);text("diagnosticPerformance",snap.performance);text("diagnosticsPanel",snap);const badge=byId("devConnectionBadge");if(badge){badge.textContent=P2.hostReady?"Host ready":"Waiting for host";badge.className=`badge ${P2.hostReady?"ready":"waiting"}`;}return snap;},
    clearView(){for(const id of ["diagnosticIdentity","diagnosticRuntime","diagnosticTransfer","diagnosticErrors","diagnosticPerformance","diagnosticsPanel"])text(id,{view_cleared:true});},
    async exportSnapshot(){const result=await P7.diagnosticExport.run({build_profile:"development"});this.refresh();return result;},
    start(){this.refresh();this.timer=setInterval(()=>this.refresh(),1000);byId("diagnosticRefresh")?.addEventListener("click",()=>this.refresh());byId("diagnosticClear")?.addEventListener("click",()=>this.clearView());byId("diagnosticExport")?.addEventListener("click",()=>this.exportSnapshot());byId("diagnosticLogLevel")?.addEventListener("change",e=>P7.logger.setLevel(e.target.value));byId("diagnosticCategory")?.addEventListener("change",e=>{this.category=e.target.value;this.refresh();});},
    stop(){if(this.timer)clearInterval(this.timer);this.timer=null;}
  };
  P2.devDiagnostics=panel;
  document.addEventListener("DOMContentLoaded",()=>panel.start(),{once:true});
})();

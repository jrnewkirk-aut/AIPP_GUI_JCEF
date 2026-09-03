"use strict";
(function(){
 const byId=id=>document.getElementById(id);
 function setState(kind,text){const badge=byId("aippFoundationBadge"),state=byId("aippRuntimeState"),status=byId("aippStatusText");if(badge){badge.className="badge "+kind;badge.textContent=kind==="ready"?"Ready":kind==="error"?"Error":"Starting";}if(state)state.textContent=text;if(status)status.textContent=text;}
 async function check(){const out=byId("aippStatusResult");if(out)out.textContent="Requesting application.aipp.status.request...";try{const response=await P2.application.aippStatus();if(out)out.textContent=JSON.stringify(response.payload,null,2);setState("ready","AIPP application registry is ready.");}catch(error){if(out)out.textContent=String(error&&error.message||error);setState("error","AIPP status request failed.");}}
 async function loadPyrolist(){const out=byId("aippPyrolistResult");if(out)out.textContent="Loading application-owned pyrolist...";try{const data=await P2.application.aippHostAdapter.load();if(out)out.textContent=JSON.stringify({count:data.count,source:data.source,first:data.masterPyroNames.slice(0,5)},null,2);setState("ready","AIPP pyrolist loaded: "+data.count+" formulations.");}catch(error){if(out)out.textContent=String(error&&error.message||error);setState("error","AIPP pyrolist request failed.");}}
 function start(){const button=byId("aippStatusButton"),pyro=byId("aippPyrolistButton");if(button)button.addEventListener("click",check);if(pyro)pyro.addEventListener("click",loadPyrolist);setState("","Waiting for Foundation host readiness.");setTimeout(check,250);}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();

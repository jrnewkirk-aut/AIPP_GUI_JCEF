"use strict";
(function(){
 let cache=null;
 function bridgeReady(){return typeof window.toScilab==="function";}
 function waitForBridge(timeoutMs=10000,pollMs=50){
  if(bridgeReady())return Promise.resolve();
  return new Promise((resolve,reject)=>{
   const started=Date.now();
   const timer=setInterval(()=>{
    if(bridgeReady()){clearInterval(timer);resolve();return;}
    if(Date.now()-started>=timeoutMs){clearInterval(timer);reject(new P2.ProtocolError("AIPP_BRIDGE_NOT_READY","JCEF bridge did not become ready within "+timeoutMs+" ms."));}
   },pollMs);
  });
 }
 async function load(){
  await waitForBridge();
  let response;
  try{response=await P2.client.request("application.aipp.materials.request",{});}
  catch(error){
   if(!bridgeReady())throw new P2.ProtocolError("AIPP_BRIDGE_LOST","JCEF bridge became unavailable during the material request.",{cause:error?.message||String(error)});
   throw new P2.ProtocolError(error?.code||"AIPP_MATERIAL_REQUEST_FAILED",error?.message||"Material request failed.",error?.details||{});
  }
  const payload=response.payload||{};
  if(!payload.materials||typeof payload.materials!=="object"||Array.isArray(payload.materials))throw new P2.ProtocolError("INVALID_AIPP_MATERIALS_RESPONSE","Material definitions are missing.");
  if(!Array.isArray(payload.names)||payload.names.length!==Object.keys(payload.materials).length)throw new P2.ProtocolError("INVALID_AIPP_MATERIALS_RESPONSE","Material metadata is invalid.");
  cache={materials:payload.materials,names:payload.names.slice(),source:payload.source,count:payload.count,applicationVersion:payload.application_version};
  return cache;
 }
 function current(){return cache;}
 function clear(){cache=null;}
 P2.application.registry.register("aippMaterials",load);
 P2.application.aippMaterialLibrary={load,current,clear,bridgeReady,waitForBridge};
})();

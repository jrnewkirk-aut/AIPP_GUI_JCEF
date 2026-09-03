"use strict";
(function(){
 let lastError="";
 function resolve(){
  const candidates=[];
  try{if(typeof window!=="undefined")candidates.push(window.cytoscape);}catch(_){}
  try{if(typeof globalThis!=="undefined")candidates.push(globalThis.cytoscape);}catch(_){}
  try{if(typeof self!=="undefined")candidates.push(self.cytoscape);}catch(_){}
  try{if(typeof module!=="undefined"&&module&&module.exports)candidates.push(module.exports,module.exports.default);}catch(_){}
  for(const candidate of candidates)if(typeof candidate==="function")return candidate;
  return null;
 }
 function available(){return typeof resolve()==="function";}
 function version(){const c=resolve();return c&&String(c.version||"")||"";}
 function create(options){const c=resolve();if(!c){lastError="Cytoscape export is unavailable in the JCEF browser context.";throw new P2.ProtocolError("AIPP_GRAPH_RUNTIME_UNAVAILABLE",lastError);}try{return c(options||{});}catch(e){lastError=String(e&&e.message||e);throw e;}}
 function diagnostics(){return {available:available(),version:version(),error:lastError,windowExport:typeof window!=="undefined"&&typeof window.cytoscape==="function",globalExport:typeof globalThis!=="undefined"&&typeof globalThis.cytoscape==="function"};}
 P2.application.aippGraphRuntime={available,version,create,diagnostics};
})();

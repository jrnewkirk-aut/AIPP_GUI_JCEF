"use strict";
(function(){
 let cache=null;
 const adapter={
  async load(options){const response=await P2.application.aippPyrolist(options);const p=response.payload||{};if(!Array.isArray(p.names)||typeof p.count!=="number")throw new P2.ProtocolError("INVALID_AIPP_PYROLIST_RESPONSE","Pyrolist metadata is invalid.");if(options&&options.includeFormulations===false)return p;if(!p.formulations||typeof p.formulations!=="object")throw new P2.ProtocolError("INVALID_AIPP_PYROLIST_RESPONSE","Pyrolist formulations are missing.");cache={masterPyroList:p.formulations,masterPyroNames:p.names.slice(),source:p.source,count:p.count};return cache;},
  current(){return cache;},
  clear(){cache=null;},
  installLegacyGlobals(target){if(!cache)throw new P2.ProtocolError("AIPP_PYROLIST_NOT_LOADED","Load the pyrolist before installing the legacy adapter.");const t=target||window;t.masterPyroList=cache.masterPyroList;t.masterPyroNames=cache.masterPyroNames.slice();t.pyroListLoadState="loaded "+cache.count+" formulations";return{count:cache.count,source:cache.source};}
 };
 P2.application.aippHostAdapter=adapter;
})();

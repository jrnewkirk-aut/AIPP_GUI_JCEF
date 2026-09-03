"use strict";
(function(){if(typeof P4==="undefined"||!P4.register)return;
 P4.register({id:"AIPP-APP-001",layer:"browser",requirements:["ARC-010"],tier:"standard",name:"AIPP status service is registered",run(){P4.assert.equal(P2.application.registry.has("aippStatus"),true);return{registered:true};}});
 P4.register({id:"AIPP-APP-004",layer:"browser",requirements:["TST-001"],tier:"standard",name:"AIPP shell critical controls exist",run(){const ids=["aippStatusButton","aippStatusResult","aippFoundationBadge","aippRuntimeState"];const missing=ids.filter(id=>!document.getElementById(id));P4.assert.equal(missing.length,0);return{missing};}});
 P4.register({id:"AIPP-APP-006",layer:"browser",requirements:["BLD-006"],tier:"standard",name:"AIPP payload diagnostic is absent from active runtime",run(){P4.assert.equal(typeof window.aippRunPayloadSizeSweep,"undefined");return{runtimeLoaded:false};}});
})();

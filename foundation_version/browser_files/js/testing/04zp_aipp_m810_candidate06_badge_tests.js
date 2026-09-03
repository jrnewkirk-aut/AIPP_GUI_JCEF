"use strict";
(function(){
 function image(chamber){const n=P2.application.aippDeckDocument.blankNative(),a=n.aipp_calculation.assembly;a.chambers=[chamber];return decodeURIComponent(P2.application.aippTopologyGraphAdapter.build(n).nodes[0].data.nodeImage.split(",").slice(1).join(","));}
 P4.register({id:"AIPP-M810-009",name:"Chamber badges show icon and quantity without Pyro or Filter words",layer:"browser",requirements:["TST-001","TST-007"],tier:"standard",run(){const svg=image({label:"Source",pyro:[{},{}],filter:{material:"steel"}});P4.assert.true(svg.includes("× 2"));P4.assert.true(svg.includes("× 1"));P4.assert.equal(svg.includes(">PYRO"),false);P4.assert.equal(svg.includes(">FILTER"),false);return{pyroQuantity:2,filterQuantity:1,wordsRemoved:true};}});
 P4.register({id:"AIPP-M810-010",name:"Zero-count Chamber badges are omitted",layer:"browser",requirements:["TST-001","TST-007"],tier:"standard",run(){const svg=image({label:"Empty"});P4.assert.equal(svg.includes("#fff3e8"),false);P4.assert.equal(svg.includes("#f1f0ff"),false);P4.assert.equal(svg.includes("× 0"),false);return{zeroBadgesOmitted:true};}});
})();

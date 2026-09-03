"use strict";
(function(root){
  const levels=Object.freeze(["debug","info","warn","error"]);
  const categories=Object.freeze(["startup","build","transport","protocol","file_io","state","render","plot","performance","test"]);
  const limits=Object.freeze({browserLogEntries:200,payloadSampleItems:6,payloadSampleChars:160,hashMaxItems:1000000});
  root.P7=Object.assign(root.P7||{},{observabilityVersion:"1.0",implementationVersion:"P7.5.0-0.1",foundationVersion:"P6.4.0-0.1",levels,categories,limits});
})(window);

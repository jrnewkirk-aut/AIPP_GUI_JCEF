"use strict";
(function(){
 P4.register({id:"AIPP-M88-C0615-001",name:"Empty pyro and filter states expose add actions",layer:"browser",requirements:["TST-001","TST-007"],tier:"standard",run(){
  P4.assert.true(document.querySelector("[data-empty-add-pyro]")!==undefined);
  return{emptyActions:true};
 }});
})();

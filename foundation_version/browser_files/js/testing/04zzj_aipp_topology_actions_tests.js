"use strict";
(function(){
 const A=()=>P2.application.aippTopologyActions,C=()=>P2.application.aippTopologyCanvas,D=()=>P2.application.aippDeckDocument,N=()=>P2.application.aippTopologyNavigation;
 const q=id=>document.getElementById(id);
 function withFixture(run){
  const before=D().snapshot();
  const fixture={aipp_calculation:{header:{},auxiliary_files:{},time_specs:{},reaction_specs:{},assembly:{tank_id:0,chambers:[{label:"TA Chamber 1"},{label:"TA Chamber 2"},{label:"TA Chamber 3"}],walls:[],orifices:[{from:1,to:2}],pistons:[]}}};
  let host=q("aippTopologyCanvas"),temporaryHost=false;
  if(!host){host=document.createElement("div");host.id="aippTopologyCanvas";host.setAttribute("data-test-only","AIPP-TOPOACT");host.style.cssText="position:absolute;left:-10000px;top:-10000px;width:800px;height:600px";document.body.appendChild(host);temporaryHost=true;}
  try{
   D().replace(fixture,{markSaved:true,reason:"topoact-fixture"});
   P4.assert.true(C().render(true));
   return run();
  }finally{
   C().clearSelection();A().hideMenu();
   D().replace(before,{markSaved:!before.meta.dirty,reason:"topoact-restore"});
   if(!temporaryHost)C().render(true);
   if(temporaryHost)host.remove();
  }
 }
 P4.register({id:"AIPP-TOPOACT-001",layer:"browser",requirements:["ARC-010","TST-001"],tier:"standard",name:"Topology actions service and toolbar controls are registered",run(){
  P4.assert.true(!!A());
  const ids=["aippTopologyAddChamber","aippTopologyAddOrifice","aippTopologyAddWall","aippTopologyAddPiston","aippTopologyContextMenu","aippTopologyActionError"];
  const missing=ids.filter(id=>!q(id));
  P4.assert.equal(missing.length,0);
  return{missing};
 }});
 P4.register({id:"AIPP-TOPOACT-002",layer:"browser",requirements:["TST-001"],tier:"standard",name:"Add chamber toolbar button creates a chamber",run(){
  return withFixture(()=>{
   const before=P2.application.aippChambers.snapshot().items.length;
   q("aippTopologyAddChamber").click();
   const after=P2.application.aippChambers.snapshot().items.length;
   P4.assert.equal(after,before+1);
   return{before,after};
  });
 }});
 P4.register({id:"AIPP-TOPOACT-003",layer:"browser",requirements:["TST-001"],tier:"standard",name:"Add orifice/wall/piston toolbar buttons create entities",run(){
  return withFixture(()=>{
   const beforeO=P2.application.aippOrifices.snapshot().items.length,beforeW=P2.application.aippWalls.snapshot().items.length,beforeP=P2.application.aippPistons.snapshot().items.length;
   q("aippTopologyAddOrifice").click();q("aippTopologyAddWall").click();q("aippTopologyAddPiston").click();
   P4.assert.equal(P2.application.aippOrifices.snapshot().items.length,beforeO+1);
   P4.assert.equal(P2.application.aippWalls.snapshot().items.length,beforeW+1);
   P4.assert.equal(P2.application.aippPistons.snapshot().items.length,beforeP+1);
   return{orifices:beforeO+1,walls:beforeW+1,pistons:beforeP+1};
  });
 }});
 P4.register({id:"AIPP-TOPOACT-004",layer:"browser",requirements:["TST-001","TST-007"],tier:"standard",name:"Canvas background context menu adds an entity",run(){
  return withFixture(()=>{
   const before=P2.application.aippChambers.snapshot().items.length;
   A().showAddMenu(40,40);
   const menu=q("aippTopologyContextMenu");
   P4.assert.equal(menu.hidden,false);
   const buttons=[...menu.querySelectorAll("button")].map(b=>b.textContent);
   P4.assert.equal(buttons.join(","),"Add Chamber,Add Orifice,Add Wall,Add Piston");
   menu.querySelector("button").click();
   P4.assert.equal(menu.hidden,true);
   P4.assert.equal(P2.application.aippChambers.snapshot().items.length,before+1);
   return{buttons};
  });
 }});
 P4.register({id:"AIPP-TOPOACT-005",layer:"browser",requirements:["TST-001","TST-007"],tier:"standard",name:"Node context menu removes an unreferenced chamber",run(){
  return withFixture(()=>{
   const path=N().pathFor("chamber",3);
   P4.assert.true(C().selectPath(path));
   const data=C().instance.$("node:selected").first().data();
   const before=P2.application.aippChambers.snapshot().items.length;
   A().showNodeMenu(40,40,data);
   const menu=q("aippTopologyContextMenu"),button=menu.querySelector("button");
   P4.assert.true(button.textContent.indexOf("Remove")===0);
   button.click();
   P4.assert.equal(P2.application.aippChambers.snapshot().items.length,before-1);
   P4.assert.equal(C().selectedPath,"");
   return{removed:true};
  });
 }});
 P4.register({id:"AIPP-TOPOACT-006",layer:"browser",requirements:["TST-003"],tier:"standard",name:"Removing an in-use chamber is blocked and reported",run(){
  return withFixture(()=>{
   const path=N().pathFor("chamber",1);
   P4.assert.true(C().selectPath(path));
   const data=C().instance.$("node:selected").first().data();
   const before=P2.application.aippChambers.snapshot().items.length;
   A().removeNode(data);
   P4.assert.equal(P2.application.aippChambers.snapshot().items.length,before);
   const err=q("aippTopologyActionError");
   P4.assert.equal(err.hidden,false);
   P4.assert.true(err.textContent.length>0);
   return{message:err.textContent};
  });
 }});
 P4.register({id:"AIPP-TOPOACT-007",layer:"browser",requirements:["TST-001","TST-007"],tier:"standard",name:"Delete key removes the selected unreferenced node",run(){
  return withFixture(()=>{
   const path=N().pathFor("chamber",3);
   P4.assert.true(C().selectPath(path));
   const before=P2.application.aippChambers.snapshot().items.length;
   document.dispatchEvent(new KeyboardEvent("keydown",{key:"Delete",bubbles:true,cancelable:true}));
   P4.assert.equal(P2.application.aippChambers.snapshot().items.length,before-1);
   return{deleted:true};
  });
 }});
 P4.register({id:"AIPP-TOPOACT-008",layer:"browser",requirements:["TST-003"],tier:"standard",name:"Delete key is ignored while an editable control has focus",run(){
  return withFixture(()=>{
   const path=N().pathFor("chamber",3);
   P4.assert.true(C().selectPath(path));
   const input=document.createElement("input");document.body.appendChild(input);input.focus();
   try{
    const before=P2.application.aippChambers.snapshot().items.length;
    input.dispatchEvent(new KeyboardEvent("keydown",{key:"Delete",bubbles:true,cancelable:true}));
    P4.assert.equal(P2.application.aippChambers.snapshot().items.length,before);
    return{ignored:true};
   }finally{input.remove();}
  });
 }});
 P4.register({id:"AIPP-TOPOACT-009",layer:"integration",requirements:["PRO-009","TST-008"],tier:"standard",name:"Topology actions workflow leaves protocol state clean",run(){
  P4.assert.equal(P2.requests.size,0);
  P4.assert.equal(P2.diagnostics.snapshot().activeTransfers,0);
  return{activeRequests:0,activeTransfers:0};
 }});
})();

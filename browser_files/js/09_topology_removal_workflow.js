/* 09_topology_removal_workflow_v1.js
   Temporary topology removal workflow patch for the refactored v2 package.
   Load after 08_clean_topology_graph_overrides.js.

   Goals:
   - Make Remove... distinct from Scan Dependencies.
   - Show explicit allowed/blocked status.
   - Show repair guidance for blockers.
   - Keep conservative removal rules and preserve all existing features.
*/
function topologyRemovalPathText(path){
  return (path||[]).map((x,i)=>typeof x==='number'?'['+x+']':(i===0?x:'.'+x)).join('').replace('.[','[');
}
function topologyRemovalEntityLabel(type,index){
  return String(type||'entity').charAt(0).toUpperCase()+String(type||'entity').slice(1)+' '+index;
}
function topologyRemovalDirectEventRefs(report){
  return (report&&report.eventReferences||[]).filter(r=>r.severity==='blocker');
}
function topologyRemovalRemapEventRefs(report){
  return (report&&report.eventReferences||[]).filter(r=>r.severity==='remap'&&r.proposedValue!==undefined&&r.proposedValue!==null);
}
function topologyRemovalRepairGuidance(type,ref){
  let kind=ref&&ref.kind||'';
  let path=topologyRemovalPathText(ref&&ref.path||[]);
  let msg=ref&&ref.message||'Blocking dependency found.';
  if(kind==='minimum_chambers')return 'Minimum chamber count blocker: add another chamber before removing this chamber, or keep at least two chambers in the model.';
  if(kind==='orifice_connection')return msg+' Repair by editing the referenced orifice `from`/`to` chamber, removing that orifice first, or choosing a different chamber to remove. Path: '+path;
  if(kind==='wall_chamber_connection')return msg+' Repair by editing the referenced wall connection, removing that wall first, or reassigning its chamber_index. Path: '+path;
  if(kind==='event_reference')return msg+' Repair by editing the event string manually before removal. Path: '+path;
  if(kind==='filter_orifice_reference')return msg+' Repair by removing or changing the filter orifices entry before removing this orifice. Path: '+path;
  if(kind==='wall_wall_connection')return msg+' Repair by editing the wall-to-wall connection or removing the dependent wall first. Path: '+path;
  return msg+(path?' Path: '+path:'');
}
function buildRemovalPlan(type,index,report){
  let directRefs=(report&&report.directReferences)||[];
  let directEventRefs=topologyRemovalDirectEventRefs(report);
  let remapEventRefs=topologyRemovalRemapEventRefs(report);
  let blockers=[];
  let blockerItems=[];
  directRefs.forEach(r=>{blockers.push(r.message);blockerItems.push(r);});
  directEventRefs.forEach(r=>{blockers.push('Direct event reference requires manual repair before removal: '+r.message);blockerItems.push(r);});
  let warnings=[];
  if((report.shiftedReferences||[]).length)warnings.push(report.shiftedReferences.length+' index reference(s) will be remapped automatically after removal.');
  if(remapEventRefs.length)warnings.push(remapEventRefs.length+' event reference(s) can be remapped automatically if event remapping remains enabled.');
  let actions=['Create a full JSON snapshot for undo.','Remove assembly.'+(type==='chamber'?'chambers':type==='orifice'?'orifices':'walls')+'['+(index-1)+'].','Refresh tree, code editor, graph, and popup state.'];
  if((report.shiftedReferences||[]).length)actions.splice(1,0,'Apply index remaps shown in the preview.');
  if(remapEventRefs.length)actions.splice(1,0,'Apply event-string remaps if the checkbox remains enabled.');
  return {type,index,report,blockers,warnings,actions,directEventRefs,remapEventRefs,blockerItems,allowed:blockers.length===0};
}
function openRemovePreview(){
  if(!popupNode||!popupPath){setStatus('No selected entity to remove.',false);return;}
  if(typeof applyPopupEditsForTopologyIfNeeded==='function')applyPopupEditsForTopologyIfNeeded();
  let idx=Number(popupPath[popupPath.length-1])+1;
  let report=scanEntityDependencies(popupNode.type,idx,'delete');
  pendingRemovalPlan=buildRemovalPlan(popupNode.type,idx,report);
  showRemovePreview(pendingRemovalPlan);
}
function showRemovePreview(plan){
  let modal=document.getElementById('removeModal'),body=document.getElementById('removeModalBody'),title=document.getElementById('removeModalTitle'),btn=document.getElementById('applyRemoveBtn'),status=document.getElementById('removeModalStatus');
  if(!modal||!body||!title||!btn||!status){setStatus('Remove preview modal is not available.',false);return;}
  title.textContent='Remove Preview: '+topologyRemovalEntityLabel(plan.type,plan.index);
  body.innerHTML='';

  let banner=document.createElement('div');
  banner.className='removePlan '+(plan.allowed?'removeAllowed':'removeBlocked');
  let bh=document.createElement('div');
  bh.className='removePlanTitle';
  bh.textContent=plan.allowed?'Removal allowed':'Removal blocked';
  let bb=document.createElement('div');
  bb.className='removePlanBody';
  bb.innerHTML=plan.allowed
    ? '<b>No direct blockers were found.</b><br>Review the planned actions and remaps before applying removal.'
    : '<b>Direct dependencies must be repaired before this entity can be removed.</b><br>The Apply Removal button is disabled until blockers are resolved.';
  banner.append(bh,bb);
  body.appendChild(banner);

  topologyRemovalRenderPlanList(body,'Planned actions',plan.actions,'removeAllowed');
  topologyRemovalRenderPlanList(body,'Blocking issues',plan.blockers,'removeBlocked');
  topologyRemovalRenderRepairGuidance(body,plan);
  topologyRemovalRenderPlanList(body,'Warnings',plan.warnings,'removeWarn');
  topologyRemovalRenderIndexPreview(body,plan);
  topologyRemovalRenderEventPreview(body,plan);

  btn.disabled=!plan.allowed;
  btn.textContent=plan.allowed?'Apply Removal':'Apply Removal - Blocked';
  status.textContent=plan.allowed?'Ready to apply removal. A snapshot will be saved first.':'Resolve blockers before removal.';
  status.className=plan.allowed?'ok':'bad';
  modal.style.display='flex';
}
function topologyRemovalRenderPlanList(parent,title,items,cls){
  let box=document.createElement('div');box.className='removePlan '+cls;
  let h=document.createElement('div');h.className='removePlanTitle';h.textContent=title+' ('+items.length+')';box.appendChild(h);
  let b=document.createElement('div');b.className='removePlanBody';
  if(!items.length)b.textContent='None.';
  else{let ul=document.createElement('ul');ul.className='removeList';items.forEach(x=>{let li=document.createElement('li');li.textContent=x;ul.appendChild(li);});b.appendChild(ul);}
  box.appendChild(b);parent.appendChild(box);
}
function topologyRemovalRenderRepairGuidance(parent,plan){
  let items=(plan.blockerItems||[]).map(r=>topologyRemovalRepairGuidance(plan.type,r));
  let box=document.createElement('div');box.className='removePlan '+(items.length?'removeBlocked':'removeAllowed');
  let h=document.createElement('div');h.className='removePlanTitle';h.textContent='Repair guidance ('+items.length+')';box.appendChild(h);
  let b=document.createElement('div');b.className='removePlanBody';
  if(!items.length)b.textContent='No repairs required for direct dependencies.';
  else{let ul=document.createElement('ul');ul.className='removeList';items.forEach(x=>{let li=document.createElement('li');li.textContent=x;ul.appendChild(li);});b.appendChild(ul);}
  box.appendChild(b);parent.appendChild(box);
}
function topologyRemovalRenderIndexPreview(parent,plan){
  let refs=(plan.report&&plan.report.shiftedReferences)||[];
  let box=document.createElement('div');box.className='removePlan removeWarn';
  let h=document.createElement('div');h.className='removePlanTitle';h.textContent='Index remap preview ('+refs.length+')';box.appendChild(h);
  let b=document.createElement('div');b.className='removePlanBody';
  if(!refs.length)b.textContent='No index remaps found.';
  else b.appendChild(topologyRemovalMakePreviewTable(refs));
  box.appendChild(b);parent.appendChild(box);
}
function topologyRemovalRenderEventPreview(parent,plan){
  let box=document.createElement('div');box.className='removePlan removeWarn';
  let h=document.createElement('div');h.className='removePlanTitle';h.textContent='Event remap preview ('+plan.remapEventRefs.length+')';box.appendChild(h);
  let b=document.createElement('div');b.className='removePlanBody';
  if(!plan.remapEventRefs.length)b.textContent='No remappable event references found.';
  else{
    let label=document.createElement('label');label.className='eventRemapToggle';
    let chk=document.createElement('input');chk.type='checkbox';chk.checked=applyEventRemapsOnRemoval;chk.onchange=()=>applyEventRemapsOnRemoval=chk.checked;
    label.append(chk,document.createTextNode('Apply these event-string remaps during removal'));
    b.appendChild(label);
    b.appendChild(topologyRemovalMakePreviewTable(plan.remapEventRefs));
  }
  box.appendChild(b);parent.appendChild(box);
}
function topologyRemovalMakePreviewTable(refs){
  let table=document.createElement('table');table.className='eventRemapTable';
  table.innerHTML='<thead><tr><th>JSON path</th><th>Current</th><th>Proposed</th></tr></thead><tbody></tbody>';
  let tb=table.querySelector('tbody');
  refs.forEach(r=>{let tr=document.createElement('tr');tr.innerHTML='<td class="eventRemapPath">'+escapeHtml(topologyRemovalPathText(r.path||[]))+'</td><td><span class="eventRemapValue">'+escapeHtml(String(r.currentValue))+'</span></td><td><span class="eventRemapValue">'+escapeHtml(String(r.proposedValue))+'</span></td>';tb.appendChild(tr);});
  return table;
}
function applyRemovalFromPreview(){
  if(!pendingRemovalPlan||!pendingRemovalPlan.allowed){setStatus('Removal is blocked. Resolve direct dependencies first.',false);return;}
  lastRemovalSnapshot=deepCopy(fullJson);
  let plan=pendingRemovalPlan,info=ensureAssembly(),a=info.assembly,idx0=plan.index-1;
  if(applyEventRemapsOnRemoval)applyEventReferenceRemaps(plan.remapEventRefs);
  if(plan.type==='chamber'){
    applyChamberIndexDeleteRemap(plan.index);
    a.chambers.splice(idx0,1);
  }else if(plan.type==='orifice'){
    applyOrificeIndexDeleteRemap(plan.index);
    a.orifices.splice(idx0,1);
  }else if(plan.type==='wall'){
    applyWallIndexDeleteRemap(plan.index);
    a.walls.splice(idx0,1);
  }
  closeRemoveModal();closeDependencyModal();closePopup();refreshAllViews();
  setStatus('Removed '+plan.type+' '+plan.index+'. Snapshot saved for undo.',true);
}
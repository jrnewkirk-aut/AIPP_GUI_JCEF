/* Hotfix: filter/orifice selection is from-side only.
   A chamber filter can only interact with orifices whose `from` chamber is the active chamber.
   Load after 12_hotfix_filter_chamber_index.js. */
function aippPatch2ConnectedOrificeIndicesForChamber(chamberIndex){
  let a=ensureAssembly().assembly,out=[];
  chamberIndex=Number(chamberIndex);
  if(!a||!Array.isArray(a.orifices)||!Number.isFinite(chamberIndex)||chamberIndex<1)return out;
  (a.orifices||[]).forEach((o,i)=>{
    if(Number(o.from)===chamberIndex)out.push(i+1);
  });
  return out;
}
function buildFilterOrificeSelector(filt,chamberIndex){
  let wrap=document.createElement('div');
  if(!Array.isArray(filt.orifices))filt.orifices=[];
  chamberIndex=Number(chamberIndex)||(typeof aippPatch2CurrentPopupChamberIndex==='function'?aippPatch2CurrentPopupChamberIndex():0);
  let allowed=aippPatch2ConnectedOrificeIndicesForChamber(chamberIndex),allowedSet=new Set(allowed.map(Number)),selectedSet=new Set(filt.orifices.map(Number).filter(Number.isFinite));
  let invalid=Array.from(selectedSet).filter(v=>!allowedSet.has(v));
  let boxes=document.createElement('div');
  boxes.style.display='flex';boxes.style.flexWrap='wrap';boxes.style.gap='8px';boxes.style.alignItems='center';
  if(!allowed.length){
    let note=document.createElement('div');
    note.className='repairNote';
    note.textContent='No orifices have their from connection assigned to Chamber '+(chamberIndex||'?')+', so no filter/orifice connection can be selected.';
    wrap.appendChild(note);
  }else{
    allowed.forEach(i=>{
      let lab=document.createElement('label');
      lab.style.display='inline-flex';lab.style.alignItems='center';lab.style.gap='4px';lab.style.fontSize='12px';
      let cb=document.createElement('input');
      cb.type='checkbox';cb.style.width='auto';cb.dataset.orificeIndex=String(i);cb.checked=selectedSet.has(i);
      cb.onchange=()=>{
        let selected=[];
        boxes.querySelectorAll('input[data-orifice-index]').forEach(x=>{if(x.checked)selected.push(Number(x.dataset.orificeIndex));});
        filt.orifices=selected.sort((a,b)=>a-b);
        raw.value=JSON.stringify(filt.orifices);
      };
      lab.append(cb,document.createTextNode('O'+i));
      boxes.appendChild(lab);
    });
    wrap.appendChild(boxes);
  }
  if(invalid.length){
    let warn=document.createElement('div');
    warn.className='repairNote';
    warn.textContent='Existing invalid filter/orifice references were found. These orifices do not have their from connection assigned to Chamber '+(chamberIndex||'?')+': '+invalid.join(', ')+'. They will be removed if the raw list is edited or if any checkbox is changed.';
    wrap.appendChild(warn);
  }
  let raw=inpText(JSON.stringify(filt.orifices),v=>{
    let requested=Array.from(new Set(parseIntegerArrayText(v))).sort((a,b)=>a-b);
    let kept=requested.filter(x=>allowedSet.has(x));
    let rejected=requested.filter(x=>!allowedSet.has(x));
    filt.orifices=kept;
    if(rejected.length)setStatus('Rejected filter orifice reference(s) whose from connection is not Chamber '+(chamberIndex||'?')+': '+rejected.join(', '),false);
    renderInspector();
  });
  raw.style.marginTop='6px';
  wrap.appendChild(raw);
  return wrap;
}

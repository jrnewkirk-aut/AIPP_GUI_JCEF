/* Hotfix: infer chamber index from popupPath for chamber filter editor.
   This overrides the Patch 2 helper functions that could not infer the chamber index
   from popupWorkingCopy because popupWorkingCopy is a deep copy and is not === to the
   object stored in fullJson. */
function aippPatch2CurrentPopupChamberIndex(){
  if(popupNode&&popupNode.type==='chamber'&&Array.isArray(popupPath)&&popupPath.length){
    const idx=Number(popupPath[popupPath.length-1]);
    if(Number.isFinite(idx))return idx+1;
  }
  return 0;
}
function aippPatch2InferChamberIndex(ch,path){
  const popupIdx=aippPatch2CurrentPopupChamberIndex();
  if(popupIdx)return popupIdx;
  if(path&&typeof path[path.length-1]==='number')return path[path.length-1]+1;
  let a=ensureAssembly().assembly;
  if(a&&Array.isArray(a.chambers)){
    let i=a.chambers.indexOf(ch);
    if(i>=0)return i+1;
  }
  return 0;
}
function aippPatch2ConnectedOrificeIndicesForChamber(chamberIndex){
  let a=ensureAssembly().assembly,out=[];
  chamberIndex=Number(chamberIndex);
  if(!a||!Array.isArray(a.orifices)||!Number.isFinite(chamberIndex)||chamberIndex<1)return out;
  (a.orifices||[]).forEach((o,i)=>{
    if(Number(o.from)===chamberIndex||Number(o.to)===chamberIndex)out.push(i+1);
  });
  return out;
}
function buildFilterOrificeSelector(filt,chamberIndex){
  let wrap=document.createElement('div');
  if(!Array.isArray(filt.orifices))filt.orifices=[];
  chamberIndex=Number(chamberIndex)||aippPatch2CurrentPopupChamberIndex();
  let allowed=aippPatch2ConnectedOrificeIndicesForChamber(chamberIndex),allowedSet=new Set(allowed.map(Number)),selectedSet=new Set(filt.orifices.map(Number).filter(Number.isFinite));
  let invalid=Array.from(selectedSet).filter(v=>!allowedSet.has(v));
  let boxes=document.createElement('div');
  boxes.style.display='flex';boxes.style.flexWrap='wrap';boxes.style.gap='8px';boxes.style.alignItems='center';
  if(!allowed.length){
    let note=document.createElement('div');
    note.className='repairNote';
    note.textContent='No orifices are connected to Chamber '+(chamberIndex||'?')+', so no filter/orifice connection can be selected.';
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
    warn.textContent='Existing invalid filter/orifice references were found and are not connected to Chamber '+(chamberIndex||'?')+': '+invalid.join(', ')+'. They will be removed if the raw list is edited or if any checkbox is changed.';
    wrap.appendChild(warn);
  }
  let raw=inpText(JSON.stringify(filt.orifices),v=>{
    let requested=Array.from(new Set(parseIntegerArrayText(v))).sort((a,b)=>a-b);
    let kept=requested.filter(x=>allowedSet.has(x));
    let rejected=requested.filter(x=>!allowedSet.has(x));
    filt.orifices=kept;
    if(rejected.length)setStatus('Rejected filter orifice reference(s) not connected to Chamber '+(chamberIndex||'?')+': '+rejected.join(', '),false);
    renderInspector();
  });
  raw.style.marginTop='6px';
  wrap.appendChild(raw);
  return wrap;
}
function buildChamberFilterManager(ch,path){
  let chamberIndex=aippPatch2InferChamberIndex(ch,path),g=document.createElement('div'),h=document.createElement('div'),b=document.createElement('div');
  g.className='insGroup filterManagerGroup';
  h.className='insGroupHeader';
  h.innerHTML='<span>filters</span><span class="smartGroupBadge">optional chamber filters</span>';
  b.className='insGroupBody';g.append(h,b);
  let meta=getChamberFilterItems(ch),arr=meta.arr;
  if(!arr.length){let note=document.createElement('div');note.className='repairNote';note.textContent='No filters are currently defined for this chamber.';b.appendChild(note);}
  arr.forEach((filt,i)=>{
    if(!filt||typeof filt!=='object'||Array.isArray(filt)){filt=createDefaultFilter();arr[i]=filt;}
    if(filt.material===undefined)filt.material='steel';
    if(filt.mass===undefined)filt.mass='0.0 g';
    if(filt.method===undefined)filt.method='PERCENTAGE';
    if(filt.coefficient===undefined)filt.coefficient=0.0;
    if(!Array.isArray(filt.orifices))filt.orifices=[];
    let card=document.createElement('div');card.className='pyroEditCard';
    let title=document.createElement('div');title.className='pyroEditTitle';title.textContent='Filter '+(i+1);card.appendChild(title);
    card.appendChild(smartRow('material',inpText(filt.material,v=>filt.material=v)));
    card.appendChild(smartRow('mass',inpText(filt.mass,v=>filt.mass=v)));
    card.appendChild(smartRow('method',sel(['PERCENTAGE','KNTU'],filt.method,v=>filt.method=v)));
    card.appendChild(smartRow('coefficient',inpText(filt.coefficient,v=>{let n=Number(v);filt.coefficient=Number.isFinite(n)?n:0;})));
    card.appendChild(smartRow('orifices',buildFilterOrificeSelector(filt,chamberIndex)));
    let handled=['material','mass','method','coefficient','orifices'];
    let extra=Object.keys(filt).filter(k=>!handled.includes(k));
    if(extra.length){let ex=document.createElement('div'),eh=document.createElement('div'),eb=document.createElement('div');ex.className='insGroup';eh.className='insGroupHeader';eh.innerHTML='<span>additional filter keys</span><span class="smartGroupBadge">basic editable JSON fields</span>';eb.className='insGroupBody';ex.append(eh,eb);extra.forEach(k=>eb.appendChild(buildAny(k,filt[k],path.concat([meta.key,i,k]))));card.appendChild(ex);}
    let rm=document.createElement('button');rm.className='smartMiniBtn';rm.textContent='Remove Filter';rm.onclick=()=>{arr.splice(i,1);setChamberFilterItems(ch,meta,arr);renderInspector();};card.appendChild(rm);
    b.appendChild(card);
  });
  let add=document.createElement('button');add.className='smallBtn';add.textContent='Add Filter';add.onclick=()=>{let latest=getChamberFilterItems(ch),next=latest.arr.slice();next.push(createDefaultFilter());setChamberFilterItems(ch,latest,next);renderInspector();};b.appendChild(add);
  return g;
}


/*
  Cytoscape zoom/size v5 patch.
  Append this module after the existing Cytoscape graph module so these function definitions override v4.
  Keeps all existing editors/features intact.
*/
function renderCytoscapePrototype(){
  const cyEl = ensureCyContainer();
  loadCytoscapeLocalThen(ok => {
    if(!ok){
      cyEl.innerHTML = '<div class="cyMissing"><b>Cytoscape is required for this version.</b><br/>Place reviewed local vendor file at <code>browser_files/vendor/cytoscape.min.js</code>.</div>';
      return;
    }
    cyEl.innerHTML = '';
    cyEl.appendChild(ensureCyOverlayLayer());
    if(fullJson) buildGraph(fullJson);
    const model = buildCytoscapeElements(computeAippCytoscapeLayoutPositions());
    cyPrototype = cytoscape({
      container: cyEl,
      elements: model.elements,
      style: cytoscapePrototypeStyle(),
      layout: { name: 'preset', fit: false, padding: 90 },
      // Native wheel zoom felt unintuitive in the embedded browser, so keep it off
      // and use the custom viewport handler below.
      userZoomingEnabled: false,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
      autounselectify: true,
      minZoom: 0.10,
      maxZoom: 4.0,
      hideEdgesOnViewport: true,
      textureOnViewport: true,
      motionBlur: false,
      pixelRatio: 1
    });
    cyPrototype.on('dbltap', 'node', evt => {
      const nodeId = evt.target.id();
      const n = simNodes.find(x => x.id === nodeId);
      if(n) openPopup(n);
    });
    installSmoothCytoscapeWheelZoom(cyPrototype);
    buildCytoscapeChamberOverlays();
    cyPrototype.on('pan zoom resize position drag free layoutstop', scheduleCytoscapeOverlayUpdate);
    cyPrototype.ready(() => { applyAippCytoscapeLayout(false); setInitialCytoscapeViewport(); });
    scheduleCytoscapeOverlayUpdate();
    setStatus(`Cytoscape graph loaded: ${simNodes.length} nodes, ${simEdges.length} links.`, true);
  });
}

function installSmoothCytoscapeWheelZoom(cy){
  const container = cy.container();
  if(!container || container.dataset.smoothZoomReady === '1') return;
  container.dataset.smoothZoomReady = '1';
  container.addEventListener('wheel', evt => {
    evt.preventDefault();
    const rect = container.getBoundingClientRect();
    const rendered = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    const zoom0 = cy.zoom();
    const pan0 = cy.pan();
    // Exponential zoom is smoother and more predictable than large wheel steps.
    const factor = Math.exp(-evt.deltaY * 0.0018);
    const zoom1 = Math.max(cy.minZoom(), Math.min(cy.maxZoom(), zoom0 * factor));
    const model = { x: (rendered.x - pan0.x) / zoom0, y: (rendered.y - pan0.y) / zoom0 };
    const pan1 = { x: rendered.x - model.x * zoom1, y: rendered.y - model.y * zoom1 };
    cy.viewport({ zoom: zoom1, pan: pan1 });
    scheduleCytoscapeOverlayUpdate();
  }, { passive:false });
}

function computeAippCytoscapeLayoutPositions(){
  const pos = {};
  const chambers = simNodes.filter(n=>n.type==='chamber').sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
  const orifices = simNodes.filter(n=>n.type==='orifice').sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
  const walls = simNodes.filter(n=>n.type==='wall').sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
  const chamberGap = 390, chamberY = 340, chamberX0 = 190;
  chambers.forEach((n,i)=>{ pos[n.id] = { x: chamberX0 + i*chamberGap, y: chamberY }; });
  const pairGroups = {};
  for(const oNode of orifices){
    const o=oNode.data||{}, from=parseInt(o.from), to=parseInt(o.to);
    const key=Number.isFinite(from)&&Number.isFinite(to)?`${Math.min(from,to)}-${Math.max(from,to)}`:'unknown';
    if(!pairGroups[key]) pairGroups[key]=[];
    pairGroups[key].push(oNode);
  }
  Object.keys(pairGroups).forEach(key=>{
    const group=pairGroups[key];
    group.forEach((oNode,idx)=>{
      const o=oNode.data||{}, from=parseInt(o.from), to=parseInt(o.to);
      const a=pos['c'+from]||{x:oNode.x-120,y:chamberY}, b=pos['c'+to]||{x:oNode.x+120,y:chamberY};
      const centered=idx-(group.length-1)/2;
      pos[oNode.id]={ x:(a.x+b.x)/2 + centered*120, y:chamberY-185-Math.abs(centered)*44 };
    });
  });
  const wallGroups={};
  for(const wNode of walls){
    const w=wNode.data||{};
    const left=w.left_connection&&w.left_connection.chamber_index?parseInt(w.left_connection.chamber_index):null;
    const right=w.right_connection&&w.right_connection.chamber_index?parseInt(w.right_connection.chamber_index):null;
    const chamberIndex=left||right||1;
    if(!wallGroups[chamberIndex]) wallGroups[chamberIndex]=[];
    wallGroups[chamberIndex].push(wNode);
  }
  Object.keys(wallGroups).forEach(chamberIndex=>{
    const group=wallGroups[chamberIndex], anchor=pos['c'+chamberIndex]||{x:chamberX0,y:chamberY};
    group.forEach((wNode,idx)=>{
      const centered=idx-(group.length-1)/2;
      pos[wNode.id]={ x:anchor.x+centered*105, y:anchor.y+190+Math.abs(centered)*28 };
    });
  });
  return pos;
}

function setInitialCytoscapeViewport(){
  if(!cyPrototype) return;
  const c1=cyPrototype.getElementById('c1');
  if(c1&&c1.length){
    cyPrototype.zoom(0.82);
    const p=c1.position(), container=cyPrototype.container();
    const w=container?container.clientWidth:900, h=container?container.clientHeight:500;
    cyPrototype.pan({ x:w*0.23-p.x*0.82, y:h*0.47-p.y*0.82 });
  } else cyPrototype.fit(cyPrototype.elements(),90);
  scheduleCytoscapeOverlayUpdate();
}

function cytoscapePrototypeStyle(){
  return [
    {selector:'node',style:{'label':'data(label)','text-wrap':'wrap','text-max-width':160,'text-valign':'center','text-halign':'center','font-family':'Arial, sans-serif','font-size':15,'font-weight':800,'color':'#005495','background-color':'#ededed','border-color':'#005495','border-width':2.5,'width':120,'height':56,'shape':'round-rectangle','overlay-opacity':0}},
    {selector:'node[type="chamber"]',style:{'background-color':'#ffffff','border-color':'#005495','border-width':3,'width':260,'height':118,'label':''}},
    {selector:'node[type="orifice"]',style:{'background-color':'#009fe3','border-color':'#005495','border-width':2.5,'color':'#001669','width':184,'height':76,'font-size':15}},
    {selector:'node[type="wall"]',style:{'shape':'diamond','background-color':'#eaf4ff','border-color':'#005495','border-width':2.5,'width':128,'height':128,'font-size':14}},
    {selector:'edge',style:{'width':3,'line-color':'#6b7280','target-arrow-color':'#6b7280','target-arrow-shape':'triangle','curve-style':'bezier'}},
    {selector:'edge[type="wall"]',style:{'line-color':'#8a8a8a','line-style':'dashed','target-arrow-shape':'none','width':2.5}}
  ];
}

function updateCytoscapeOverlayPositions(){
  cyOverlayRaf=null;
  if(!cyPrototype) return;
  ensureCyOverlayLayer();
  cyPrototype.nodes('[type="chamber"]').forEach(node=>{
    const card=document.getElementById('cyOverlay_'+node.id()); if(!card) return;
    const rp=node.renderedPosition();
    const bb=node.renderedBoundingBox({includeLabels:false,includeOverlays:false});
    const w=Math.max(90,bb.w+2), h=Math.max(54,bb.h+2);
    card.style.width=w+'px'; card.style.minHeight=h+'px';
    card.style.left=(rp.x-w/2)+'px'; card.style.top=(rp.y-h/2)+'px';
  });
}

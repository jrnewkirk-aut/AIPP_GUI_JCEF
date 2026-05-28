/*
  17_graph_cytoscape_prototype.js
  Additive Cytoscape.js prototype engine.

  v2 changes:
  - Faster/smoother wheel zoom and viewport interactions.
  - Cytoscape container targets #vizWrap.
  - Chamber descriptions rendered as HTML overlays for readability.
  - Existing SVG engine remains default and unchanged.
*/
let graphEngine = 'cytoscape';
let cyPrototype = null;
let cytoscapeLoadStarted = false;
let cytoscapeLoadFailed = false;
let cyOverlayRaf = null;
let cyChamberOverlayLayer = null;

function setGraphEngine(engine){
  graphEngine = engine;

  const svgEl = document.getElementById('svg');
  const cyEl = ensureCyContainer();
  const svgBtn = document.getElementById('graphEngineSvgBtn');
  const cyBtn = document.getElementById('graphEngineCyBtn');
  const status = document.getElementById('graphEngineStatus');
  const zoomControls = document.getElementById('flowZoomControls');

  if(svgBtn){
    svgBtn.classList.toggle('active', engine === 'svg');
    svgBtn.classList.toggle('secondary', engine !== 'svg');
  }
  if(cyBtn){
    cyBtn.classList.toggle('active', engine === 'cytoscape');
    cyBtn.classList.toggle('secondary', engine !== 'cytoscape');
  }

  if(engine === 'svg'){
    if(svgEl) svgEl.style.display = '';
    if(cyEl) cyEl.style.display = 'none';
    if(zoomControls) zoomControls.style.display = 'flex';
    if(status) status.textContent = 'SVG engine active.';
    return;
  }

  if(svgEl) svgEl.style.display = 'none';
  if(zoomControls) zoomControls.style.display = 'none';
  cyEl.style.display = 'block';
  if(status) status.textContent = 'Cytoscape prototype selected.';

  renderCytoscapePrototype();
}

function ensureCyContainer(){
  let cyEl = document.getElementById('cyGraph');
  if(cyEl) return cyEl;

  const visual = document.getElementById('vizWrap') || document.getElementById('right') || document.getElementById('main');
  cyEl = document.createElement('div');
  cyEl.id = 'cyGraph';
  cyEl.style.display = 'none';

  cyChamberOverlayLayer = document.createElement('div');
  cyChamberOverlayLayer.id = 'cyChamberOverlayLayer';
  cyEl.appendChild(cyChamberOverlayLayer);

  if(visual){
    visual.style.position = 'relative';
    visual.appendChild(cyEl);
  }
  return cyEl;
}

function ensureCyOverlayLayer(){
  const cyEl = ensureCyContainer();
  let layer = document.getElementById('cyChamberOverlayLayer');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'cyChamberOverlayLayer';
    cyEl.appendChild(layer);
  }
  cyChamberOverlayLayer = layer;
  return layer;
}

function loadCytoscapeLocalThen(callback){
  if(window.cytoscape){ callback(true); return; }
  if(cytoscapeLoadFailed){ callback(false); return; }
  if(cytoscapeLoadStarted){
    setTimeout(()=>loadCytoscapeLocalThen(callback), 50);
    return;
  }
  cytoscapeLoadStarted = true;
  const script = document.createElement('script');
  script.src = '../vendor/cytoscape.min.js';
  script.onload = () => callback(!!window.cytoscape);
  script.onerror = () => { cytoscapeLoadFailed = true; callback(false); };
  document.head.appendChild(script);
}

function renderCytoscapePrototype(){
  const cyEl = ensureCyContainer();
  loadCytoscapeLocalThen(ok => {
    if(!ok){
      cyEl.innerHTML = '<div class="cyMissing"><b>Cytoscape prototype unavailable.</b><br/>Place reviewed local vendor file at <code>browser_files/vendor/cytoscape.min.js</code>. The current SVG engine remains available and unchanged.</div>';
      return;
    }

    // Preserve the overlay layer while clearing any old Cytoscape canvas children.
    cyEl.innerHTML = '';
    cyEl.appendChild(ensureCyOverlayLayer());

    const model = buildCytoscapeElements(fullJson);
    cyPrototype = cytoscape({
      container: cyEl,
      elements: model.elements,
      style: cytoscapePrototypeStyle(),
      layout: { name: 'preset', fit: true, padding: 90 },

      // Viewport behavior: faster than the first prototype, but not jumpy.
      wheelSensitivity: 0.45,
      minZoom: 0.08,
      maxZoom: 7,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
      autounselectify: true,

      // Performance options that help wheel zoom feel less clunky in embedded browsers.
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

    // HTML overlays make chamber text much more readable than canvas multiline labels.
    buildCytoscapeChamberOverlays();
    cyPrototype.on('pan zoom resize position drag free layoutstop', scheduleCytoscapeOverlayUpdate);
    scheduleCytoscapeOverlayUpdate();
  });
}

function buildCytoscapeElements(j){
  // Keep source of truth identical to SVG graph: reuse simNodes/simEdges.
  if(!simNodes.length) buildGraph(j);
  const elements = [];
  for(const n of simNodes){
    elements.push({
      group: 'nodes',
      data: { id: n.id, label: n.type === 'chamber' ? '' : n.label, type: n.type },
      position: { x: n.x, y: n.y }
    });
  }
  simEdges.forEach((e, i) => {
    elements.push({
      group: 'edges',
      data: { id: 'e' + i, source: e.a, target: e.b, type: e.type || 'flow' }
    });
  });
  return { elements };
}

function cytoscapePrototypeStyle(){
  return [
    { selector: 'node', style: {
      'label': 'data(label)',
      'text-wrap': 'wrap',
      'text-max-width': 120,
      'text-valign': 'center',
      'text-halign': 'center',
      'font-family': 'Arial, sans-serif',
      'font-size': 12,
      'font-weight': 700,
      'color': '#005495',
      'background-color': '#ededed',
      'border-color': '#005495',
      'border-width': 2,
      'width': 90,
      'height': 48,
      'shape': 'round-rectangle',
      'overlay-opacity': 0
    }},
    { selector: 'node[type="chamber"]', style: {
      // The HTML overlay supplies the readable chamber card. The Cytoscape node is the drag/select body.
      'background-color': '#ffffff',
      'border-color': '#005495',
      'border-width': 3,
      'width': 260,
      'height': 118,
      'label': ''
    }},
    { selector: 'node[type="orifice"]', style: {
      'background-color': '#009fe3',
      'border-color': '#005495',
      'border-width': 2,
      'color': '#001669',
      'width': 92,
      'height': 38
    }},
    { selector: 'node[type="wall"]', style: {
      'shape': 'diamond',
      'background-color': '#d0d0d0',
      'border-color': '#005495',
      'border-width': 2,
      'width': 64,
      'height': 64
    }},
    { selector: 'edge', style: {
      'width': 2,
      'line-color': '#6b7280',
      'target-arrow-color': '#6b7280',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier'
    }},
    { selector: 'edge[type="wall"]', style: {
      'line-color': '#8a8a8a',
      'line-style': 'dashed',
      'target-arrow-shape': 'none'
    }}
  ];
}

function buildCytoscapeChamberOverlays(){
  const layer = ensureCyOverlayLayer();
  layer.innerHTML = '';
  if(!cyPrototype) return;

  cyPrototype.nodes('[type="chamber"]').forEach(node => {
    const n = simNodes.find(x => x.id === node.id());
    if(!n) return;
    const card = document.createElement('div');
    card.className = 'cyChamberCardOverlay';
    card.id = 'cyOverlay_' + node.id();
    card.innerHTML = cytoscapeChamberCardHtml(n);
    card.addEventListener('dblclick', ev => { ev.preventDefault(); openPopup(n); });
    layer.appendChild(card);
  });
}

function cytoscapeChamberCardHtml(n){
  const ch = n.data || {};
  const py = getChamberItemNames(ch, ['pyro','pyros'], 'Pyro');
  const fi = getChamberItemNames(ch, ['filter','filters'], 'Filter');
  const volume = escapeHtml(truncText(getChamberVolumeText(ch), 28));
  let html = `<div class="cyChamberTitle">${escapeHtml(n.label)}</div>`;
  html += `<div class="cyChamberVolume">Volume: ${volume}</div>`;
  if(py.length){
    html += `<div class="cyChamberSection"><span class="cySectionTitle">Pyros</span><span class="cySectionValue">${escapeHtml(py.slice(0,2).join(', '))}${py.length>2?' +'+(py.length-2):''}</span></div>`;
  }
  if(fi.length){
    html += `<div class="cyChamberSection"><span class="cySectionTitle">Filters</span><span class="cySectionValue">${escapeHtml(fi.slice(0,1).join(', '))}${fi.length>1?' +'+(fi.length-1):''}</span></div>`;
  }
  return html;
}

function scheduleCytoscapeOverlayUpdate(){
  if(cyOverlayRaf) cancelAnimationFrame(cyOverlayRaf);
  cyOverlayRaf = requestAnimationFrame(updateCytoscapeOverlayPositions);
}

function updateCytoscapeOverlayPositions(){
  cyOverlayRaf = null;
  if(!cyPrototype) return;
  const layer = ensureCyOverlayLayer();
  cyPrototype.nodes('[type="chamber"]').forEach(node => {
    const card = document.getElementById('cyOverlay_' + node.id());
    if(!card) return;
    const rp = node.renderedPosition();
    const bb = node.renderedBoundingBox({ includeLabels: false, includeOverlays: false });
    const w = Math.max(180, Math.min(270, bb.w));
    const h = Math.max(96, Math.min(150, bb.h));
    card.style.width = w + 'px';
    card.style.minHeight = h + 'px';
    card.style.left = (rp.x - w/2) + 'px';
    card.style.top = (rp.y - h/2) + 'px';
  });
}

// Hook prototype refresh into existing refresh path without replacing it.
const _refreshAllViews_svg_and_cy = typeof refreshAllViews === 'function' ? refreshAllViews : null;
if(_refreshAllViews_svg_and_cy){
  refreshAllViews = function(){
    _refreshAllViews_svg_and_cy();
    if(graphEngine === 'cytoscape') renderCytoscapePrototype();
  };
}

/* Cytoscape-only layout v4 overrides: readable default zoom, no chamber-card overlap, right-sized orifices/walls. */
function renderCytoscapePrototype(){
  const cyEl = ensureCyContainer();
  loadCytoscapeLocalThen(ok => {
    if(!ok){
      cyEl.innerHTML = '<div class="cyMissing"><b>Cytoscape is required for this version.</b><br/>Place reviewed local vendor file at <code>browser_files/vendor/cytoscape.min.js</code>, or use a build where <code>buildHTML.sci</code> has inlined that vendor file.</div>';
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
      wheelSensitivity: 0.45,
      minZoom: 0.06,
      maxZoom: 7,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
      autounselectify: true,
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
    buildCytoscapeChamberOverlays();
    cyPrototype.on('pan zoom resize position drag free layoutstop', scheduleCytoscapeOverlayUpdate);
    cyPrototype.ready(() => { applyAippCytoscapeLayout(false); setInitialCytoscapeViewport(); });
    scheduleCytoscapeOverlayUpdate();
    setStatus(`Cytoscape graph loaded: ${simNodes.length} nodes, ${simEdges.length} links.`, true);
  });
}
function buildCytoscapeElements(layoutPositions){
  const elements = [];
  const positions = layoutPositions || computeAippCytoscapeLayoutPositions();
  for(const n of simNodes){
    const p = positions[n.id] || { x: n.x, y: n.y };
    elements.push({ group:'nodes', data:{ id:n.id, label:n.type==='chamber'?'':n.label, type:n.type }, position:{ x:p.x, y:p.y } });
  }
  simEdges.forEach((e,i)=>elements.push({ group:'edges', data:{ id:'e'+i, source:e.a, target:e.b, type:e.type||'flow' }}));
  return { elements };
}
function computeAippCytoscapeLayoutPositions(){
  const pos = {};
  const chambers = simNodes.filter(n=>n.type==='chamber').sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
  const orifices = simNodes.filter(n=>n.type==='orifice').sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
  const walls = simNodes.filter(n=>n.type==='wall').sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
  const chamberGap = 380, chamberY = 340, chamberX0 = 190;
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
      pos[oNode.id]={ x:(a.x+b.x)/2 + centered*95, y:chamberY-170-Math.abs(centered)*36 };
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
      pos[wNode.id]={ x:anchor.x+centered*85, y:anchor.y+165+Math.abs(centered)*24 };
    });
  });
  return pos;
}
function applyAippCytoscapeLayout(animate){
  if(!cyPrototype) return;
  const positions=computeAippCytoscapeLayoutPositions();
  cyPrototype.batch(()=>{
    cyPrototype.nodes().forEach(node=>{
      const p=positions[node.id()]; if(!p) return;
      if(animate) node.animate({position:p},{duration:250,easing:'ease-out'}); else node.position(p);
    });
  });
  setTimeout(()=>scheduleCytoscapeOverlayUpdate(), animate?270:0);
}
function setInitialCytoscapeViewport(){
  if(!cyPrototype) return;
  const c1=cyPrototype.getElementById('c1');
  if(c1&&c1.length){
    cyPrototype.zoom(0.78);
    const p=c1.position(), container=cyPrototype.container();
    const w=container?container.clientWidth:900, h=container?container.clientHeight:500;
    cyPrototype.pan({ x:w*0.22-p.x*0.78, y:h*0.46-p.y*0.78 });
  } else cyPrototype.fit(cyPrototype.elements(),90);
  scheduleCytoscapeOverlayUpdate();
}
function fitCytoscapePrototype(){ if(cyPrototype){ cyPrototype.fit(cyPrototype.elements(),90); scheduleCytoscapeOverlayUpdate(); } }
function cytoscapePrototypeStyle(){
  return [
    {selector:'node',style:{'label':'data(label)','text-wrap':'wrap','text-max-width':120,'text-valign':'center','text-halign':'center','font-family':'Arial, sans-serif','font-size':12,'font-weight':800,'color':'#005495','background-color':'#ededed','border-color':'#005495','border-width':2,'width':92,'height':40,'shape':'round-rectangle','overlay-opacity':0}},
    {selector:'node[type="chamber"]',style:{'background-color':'#ffffff','border-color':'#005495','border-width':3,'width':260,'height':118,'label':''}},
    {selector:'node[type="orifice"]',style:{'background-color':'#009fe3','border-color':'#005495','border-width':2,'color':'#001669','width':92,'height':38}},
    {selector:'node[type="wall"]',style:{'shape':'diamond','background-color':'#eaf4ff','border-color':'#005495','border-width':2,'width':64,'height':64,'font-size':11}},
    {selector:'edge',style:{'width':2,'line-color':'#6b7280','target-arrow-color':'#6b7280','target-arrow-shape':'triangle','curve-style':'bezier'}},
    {selector:'edge[type="wall"]',style:{'line-color':'#8a8a8a','line-style':'dashed','target-arrow-shape':'none','width':1.8}}
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
const _refreshAllViews_base_v4 = typeof refreshAllViews === 'function' ? refreshAllViews : null;
if(_refreshAllViews_base_v4){
  refreshAllViews = function(){ renderTree(); updateCodeTextFromModel(); buildGraph(fullJson); syncOpenPopupFromModel(); renderCytoscapePrototype(); };
}


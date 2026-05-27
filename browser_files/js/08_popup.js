/* ============================================================
   Popup inspector: draggable + interactive editing (no external libs)
   ============================================================ */
function deepCopy(x){ return JSON.parse(JSON.stringify(x)); }

function openPopup(node){
  popupNode = node;
  popupOriginalCopy = deepCopy(node.data);
  popupWorkingCopy = deepCopy(node.data);

  document.getElementById("popupTitle").textContent = `${node.label} (${node.type})`;
  document.getElementById("popupInfo").textContent = "Edits update the in-memory model. Click Apply to commit.";

  renderInspector();
  document.getElementById("popup").style.display = "block";
}

function closePopup(){
  document.getElementById("popup").style.display = "none";
  popupNode = null;
  popupWorkingCopy = null;
  popupOriginalCopy = null;
}

function revertPopup(){
  if (!popupOriginalCopy) return;
  popupWorkingCopy = deepCopy(popupOriginalCopy);
  renderInspector();
  setStatus("Reverted changes.", true);
}

function applyPopup(){
  if (!popupNode) return;

  // commit edits back to node
  popupNode.data = deepCopy(popupWorkingCopy);

  // also commit back into fullJson at the correct location when possible
  commitNodeToFullJson(popupNode);

  // refresh UI
  renderTree();
  if (currentTab === "code") renderCode();
  buildGraph(fullJson);

  setStatus("Applied changes.", true);
}

function commitNodeToFullJson(node){
  // Only if structure matches expected assembly layout
  if (!fullJson) return;
  const assembly = fullJson.aipp_calculation && fullJson.aipp_calculation.assembly ? fullJson.aipp_calculation.assembly : fullJson.assembly;
  if (!assembly) return;

  if (node.type === "chamber"){
    const idx = parseInt(node.id.substring(1)) - 1;
    if (assembly.chambers && assembly.chambers[idx]) assembly.chambers[idx] = deepCopy(node.data);
  }
  if (node.type === "orifice"){
    const idx = parseInt(node.id.substring(1)) - 1;
    if (assembly.orifices && assembly.orifices[idx]) assembly.orifices[idx] = deepCopy(node.data);
  }
  if (node.type === "wall"){
    const idx = parseInt(node.id.substring(1)) - 1;
    if (assembly.walls && assembly.walls[idx]) assembly.walls[idx] = deepCopy(node.data);
  }
}

function renderInspector(){
  const root = popupWorkingCopy;
  const body = document.getElementById("popupBody");
  body.innerHTML = "";

  const tree = buildInspectorGroup("Object", root, []);
  body.appendChild(tree);
}

function buildInspectorGroup(title, obj, path){
  const group = document.createElement("div");
  group.className = "insGroup";

  const header = document.createElement("div");
  header.className = "insGroupHeader";
  header.innerHTML = `<span>${escapeHtml(title)}</span><span class="pill">${typeLabel(obj)}</span>`;
  group.appendChild(header);

  const body = document.createElement("div");
  body.className = "insGroupBody";
  group.appendChild(body);

  let open = true;
  header.addEventListener("click", ()=>{
    open = !open;
    body.style.display = open ? "block" : "none";
  });

  if (obj === null || typeof obj !== "object"){
    body.appendChild(buildPrimitiveRow("(value)", obj, path));
    return group;
  }

  if (Array.isArray(obj)){
    for (let i=0;i<obj.length;i++){
      const val = obj[i];
      const subPath = path.concat([i]);
      body.appendChild(buildAnyRow("["+i+"]", val, subPath));
    }
    return group;
  }

  const keys = Object.keys(obj);
  keys.sort();
  for (const k of keys){
    const val = obj[k];
    const subPath = path.concat([k]);
    body.appendChild(buildAnyRow(k, val, subPath));
  }

  return group;
}

function buildAnyRow(key, val, path){
  if (val !== null && typeof val === "object"){
    // nested group
    const title = key;
    return buildInspectorGroup(title, val, path);
  }
  return buildPrimitiveRow(key, val, path);
}

function buildPrimitiveRow(key, val, path){
  const row = document.createElement("div");
  row.className = "row";

  const k = document.createElement("div");
  k.className = "key";
  k.textContent = key;

  const v = document.createElement("div");
  v.className = "val";

  // choose editor by type
  const t = typeof val;

  if (t === "boolean"){
    const sel = document.createElement("select");
    sel.innerHTML = `<option value="true">true</option><option value="false">false</option>`;
    sel.value = val ? "true" : "false";
    sel.addEventListener("change", ()=>{
      setAtPath(path, sel.value === "true");
    });
    v.appendChild(sel);
  } else if (t === "number"){
    const inp = document.createElement("input");
    inp.type = "number";
    inp.step = "any";
    inp.value = String(val);
    inp.addEventListener("input", ()=>{
      const n = Number(inp.value);
      if (!Number.isNaN(n)) setAtPath(path, n);
    });
    v.appendChild(inp);
  } else if (val === null){
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = "null";
    inp.addEventListener("input", ()=>{
      // allow changing null to string/number/bool by raw text
      setAtPath(path, parseLoose(inp.value));
    });
    v.appendChild(inp);
  } else {
    // string (or unknown)
    const txt = String(val);
    if (txt.length > 80){
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.addEventListener("input", ()=> setAtPath(path, ta.value));
      v.appendChild(ta);
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = txt;
      inp.addEventListener("input", ()=> setAtPath(path, inp.value));
      v.appendChild(inp);
    }
  }

  row.appendChild(k);
  row.appendChild(v);
  return row;
}

function typeLabel(x){
  if (x === null) return "null";
  if (Array.isArray(x)) return "array";
  return typeof x;
}

function setAtPath(path, value){
  // Update popupWorkingCopy at path
  let ref = popupWorkingCopy;
  for (let i=0;i<path.length-1;i++){
    ref = ref[path[i]];
  }
  ref[path[path.length-1]] = value;
}

function parseLoose(s){
  const t = String(s).trim();
  if (t === "null") return null;
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return Number(t);
  return t;
}

/* Draggable popup */
(function enableDrag(){
  const popup = document.getElementById("popup");
  const header = document.getElementById("popupHeader");
  let dragging=false, offX=0, offY=0;

  header.addEventListener("mousedown", (e)=>{
    dragging = true;
    offX = e.clientX - popup.offsetLeft;
    offY = e.clientY - popup.offsetTop;
  });

  document.addEventListener("mousemove", (e)=>{
    if (!dragging) return;
    popup.style.left = (e.clientX - offX) + "px";
    popup.style.top  = (e.clientY - offY) + "px";
  });

  document.addEventListener("mouseup", ()=>{
    dragging=false;
  });
})();

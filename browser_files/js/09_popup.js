/* ============================================================
   Popup inspector: draggable + interactive editing
   ============================================================ */
function openPopup(node){
  popupNode = node;
  popupPath = node.path || null;

  const sourceData = popupPath ? getJsonAtPath(popupPath) : node.data;
  popupOriginalCopy = deepCopy(sourceData);
  popupWorkingCopy = deepCopy(sourceData);

  document.getElementById("popupTitle").textContent = `${node.label} (${node.type})`;
  document.getElementById("popupInfo").textContent = "Edits update the shared JSON model. Click Apply to commit.";
  renderInspector();
  document.getElementById("popup").style.display = "block";
}

function closePopup(){
  document.getElementById("popup").style.display = "none";
  popupNode = null;
  popupPath = null;
  popupWorkingCopy = null;
  popupOriginalCopy = null;
}

function revertPopup(){
  if (!popupOriginalCopy) return;
  popupWorkingCopy = deepCopy(popupOriginalCopy);
  renderInspector();
  setStatus("Reverted popup changes.", true);
}

function applyPopup(){
  if (!popupPath) return;
  setJsonAtPath(popupPath, deepCopy(popupWorkingCopy), "popup");
  setStatus("JSON updated from popup editor.", true);
}

function renderInspector(){
  const body = document.getElementById("popupBody");
  if (!body) return;
  body.innerHTML = "";
  if (popupWorkingCopy === null || popupWorkingCopy === undefined) return;
  body.appendChild(buildInspectorGroup("Object", popupWorkingCopy, []));
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
  header.addEventListener("click", () => {
    open = !open;
    body.style.display = open ? "block" : "none";
  });

  if (obj === null || typeof obj !== "object"){
    body.appendChild(buildPrimitiveRow("(value)", obj, path));
    return group;
  }

  if (Array.isArray(obj)){
    for (let i=0;i<obj.length;i++){
      body.appendChild(buildAnyRow("["+i+"]", obj[i], path.concat([i])));
    }
    return group;
  }

  const keys = Object.keys(obj).sort();
  for (const k of keys){
    body.appendChild(buildAnyRow(k, obj[k], path.concat([k])));
  }
  return group;
}

function buildAnyRow(key, val, path){
  if (val !== null && typeof val === "object"){
    return buildInspectorGroup(key, val, path);
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

  const t = typeof val;
  if (t === "boolean"){
    const sel = document.createElement("select");
    sel.innerHTML = `<option value="true">true</option><option value="false">false</option>`;
    sel.value = val ? "true" : "false";
    sel.addEventListener("change", () => setAtPath(path, sel.value === "true"));
    v.appendChild(sel);
  } else if (t === "number"){
    const inp = document.createElement("input");
    inp.type = "number";
    inp.step = "any";
    inp.value = String(val);
    inp.addEventListener("input", () => {
      const n = Number(inp.value);
      if (!Number.isNaN(n)) setAtPath(path, n);
    });
    v.appendChild(inp);
  } else if (val === null){
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = "null";
    inp.addEventListener("input", () => setAtPath(path, parseLoose(inp.value)));
    v.appendChild(inp);
  } else {
    const txt = String(val);
    if (txt.length > 80){
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.addEventListener("input", () => setAtPath(path, ta.value));
      v.appendChild(ta);
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = txt;
      inp.addEventListener("input", () => setAtPath(path, inp.value));
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
  let ref = popupWorkingCopy;
  if (path.length === 0){
    popupWorkingCopy = value;
    return;
  }
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

(function enableDrag(){
  const popup = document.getElementById("popup");
  const header = document.getElementById("popupHeader");
  if (!popup || !header) return;

  let dragging=false, offX=0, offY=0;
  header.addEventListener("mousedown", e => {
    dragging = true;
    offX = e.clientX - popup.offsetLeft;
    offY = e.clientY - popup.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    popup.style.left = (e.clientX - offX) + "px";
    popup.style.top = (e.clientY - offY) + "px";
  });
  document.addEventListener("mouseup", () => {
    dragging=false;
  });
})();

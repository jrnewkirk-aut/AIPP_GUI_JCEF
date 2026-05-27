/* ============================================================
   Tree rendering and tree editing
   ============================================================ */
function expandAll(){
  treeOpenAll = true;
  renderTree();
}

function collapseAll(){
  treeOpenAll = false;
  treeUserOpen.clear();
  renderTree();
}

function matchSearch(text){
  const box = document.getElementById("searchBox");
  const q = ((box ? box.value : "") || "").trim().toLowerCase();
  if (!q) return true;
  return String(text).toLowerCase().includes(q);
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeValue(s){
  return escapeHtml(String(s));
}

function shouldOpen(pathKey){
  if (treeOpenAll) return true;
  return treeUserOpen.has(pathKey);
}

function togglePath(pathKey, open){
  if (open) treeUserOpen.add(pathKey);
  else treeUserOpen.delete(pathKey);
}

function renderTree(){
  const pane = document.getElementById("treePane");
  if (!pane) return;

  if (!fullJson){
    pane.innerHTML = '<div class="node t">Load a JSON file to view contents.</div>';
    return;
  }

  const html = renderNode(fullJson, [], "root");
  pane.innerHTML = html || '<div class="node t">No matches.</div>';

  pane.querySelectorAll("details[data-path-key]").forEach(d => {
    d.open = shouldOpen(d.getAttribute("data-path-key"));
    d.addEventListener("toggle", () => {
      togglePath(d.getAttribute("data-path-key"), d.open);
    });
  });

  attachTreeEditHandlers();
}

function renderNode(value, path, keyName){
  const pathKey = JSON.stringify(path);
  const primitiveText = value === null ? "null" : (typeof value === "object" ? "" : value);
  const matchesSelf = matchSearch(keyName || "") || matchSearch(primitiveText);

  if (value === null || typeof value !== "object"){
    if (!matchesSelf) return "";
    return renderEditablePrimitive(keyName, value, path);
  }

  const isArr = Array.isArray(value);
  const keys = isArr ? value.map((_, i) => i) : Object.keys(value);
  let childHtml = "";

  for (const k of keys){
    const child = value[k];
    childHtml += renderNode(child, path.concat([k]), String(k));
  }

  if (!childHtml && !matchesSelf) return "";

  const labelKey = '<span class="k">' + escapeHtml(keyName !== undefined ? keyName : "root") + '</span>';
  const badge = isArr
    ? '<span class="pill">array[' + value.length + ']</span>'
    : '<span class="pill">object{' + keys.length + '}</span>';

  return `
    <details class="node" data-path-key="${escapeHtml(pathKey)}">
      <summary>
        <div class="summaryLine">
          <span class="caret"></span>
          ${labelKey} <span class="t">:</span> ${badge}
        </div>
      </summary>
      <div style="margin-left:14px;">
        ${childHtml}
      </div>
    </details>
  `;
}

function renderEditablePrimitive(keyName, value, path){
  const key = keyName !== undefined ? '<span class="k">' + escapeHtml(keyName) + '</span>: ' : "";
  const pathAttr = pathToAttr(path);
  const type = value === null ? "null" : typeof value;
  let editor = "";

  if (typeof value === "boolean"){
    editor = `<select class="treeEditSelect" data-kind="boolean" data-path="${pathAttr}">
      <option value="true" ${value ? "selected" : ""}>true</option>
      <option value="false" ${!value ? "selected" : ""}>false</option>
    </select>`;
  } else if (typeof value === "number"){
    editor = `<input class="treeEditInput" type="number" step="any" data-kind="number" data-path="${pathAttr}" value="${escapeValue(value)}" />`;
  } else if (value === null){
    editor = `<input class="treeEditInput" type="text" data-kind="null" data-path="${pathAttr}" value="null" />`;
  } else {
    const txt = String(value);
    if (txt.length > 80){
      editor = `<textarea class="treeEditTextarea" data-kind="string" data-path="${pathAttr}">${escapeHtml(txt)}</textarea>`;
    } else {
      editor = `<input class="treeEditInput" type="text" data-kind="string" data-path="${pathAttr}" value="${escapeValue(txt)}" />`;
    }
  }

  return `<div class="node treePrimitiveRow">${key}${editor}<span class="treePathHint">${escapeHtml(type)}</span></div>`;
}

function attachTreeEditHandlers(){
  document.querySelectorAll("#treePane [data-path]").forEach(el => {
    el.addEventListener("change", () => {
      const path = attrToPath(el.getAttribute("data-path"));
      const kind = el.getAttribute("data-kind");
      const value = parseTreeEditorValue(el.value, kind);
      setJsonAtPath(path, value, "tree");
      setStatus("JSON updated from tree editor.", true);
    });
  });
}

function parseTreeEditorValue(raw, kind){
  if (kind === "boolean") return raw === "true";
  if (kind === "number"){
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }
  if (kind === "null") return parseLoose(raw);
  return raw;
}

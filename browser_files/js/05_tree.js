/* ============================================================
   Tree rendering (collapsible + search)
   ============================================================ */
function expandAll(){ treeOpenAll = true; renderTree(); }
function collapseAll(){ treeOpenAll = false; treeUserOpen.clear(); renderTree(); }

function matchSearch(text){
  const q = (document.getElementById("searchBox").value || "").trim().toLowerCase();
  if (!q) return true;
  return String(text).toLowerCase().includes(q);
}

function isObject(x){ return x && typeof x === "object" && !Array.isArray(x); }

function fmtValue(v){
  if (v === null) return '<span class="v-null">null</span>';
  if (typeof v === "string") return '<span class="v-string">"' + escapeHtml(v) + '"</span>';
  if (typeof v === "number") return '<span class="v-number">' + v + '</span>';
  if (typeof v === "boolean") return '<span class="v-bool">' + v + '</span>';
  return '<span class="t">' + escapeHtml(String(v)) + '</span>';
}

function escapeHtml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function shouldOpen(path){
  if (treeOpenAll) return true;
  return treeUserOpen.has(path);
}

function togglePath(path, open){
  if (open) treeUserOpen.add(path);
  else treeUserOpen.delete(path);
}

function renderTree(){
  const pane = document.getElementById("treePane");
  if (!fullJson){
    pane.innerHTML = '<div class="node t">Load a JSON file to view contents.</div>';
    return;
  }
  const html = renderNode(fullJson, "root", 0);
  pane.innerHTML = html || '<div class="node t">No matches.</div>';

  // attach listeners to details toggles
  pane.querySelectorAll("details[data-path]").forEach(d=>{
    d.addEventListener("toggle", ()=>{
      togglePath(d.getAttribute("data-path"), d.open);
    });
    d.open = shouldOpen(d.getAttribute("data-path"));
  });
}

function renderNode(value, path, depth, keyName){
  // Search: include node if it matches itself or any child matches
  const matchesSelf = matchSearch(keyName || "") || matchSearch(value === null ? "null" : (typeof value === "object" ? "" : value));

  // Primitive
  if (value === null || typeof value !== "object"){
    if (!matchesSelf) return "";
    const k = keyName !== undefined ? '<span class="k">' + escapeHtml(keyName) + '</span>: ' : "";
    return '<div class="node">' + k + fmtValue(value) + '</div>';
  }

  // Arrays / Objects
  const isArr = Array.isArray(value);
  const keys = isArr ? value.map((_,i)=>String(i)) : Object.keys(value);

  let childHtml = "";
  for (const k of keys){
    const child = isArr ? value[Number(k)] : value[k];
    const p = path + "." + k;
    childHtml += renderNode(child, p, depth+1, k);
  }

  // If no child matches and self doesn't match, hide
  if (!childHtml && !matchesSelf) return "";

  const labelKey = (keyName !== undefined) ? ('<span class="k">' + escapeHtml(keyName) + '</span>') : '<span class="k">root</span>';
  const badge = isArr ? ('<span class="pill">array[' + value.length + ']</span>') : ('<span class="pill">object{' + keys.length + '}</span>');

  return `
    <details class="node" data-path="${escapeHtml(path)}">
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

/* ============================================================
   Code view with simple syntax highlighting
   ============================================================ */
function renderCode(){
  if (!fullJson){
    document.getElementById("codePre").textContent = "";
    return;
  }
  const raw = JSON.stringify(fullJson, null, 2);
  document.getElementById("codePre").innerHTML = highlightJson(raw);
}

function highlightJson(s){
  // Escape HTML first
  let t = escapeHtml(s);

  // Highlight keys: "key":
  t = t.replace(/&quot;([^&]|&amp;|&lt;|&gt;)*?&quot;(?=\s*:)/g, (m)=>'<span class="hl-k">'+m+'</span>');

  // Highlight strings (remaining quoted)
  t = t.replace(/&quot;([^&]|&amp;|&lt;|&gt;)*?&quot;/g, (m)=>'<span class="hl-s">'+m+'</span>');

  // Highlight numbers
  t = t.replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, (m)=>'<span class="hl-n">'+m+'</span>');

  // Highlight booleans/null
  t = t.replace(/\b(true|false|null)\b/g, (m)=>'<span class="hl-b">'+m+'</span>');

  return t;
}

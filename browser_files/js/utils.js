function setStatus(msg, ok){
  document.getElementById("statusLeft").textContent = msg;
  const r = document.getElementById("statusRight");
  r.textContent = ok ? "OK" : "ERROR";
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
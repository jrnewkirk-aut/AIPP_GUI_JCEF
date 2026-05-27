/* ============================================================
   Status
   ============================================================ */
function setStatus(msg, ok){
  document.getElementById("statusLeft").textContent = msg;
  const r = document.getElementById("statusRight");
  r.textContent = ok ? "OK" : "ERROR";
  r.className = ok ? "ok" : "bad";
}

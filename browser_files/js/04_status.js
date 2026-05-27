/* ============================================================
   Status
   ============================================================ */
function setStatus(msg, ok){
  const left = document.getElementById("statusLeft");
  const right = document.getElementById("statusRight");
  if (!left || !right) return;

  left.textContent = msg;
  right.textContent = ok ? "OK" : "ERROR";
  right.className = ok ? "ok" : "bad";
}

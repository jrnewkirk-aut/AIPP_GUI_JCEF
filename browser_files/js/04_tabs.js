/* ============================================================
   Tabs
   ============================================================ */
function setTab(tab){
  currentTab = tab;
  document.getElementById("tabTree").classList.toggle("active", tab==="tree");
  document.getElementById("tabCode").classList.toggle("active", tab==="code");
  document.getElementById("treePane").style.display = (tab==="tree") ? "block" : "none";
  document.getElementById("codePane").style.display = (tab==="code") ? "block" : "none";
  if (tab === "code") renderCode();
}

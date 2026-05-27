/* ============================================================
   Browser init notify
   ============================================================ */
window.onload = function(){
  // Initial empty panes
  renderTree();
  renderCode();
  setStatus("Ready. Click Open JSON File.", true);

  // Notify Scilab
  window.toScilab("loaded");
};

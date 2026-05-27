/* ============================================================
   Browser init notify
   ============================================================ */
window.onload = function(){
  renderTree();
  updateCodeTextFromModel();
  attachCodeEditorHandlers();
  setStatus("Ready. Click Open JSON File.", true);
  window.toScilab("loaded");
};

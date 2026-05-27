function expandAll(){ state.treeOpenAll = true; renderTree(); }
function collapseAll(){ state.treeOpenAll = false; state.treeUserOpen.clear(); renderTree(); }

function renderTree(){
  const pane = document.getElementById("treePane");

  if (!state.fullJson){
    pane.innerHTML = "Load a JSON file";
    return;
  }

  pane.innerHTML = `<pre>${JSON.stringify(state.fullJson, null, 2)}</pre>`;
}
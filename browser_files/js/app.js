window.onload = function(){

  document.getElementById("openBtn").onclick = selectFile;
  document.getElementById("expandBtn").onclick = expandAll;
  document.getElementById("collapseBtn").onclick = collapseAll;

  document.getElementById("searchBox").oninput = renderTree;

  if (window.toScilab){
    window.toScilab("loaded");
  }
};

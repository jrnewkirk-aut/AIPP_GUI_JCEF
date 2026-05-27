/* ============================================================
   Model synchronization layer
   One source of truth: fullJson
   ============================================================ */
function deepCopy(x){
  return JSON.parse(JSON.stringify(x));
}

function pathToAttr(path){
  return escapeHtml(JSON.stringify(path));
}

function attrToPath(s){
  return JSON.parse(s);
}

function getJsonAtPath(path){
  let ref = fullJson;
  for (const key of path){
    if (ref === null || ref === undefined) return undefined;
    ref = ref[key];
  }
  return ref;
}

function setJsonAtPath(path, value, source){
  if (!fullJson) return;
  if (!Array.isArray(path)) return;

  if (path.length === 0){
    fullJson = value;
  } else {
    let ref = fullJson;
    for (let i=0;i<path.length-1;i++){
      ref = ref[path[i]];
    }
    ref[path[path.length-1]] = value;
  }

  jsonDirty = true;
  refreshAllViews(source || "edit");
}

function replaceFullJson(newJson, source){
  fullJson = newJson;
  jsonDirty = source !== "load";
  refreshAllViews(source || "replace");
}

function refreshAllViews(source){
  // Every committed edit method writes to fullJson first, then all views
  // are regenerated from fullJson so tree/code/popup/graph cannot drift.
  renderTree();
  updateCodeTextFromModel();

  if (fullJson){
    buildGraph(fullJson);
  } else {
    clearSvg();
  }

  syncOpenPopupFromModel();
}

function getAssemblyInfo(parsed){
  if (parsed && parsed.aipp_calculation && parsed.aipp_calculation.assembly){
    return {
      assembly: parsed.aipp_calculation.assembly,
      basePath: ["aipp_calculation", "assembly"]
    };
  }

  if (parsed && parsed.assembly){
    return {
      assembly: parsed.assembly,
      basePath: ["assembly"]
    };
  }

  return {
    assembly: null,
    basePath: []
  };
}

function syncOpenPopupFromModel(){
  if (!popupPath) return;
  const popup = document.getElementById("popup");
  if (!popup || popup.style.display === "none") return;

  const current = getJsonAtPath(popupPath);
  if (current === undefined) return;

  popupWorkingCopy = deepCopy(current);
  popupOriginalCopy = deepCopy(current);
  renderInspector();
}

function renderCode(){
  const el = document.getElementById("codePre");

  if (!state.fullJson){
    el.textContent = "";
    return;
  }

  el.textContent = JSON.stringify(state.fullJson, null, 2);
}
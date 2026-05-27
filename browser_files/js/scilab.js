function toScilabMsg(obj){
  const s = JSON.stringify(obj).replaceAll('"','<-quote->');
  window.toScilab(s);
}

function selectFile(){
  toScilabMsg({type:"select_file"});
}

function asciiToString(arr){
  return arr.map(c => String.fromCharCode(c)).join('');
}

function fromScilab(msg){
  try{
    const outer = JSON.parse(msg.replaceAll("<-quote->", '"'));
    if (!outer || outer.type !== "json_ascii") return;

    const jsonText = asciiToString(outer.data);
    const parsed = JSON.parse(jsonText);

    state.fullJson = parsed;

    renderTree();
    renderCode();
    buildGraph(parsed);

    setStatus("JSON loaded successfully.", true);

  } catch(e){
    setStatus("Failed to parse JSON", false);
  }
}
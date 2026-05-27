/* ============================================================
   fromScilab handler
   ============================================================ */
function fromScilab(msg){
  try{
    const outer = JSON.parse(msg);
    if (!outer || outer.type !== "json_ascii") return;

    const jsonText = asciiToString(outer.data);
    const parsed = JSON.parse(jsonText);

    fullJson = parsed;

    // render UI
    renderTree();
    renderCode(); // keep code ready
    buildGraph(fullJson);

    setStatus("JSON loaded successfully.", true);
  } catch(e){
    setStatus("Failed to parse JSON: " + e.message, false);
  }
}

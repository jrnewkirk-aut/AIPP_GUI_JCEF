/* ============================================================
   fromScilab handler
   ============================================================ */
function fromScilab(msg){
  try{
    const outer = JSON.parse(msg);

    if (!outer || !outer.type){
      setStatus("Message from Scilab missing type.", false);
      return;
    }

    if (outer.type === "json_ascii"){
      const jsonText = asciiToString(outer.data);
      const parsed = JSON.parse(jsonText);
      replaceFullJson(parsed, "load");
      setStatus("JSON loaded successfully.", true);
      return;
    }

    setStatus("Unknown message type from Scilab: " + outer.type, false);
  } catch(e){
    setStatus("Failed to parse JSON from Scilab: " + e.message, false);
  }
}

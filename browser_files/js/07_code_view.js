/* ============================================================
   Editable code view
   ============================================================ */
function updateCodeTextFromModel(){
  const editor = document.getElementById("codeEditor");
  const err = document.getElementById("codeError");
  if (!editor) return;

  if (!fullJson){
    editor.value = "";
    lastValidCodeText = "";
    codeEditorDirty = false;
    if (err) err.textContent = "";
    return;
  }

  const raw = JSON.stringify(fullJson, null, 2);
  editor.value = raw;
  lastValidCodeText = raw;
  codeEditorDirty = false;
  if (err) err.textContent = "";
}

function renderCode(){
  updateCodeTextFromModel();
}

function applyCodeEdits(){
  const editor = document.getElementById("codeEditor");
  const err = document.getElementById("codeError");
  if (!editor) return;

  try{
    const parsed = JSON.parse(editor.value);
    if (err) err.textContent = "";
    codeEditorDirty = false;
    replaceFullJson(parsed, "code");
    setStatus("JSON updated from code editor.", true);
  } catch(e){
    if (err) err.textContent = "Invalid JSON: " + e.message;
    setStatus("Invalid JSON in code editor: " + e.message, false);
  }
}

function resetCodeEditor(){
  updateCodeTextFromModel();
  setStatus("Code editor reset to current model.", true);
}

function attachCodeEditorHandlers(){
  const editor = document.getElementById("codeEditor");
  const err = document.getElementById("codeError");
  if (!editor) return;

  editor.addEventListener("input", () => {
    codeEditorDirty = true;
    if (err) err.textContent = "Unapplied changes";
    setStatus("Code editor has unapplied changes. Click Apply JSON to update the model.", true);
  });
}

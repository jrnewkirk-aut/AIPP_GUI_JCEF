/* 13_save_json_to_local_file_v1.js
   Temporary save-to-local-file patch.
   Load after current GUI patches.

   Browser role:
   - Add a Save JSON button to the toolbar.
   - Serialize the current in-memory JSON using the existing pretty stringifier when available.
   - Send the JSON text to Scilab as an ASCII array inside a JSON message.

   Scilab role:
   - Receive type="save_json_ascii".
   - Convert ASCII back to text.
   - Prompt with uiputfile(), starting in the same directory as the JSON file that was opened.
   - Write the selected file.
   - Return save_json_success or save_json_error to the browser.
*/
(function(){
  if(window.__aippSaveJsonLocalFileV1Applied) return;
  window.__aippSaveJsonLocalFileV1Applied = true;

  function stringToAsciiArray(s){
    s = String(s == null ? '' : s);
    var out = [];
    for(var i=0;i<s.length;i++) out.push(s.charCodeAt(i));
    return out;
  }

  function saveJsonToLocalFile(){
    try{
      if(typeof fullJson === 'undefined' || !fullJson){
        setStatus('No JSON model is loaded to save.', false);
        return;
      }
      if(typeof applyPopup === 'function'){
        // Do not automatically apply popup edits here because applyPopup closes over the active popup
        // workflow and may surprise the user. The save operation writes the current in-memory model.
      }
      var jsonText = (typeof stringifyAippJsonPretty === 'function') ? stringifyAippJsonPretty(fullJson) : JSON.stringify(fullJson, null, 2);
      if(typeof aippSendSaveJsonRequest === 'function'){
        aippSendSaveJsonRequest(jsonText, 'aipp_input_updated.json');
      }else{
        var msg = {
          type: 'save_json_ascii',
          data: stringToAsciiArray(jsonText),
          suggested_name: 'aipp_input_updated.json'
        };
        toScilabAsciiMsg(msg);
      }
      setStatus('Save requested. Choose output file in Scilab dialog.', true);
    }catch(e){
      setStatus('Save request failed: '+e.message, false);
    }
  }

  function ensureSaveButton(){
    var toolbar = document.getElementById('toolbar');
    if(!toolbar || document.getElementById('saveJsonBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'saveJsonBtn';
    btn.className = 'btn secondary';
    btn.textContent = 'Save JSON';
    btn.onclick = saveJsonToLocalFile;

    // Place Save JSON immediately after Open JSON File when possible.
    var buttons = toolbar.querySelectorAll('button');
    if(buttons && buttons.length) buttons[0].insertAdjacentElement('afterend', btn);
    else toolbar.insertBefore(btn, toolbar.firstChild);
  }

  var originalFromScilab = window.fromScilab;
  window.fromScilab = function(msg){
    try{
      var o = (typeof msg === 'string') ? JSON.parse(msg) : msg;
      if(o && o.type === 'save_json_success'){
        setStatus('Saved JSON: '+(o.path || o.file || 'selected file'), true);
        return;
      }
      if(o && o.type === 'save_json_error'){
        setStatus('Save JSON failed: '+(o.message || 'unknown error'), false);
        if(window.alert) window.alert('Save JSON failed: '+(o.message || 'unknown error'));
        return;
      }
      if(o && o.type === 'save_json_cancelled'){
        setStatus('Save JSON cancelled.', true);
        return;
      }
    }catch(e){
      // Fall through to original handler; some existing messages may not be plain JSON strings.
    }
    if(typeof originalFromScilab === 'function') return originalFromScilab(msg);
  };

  window.saveJsonToLocalFile = saveJsonToLocalFile;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureSaveButton);
  else ensureSaveButton();
  setTimeout(ensureSaveButton, 0);
})();
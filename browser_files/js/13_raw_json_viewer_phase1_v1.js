/* 13_raw_json_viewer_phase1_v1.js
   Phase 1 RAW JSON viewer/editor polish.
   Load after the current working bundle modules, preferably after 12_save_json_local.js.

   Implements Phase 1 from RAW_JSON_Viewer_Controls.md:
   - Rename left-pane Code tab to RAW JSON.
   - Keep existing editable textarea workflow.
   - Add RAW JSON-local search box in the JSON editor toolbar.
   - Add an Undo button label inside the RAW JSON toolbar by reusing the existing Reset behavior.
   - Prevent accidental Apply while the textarea is showing a filtered search view.
*/
(function(){
  if(window.__aippRawJsonViewerPhase1V1Applied) return;
  window.__aippRawJsonViewerPhase1V1Applied = true;

  var rawJsonSearchActive = false;
  var rawJsonUnfilteredText = '';

  function injectRawJsonCss(){
    if(document.getElementById('aippRawJsonPhase1Css')) return;
    var style = document.createElement('style');
    style.id = 'aippRawJsonPhase1Css';
    style.textContent = [
      '#tabCode{min-width:78px;text-align:center;}',
      '#rawJsonSearchWrap{display:flex;align-items:center;gap:6px;margin-right:8px;}',
      '#rawJsonSearchWrap span{font-size:12px;color:var(--muted);font-weight:700;white-space:nowrap;}',
      '#rawJsonSearchBox{height:28px;width:230px;padding:0 8px;border:1px solid var(--line);border-radius:4px;font-size:12px;}',
      '#rawJsonSearchBox.active{border-color:#005495;background:#f7fbff;}',
      '#rawJsonClearSearchBtn{padding:5px 7px;font-size:11px;}',
      '#rawJsonSearchInfo{font-size:11px;color:var(--muted);margin-left:4px;}',
      '#codeEditor.rawJsonFiltered{background:#172232;color:#e6edf3;}',
      '#codeEditor.rawJsonFiltered::selection{background:#005495;color:#fff;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getEditor(){ return document.getElementById('codeEditor'); }
  function getError(){ return document.getElementById('codeError'); }
  function getSearch(){ return document.getElementById('rawJsonSearchBox'); }

  function renameCodeTab(){
    var tab = document.getElementById('tabCode');
    if(tab) tab.textContent = 'RAW JSON';
  }

  function ensureRawJsonToolbar(){
    injectRawJsonCss();
    renameCodeTab();
    var toolbar = document.getElementById('codeToolbar');
    if(!toolbar || document.getElementById('rawJsonSearchBox')) return;

    // Rename the existing buttons to match the RAW JSON terminology.
    var buttons = toolbar.querySelectorAll('button');
    if(buttons && buttons.length){
      if(buttons[0]) buttons[0].textContent = 'Apply JSON';
      if(buttons[1]) buttons[1].textContent = 'Undo';
    }

    var wrap = document.createElement('div');
    wrap.id = 'rawJsonSearchWrap';
    var label = document.createElement('span');
    label.textContent = 'Search RAW JSON:';
    var input = document.createElement('input');
    input.id = 'rawJsonSearchBox';
    input.placeholder = 'key / value / path...';
    input.oninput = applyRawJsonSearchFilter;
    var clear = document.createElement('button');
    clear.id = 'rawJsonClearSearchBtn';
    clear.className = 'smallBtn secondary';
    clear.textContent = 'Clear';
    clear.onclick = clearRawJsonSearch;
    var info = document.createElement('span');
    info.id = 'rawJsonSearchInfo';
    info.textContent = '';
    wrap.append(label,input,clear,info);
    toolbar.insertBefore(wrap, toolbar.firstChild);
  }

  function setSearchInfo(text, isError){
    var info = document.getElementById('rawJsonSearchInfo');
    if(info){ info.textContent = text || ''; info.className = isError ? 'bad' : 'muted'; }
    var err = getError();
    if(err && text) err.textContent = text;
  }

  function currentFullTextForSearch(){
    var ed = getEditor();
    if(!ed) return '';
    if(rawJsonSearchActive) return rawJsonUnfilteredText;
    return ed.value || '';
  }

  function applyRawJsonSearchFilter(){
    var ed = getEditor(), search = getSearch();
    if(!ed || !search) return;
    var q = String(search.value || '').toLowerCase().trim();
    if(!q){ clearRawJsonSearch(); return; }

    if(!rawJsonSearchActive){
      rawJsonUnfilteredText = ed.value || '';
      rawJsonSearchActive = true;
    }

    var lines = rawJsonUnfilteredText.split(/\r?\n/);
    var matches = lines.filter(function(line){ return line.toLowerCase().indexOf(q) >= 0; });
    ed.value = matches.join('\n');
    ed.readOnly = true;
    ed.classList.add('rawJsonFiltered');
    search.classList.add('active');
    setSearchInfo('Filtered: '+matches.length+' / '+lines.length+' lines. Clear search to edit or apply.', false);
  }

  function clearRawJsonSearch(){
    var ed = getEditor(), search = getSearch();
    if(!ed) return;
    if(rawJsonSearchActive){
      ed.value = rawJsonUnfilteredText;
    }
    rawJsonSearchActive = false;
    rawJsonUnfilteredText = '';
    ed.readOnly = false;
    ed.classList.remove('rawJsonFiltered');
    if(search){ search.value = ''; search.classList.remove('active'); }
    var info = document.getElementById('rawJsonSearchInfo');
    if(info) info.textContent = '';
    var err = getError();
    if(err) err.textContent = '';
  }

  var originalUpdateCodeTextFromModel = window.updateCodeTextFromModel;
  window.updateCodeTextFromModel = function(){
    clearRawJsonSearch();
    if(typeof originalUpdateCodeTextFromModel === 'function') originalUpdateCodeTextFromModel();
    renameCodeTab();
    ensureRawJsonToolbar();
  };

  var originalApplyCodeEdits = window.applyCodeEdits;
  window.applyCodeEdits = function(){
    if(rawJsonSearchActive){
      setStatus('Clear RAW JSON search before applying. The editor is currently showing filtered lines only.', false);
      setSearchInfo('Clear search before applying JSON.', true);
      return;
    }
    if(typeof originalApplyCodeEdits === 'function') return originalApplyCodeEdits();
  };

  var originalResetCodeEditor = window.resetCodeEditor;
  window.resetCodeEditor = function(){
    clearRawJsonSearch();
    if(typeof originalResetCodeEditor === 'function') return originalResetCodeEditor();
  };

  var originalSetTab = window.setTab;
  window.setTab = function(t){
    var out = (typeof originalSetTab === 'function') ? originalSetTab(t) : undefined;
    renameCodeTab();
    ensureRawJsonToolbar();
    return out;
  };

  // Expose for debugging and future structured editor work.
  window.clearRawJsonSearch = clearRawJsonSearch;
  window.applyRawJsonSearchFilter = applyRawJsonSearchFilter;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ renameCodeTab(); ensureRawJsonToolbar(); });
  }else{
    renameCodeTab();
    ensureRawJsonToolbar();
  }
  setTimeout(function(){ renameCodeTab(); ensureRawJsonToolbar(); }, 0);
})();

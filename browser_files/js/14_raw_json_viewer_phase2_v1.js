/* 14_raw_json_viewer_phase2_v1.js
   Phase 2 RAW JSON structured viewer/editor.
   Load after 13_raw_json_viewer_phase1_v1.js.

   Implements Phase 2 from RAW_JSON_Viewer_Controls.md:
   - Structured RAW JSON mode with expandable/collapsible JSON chunks.
   - Expand All / Collapse All controls inside the RAW JSON pane.
   - Syntax/hierarchy coloring for keys, strings, numbers, booleans, null, arrays, and objects.
   - Intelligent array-object labels such as Chamber 1, Orifice 2, Wall 3, Pyro 1, Filter 1.
   - Inline editing of primitive values through a working copy.
   - Text mode remains available for full raw JSON paste/edit workflows.
*/
(function(){
  if(window.__aippRawJsonViewerPhase2V1Applied) return;
  window.__aippRawJsonViewerPhase2V1Applied = true;

  var rawJsonMode = 'structured';
  var rawJsonWorkingCopy = null;
  var rawJsonCollapsed = {};
  var rawJsonLastAppliedSnapshot = null;
  var rawJsonRenderScheduled = false;

  function deepClone(x){ return JSON.parse(JSON.stringify(x)); }
  function pathKey(path){ return path.length ? path.join('.') : '$'; }
  function pathText(path){
    if(!path || !path.length) return '$';
    return '$.' + path.map(function(x){ return typeof x === 'number' ? '['+x+']' : String(x); }).join('.').replace(/\.\[/g,'[');
  }
  function html(s){ return escapeHtml(String(s == null ? '' : s)); }
  function valuePreview(v){
    if(v === null) return 'null';
    if(typeof v === 'string') return '"'+v+'"';
    if(typeof v === 'number' || typeof v === 'boolean') return String(v);
    if(Array.isArray(v)) return '[array: '+v.length+']';
    if(typeof v === 'object') return '{object: '+Object.keys(v).length+'}';
    return String(v);
  }
  function getAtPath(root,path){
    var r=root;
    for(var i=0;i<path.length;i++){ if(r == null) return undefined; r=r[path[i]]; }
    return r;
  }
  function setAtPath(root,path,value){
    if(!path.length) return value;
    var r=root;
    for(var i=0;i<path.length-1;i++) r=r[path[i]];
    r[path[path.length-1]]=value;
    return root;
  }
  function parsePrimitiveByOriginal(text, original){
    var s=String(text);
    if(original === null){
      if(s.trim()==='null') return null;
      try{return JSON.parse(s);}catch(e){return s;}
    }
    if(typeof original === 'number'){
      var n=Number(s);
      if(!Number.isFinite(n)) throw new Error('Number expected');
      return n;
    }
    if(typeof original === 'boolean'){
      var t=s.trim().toLowerCase();
      if(t==='true') return true;
      if(t==='false') return false;
      throw new Error('Boolean expected: true or false');
    }
    return s;
  }
  function inferArrayItemLabel(path, obj){
    if(!path.length || typeof path[path.length-1] !== 'number') return '';
    var idx=path[path.length-1]+1;
    var parentKey='';
    for(var i=path.length-2;i>=0;i--){ if(typeof path[i] === 'string'){ parentKey=path[i]; break; } }
    var type='Item';
    if(parentKey==='chambers') type='Chamber';
    else if(parentKey==='orifices') type='Orifice';
    else if(parentKey==='walls') type='Wall';
    else if(parentKey==='pyro' || parentKey==='pyros') type='Pyro';
    else if(parentKey==='filter' || parentKey==='filters') type='Filter';
    var label = obj && typeof obj==='object' && !Array.isArray(obj) && obj.label ? String(obj.label) : '';
    return type+' '+idx+(label ? '  —  '+label : '');
  }
  function typeClass(v){
    if(v===null) return 'null';
    if(Array.isArray(v)) return 'array';
    return typeof v;
  }
  function ensureRawJsonPhase2Css(){
    if(document.getElementById('aippRawJsonPhase2Css')) return;
    var style=document.createElement('style');
    style.id='aippRawJsonPhase2Css';
    style.textContent=[
      '#rawJsonStructuredPane{flex:1;overflow:auto;background:#101923;color:#d9e6f2;font-family:Consolas,monospace;font-size:12px;padding:8px;box-sizing:border-box;}',
      '.rawJsonToolbarGroup{display:flex;align-items:center;gap:6px;margin-left:4px;}',
      '.rawJsonModeSelect{height:28px;border:1px solid var(--line);border-radius:4px;font-size:12px;background:#fff;color:#005495;font-weight:700;}',
      '.rawJsonStructRow{display:flex;align-items:center;gap:4px;min-height:22px;border-left:3px solid transparent;padding:1px 4px;white-space:nowrap;}',
      '.rawJsonStructRow.depth0{border-left-color:#005495}.rawJsonStructRow.depth1{border-left-color:#009fe3}.rawJsonStructRow.depth2{border-left-color:#147a1e}.rawJsonStructRow.depth3{border-left-color:#b36b00}.rawJsonStructRow.depth4{border-left-color:#7a2ab8}',
      '.rawJsonStructRow:hover{background:#17283a;}',
      '.rawJsonToggle{width:18px;height:18px;border:0;background:transparent;color:#9dd7ff;cursor:pointer;font-weight:900;padding:0;}',
      '.rawJsonIndent{display:inline-block;width:18px;flex:0 0 auto;}',
      '.rawJsonKey{color:#9dd7ff;font-weight:800;}',
      '.rawJsonPunct{color:#8a9bad;}',
      '.rawJsonTypeBadge{font-size:10px;color:#b8c7d6;border:1px solid #32475c;border-radius:999px;padding:1px 5px;background:#142333;}',
      '.rawJsonArrayLabel{color:#8a9bad;font-style:italic;margin-left:6px;}',
      '.rawJsonValueInput{font-family:Consolas,monospace;font-size:12px;background:#0f1720;color:#e6edf3;border:1px solid #32475c;border-radius:3px;padding:2px 5px;min-width:120px;}',
      '.rawJsonValueInput.string{color:#b6f5b6}.rawJsonValueInput.number{color:#ffd28a}.rawJsonValueInput.boolean{color:#ffb6d9}.rawJsonValueInput.null{color:#b8c7d6}',
      '.rawJsonInvalid{border-color:#c80000!important;background:#341c1c!important;}',
      '.rawJsonHidden{display:none!important;}',
      '.rawJsonSearchMatch{background:#273d15!important;}',
      '.rawJsonSearchContext{opacity:.82;}',
      '#rawJsonStructuredStatus{font-size:11px;color:#b8c7d6;padding:4px 6px;border-bottom:1px solid #25384d;margin-bottom:4px;}',
      '#codeEditor.rawJsonTextHidden{display:none!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureWorkingCopy(){
    if(!rawJsonWorkingCopy && typeof fullJson !== 'undefined' && fullJson) rawJsonWorkingCopy = deepClone(fullJson);
  }
  function getStructuredPane(){ return document.getElementById('rawJsonStructuredPane'); }
  function getEditor(){ return document.getElementById('codeEditor'); }
  function getSearch(){ return document.getElementById('rawJsonSearchBox'); }

  function ensurePhase2Toolbar(){
    ensureRawJsonPhase2Css();
    var toolbar=document.getElementById('codeToolbar');
    if(!toolbar) return;
    if(!document.getElementById('rawJsonModeSelect')){
      var group=document.createElement('div');
      group.className='rawJsonToolbarGroup';
      var mode=document.createElement('select');
      mode.id='rawJsonModeSelect';
      mode.className='rawJsonModeSelect';
      mode.innerHTML='<option value="structured">Structured</option><option value="text">Text</option>';
      mode.value=rawJsonMode;
      mode.onchange=function(){ setRawJsonMode(mode.value); };
      var expand=document.createElement('button');
      expand.className='smallBtn secondary';
      expand.textContent='Expand All';
      expand.onclick=function(){ rawJsonCollapsed={}; renderStructuredRawJson(); };
      var collapse=document.createElement('button');
      collapse.className='smallBtn secondary';
      collapse.textContent='Collapse All';
      collapse.onclick=function(){ collapseAllStructured(); renderStructuredRawJson(); };
      group.append(mode,expand,collapse);
      var err=document.getElementById('codeError');
      toolbar.insertBefore(group, err || null);
    }
    var search=getSearch();
    if(search) search.oninput=function(){ if(rawJsonMode==='structured') renderStructuredRawJson(); else if(window.applyRawJsonSearchFilter) window.applyRawJsonSearchFilter(); };
  }

  function ensureStructuredPane(){
    ensureRawJsonPhase2Css();
    var codePane=document.getElementById('codePane');
    var editor=getEditor();
    if(!codePane || !editor) return null;
    var pane=getStructuredPane();
    if(!pane){
      pane=document.createElement('div');
      pane.id='rawJsonStructuredPane';
      editor.parentNode.insertBefore(pane, editor.nextSibling);
    }
    return pane;
  }

  function setRawJsonMode(mode){
    rawJsonMode = mode === 'text' ? 'text' : 'structured';
    var sel=document.getElementById('rawJsonModeSelect');
    if(sel) sel.value=rawJsonMode;
    var ed=getEditor(), pane=ensureStructuredPane();
    if(rawJsonMode==='structured'){
      if(window.clearRawJsonSearch) window.clearRawJsonSearch();
      if(ed) ed.classList.add('rawJsonTextHidden');
      if(pane) pane.style.display='block';
      ensureWorkingCopy();
      renderStructuredRawJson();
    }else{
      if(pane) pane.style.display='none';
      if(ed) ed.classList.remove('rawJsonTextHidden');
      if(typeof updateCodeTextFromModel === 'function'){
        // Avoid recursion by manually syncing text from working copy/current model.
        ed.value = rawJsonWorkingCopy ? stringifyAippJsonPretty(rawJsonWorkingCopy) : (fullJson ? stringifyAippJsonPretty(fullJson) : '');
      }
    }
  }

  function collapseAllStructured(){
    ensureWorkingCopy();
    rawJsonCollapsed={};
    function walk(v,path){
      if(v && typeof v==='object'){
        rawJsonCollapsed[pathKey(path)] = path.length > 0;
        if(Array.isArray(v)) v.forEach(function(x,i){ walk(x,path.concat([i])); });
        else Object.keys(v).forEach(function(k){ walk(v[k],path.concat([k])); });
      }
    }
    walk(rawJsonWorkingCopy,[]);
  }

  function rowMatchesSearch(rowText, query){ return !query || rowText.toLowerCase().indexOf(query) >= 0; }
  function descendantMatches(v,path,query){
    if(!query) return true;
    var own=(pathText(path)+' '+valuePreview(v)+' '+(typeof path[path.length-1] !== 'undefined' ? path[path.length-1] : 'root')).toLowerCase();
    if(own.indexOf(query)>=0) return true;
    if(v && typeof v==='object'){
      if(Array.isArray(v)) return v.some(function(x,i){ return descendantMatches(x,path.concat([i]),query); });
      return Object.keys(v).some(function(k){ return descendantMatches(v[k],path.concat([k]),query); });
    }
    return false;
  }

  function renderStructuredRawJson(){
    if(rawJsonRenderScheduled) return;
    rawJsonRenderScheduled = true;
    requestAnimationFrame(function(){ rawJsonRenderScheduled=false; renderStructuredRawJsonNow(); });
  }

  function renderStructuredRawJsonNow(){
    ensureWorkingCopy();
    var pane=ensureStructuredPane();
    if(!pane) return;
    if(!rawJsonWorkingCopy){ pane.innerHTML='<div id="rawJsonStructuredStatus">Load a JSON file to view RAW JSON.</div>'; return; }
    pane.innerHTML='';
    var q=(getSearch() ? String(getSearch().value||'').toLowerCase().trim() : '');
    var status=document.createElement('div');
    status.id='rawJsonStructuredStatus';
    status.textContent=q ? 'Structured RAW JSON filtered by: '+q+'  (matching rows and parent context shown)' : 'Structured RAW JSON editor. Primitive values are editable; switch to Text mode for full structural edits.';
    pane.appendChild(status);
    renderNode(rawJsonWorkingCopy, [], 'root', pane, 0, q);
  }

  function renderNode(v,path,key,parent,depth,query){
    var isObj=v && typeof v==='object';
    var ownText=pathText(path)+' '+String(key)+' '+valuePreview(v)+' '+inferArrayItemLabel(path,v);
    var hasMatch=descendantMatches(v,path,query);
    if(query && !hasMatch) return;
    var row=document.createElement('div');
    row.className='rawJsonStructRow depth'+(depth%5)+(query && rowMatchesSearch(ownText,query) ? ' rawJsonSearchMatch' : (query ? ' rawJsonSearchContext' : ''));
    row.style.paddingLeft=(depth*14+4)+'px';
    row.dataset.path=pathKey(path);

    if(isObj){
      var collapsed=!!rawJsonCollapsed[pathKey(path)];
      var tog=document.createElement('button');
      tog.className='rawJsonToggle';
      tog.textContent=collapsed ? '▶' : '▼';
      tog.onclick=function(){ rawJsonCollapsed[pathKey(path)] = !rawJsonCollapsed[pathKey(path)]; renderStructuredRawJson(); };
      row.appendChild(tog);
      var keySpan=document.createElement('span');
      keySpan.className='rawJsonKey';
      keySpan.textContent=path.length ? String(key) : '$';
      var type=document.createElement('span');
      type.className='rawJsonTypeBadge';
      type.textContent=Array.isArray(v) ? 'array: '+v.length : 'object: '+Object.keys(v).length;
      row.append(keySpan, type);
      var inferred=inferArrayItemLabel(path,v);
      if(inferred){ var lab=document.createElement('span'); lab.className='rawJsonArrayLabel'; lab.textContent=inferred; row.appendChild(lab); }
      parent.appendChild(row);
      if(!collapsed){
        if(Array.isArray(v)) v.forEach(function(x,i){ renderNode(x,path.concat([i]),i,parent,depth+1,query); });
        else Object.keys(v).forEach(function(k){ renderNode(v[k],path.concat([k]),k,parent,depth+1,query); });
      }
    }else{
      var indent=document.createElement('span'); indent.className='rawJsonIndent'; indent.textContent='';
      var k=document.createElement('span'); k.className='rawJsonKey'; k.textContent=String(key)+':';
      var input=document.createElement('input');
      input.className='rawJsonValueInput '+typeClass(v);
      input.value=(v===null?'null':String(v));
      input.title=pathText(path);
      input.oninput=function(){
        try{
          var current=getAtPath(rawJsonWorkingCopy,path);
          var parsed=parsePrimitiveByOriginal(input.value,current);
          setAtPath(rawJsonWorkingCopy,path,parsed);
          input.classList.remove('rawJsonInvalid');
          var err=document.getElementById('codeError'); if(err) err.textContent='Unapplied structured RAW JSON changes';
        }catch(e){
          input.classList.add('rawJsonInvalid');
          var err=document.getElementById('codeError'); if(err) err.textContent=e.message;
        }
      };
      row.append(indent,k,input);
      var valType=document.createElement('span'); valType.className='rawJsonTypeBadge'; valType.textContent=typeClass(v); row.appendChild(valType);
      parent.appendChild(row);
    }
  }

  var originalUpdateCodeTextFromModel = window.updateCodeTextFromModel;
  window.updateCodeTextFromModel = function(){
    if(typeof originalUpdateCodeTextFromModel === 'function') originalUpdateCodeTextFromModel();
    rawJsonWorkingCopy = (typeof fullJson !== 'undefined' && fullJson) ? deepClone(fullJson) : null;
    ensurePhase2Toolbar();
    ensureStructuredPane();
    setRawJsonMode(rawJsonMode);
  };

  var originalSetTab = window.setTab;
  window.setTab = function(t){
    var out = typeof originalSetTab === 'function' ? originalSetTab(t) : undefined;
    ensurePhase2Toolbar();
    ensureStructuredPane();
    if(t==='code') setRawJsonMode(rawJsonMode);
    return out;
  };

  var originalApplyCodeEdits = window.applyCodeEdits;
  window.applyCodeEdits = function(){
    if(rawJsonMode==='structured'){
      try{
        rawJsonLastAppliedSnapshot = (typeof fullJson !== 'undefined' && fullJson) ? deepClone(fullJson) : null;
        fullJson = deepClone(rawJsonWorkingCopy);
        refreshAllViews();
        setStatus('JSON updated from structured RAW JSON editor.', true);
      }catch(e){
        setStatus('Structured RAW JSON apply failed: '+e.message, false);
      }
      return;
    }
    if(typeof originalApplyCodeEdits === 'function') return originalApplyCodeEdits();
  };

  var originalResetCodeEditor = window.resetCodeEditor;
  window.resetCodeEditor = function(){
    if(rawJsonMode==='structured'){
      rawJsonWorkingCopy = (typeof fullJson !== 'undefined' && fullJson) ? deepClone(fullJson) : null;
      renderStructuredRawJson();
      var err=document.getElementById('codeError'); if(err) err.textContent='';
      setStatus('Structured RAW JSON editor restored from current model.', true);
      return;
    }
    if(typeof originalResetCodeEditor === 'function') return originalResetCodeEditor();
  };

  window.setRawJsonMode = setRawJsonMode;
  window.renderStructuredRawJson = renderStructuredRawJson;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ ensurePhase2Toolbar(); ensureStructuredPane(); setRawJsonMode('structured'); });
  else { ensurePhase2Toolbar(); ensureStructuredPane(); setRawJsonMode('structured'); }
  setTimeout(function(){ ensurePhase2Toolbar(); ensureStructuredPane(); setRawJsonMode(rawJsonMode); },0);
})();

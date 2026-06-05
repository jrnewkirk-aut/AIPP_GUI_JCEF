/* 15_raw_json_and_tree_realign_v1.js
   Re-aligns the left-pane editors after RAW JSON Phase 2 feedback.
   Load after 14_raw_json_viewer_phase2_v1.js.

   Intent:
   - RAW JSON tab becomes VS-Code-like raw text JSON editor: copy/paste friendly, line numbers, dark theme, minimap, non-destructive find.
   - Tree tab takes over the structured expandable/collapsible JSON editor/viewer behavior, without a Text mode selector.
*/
(function(){
  if(window.__aippRawJsonTreeRealignV1Applied) return;
  window.__aippRawJsonTreeRealignV1Applied = true;

  var treeWorkingCopy = null;
  var treeCollapsed = {};
  var treeRenderScheduled = false;

  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function asText(v){ return String(v == null ? '' : v); }
  function pkey(path){ return path.length ? path.join('.') : '$'; }
  function ptext(path){
    if(!path || !path.length) return '$';
    return '$.' + path.map(function(x){ return typeof x === 'number' ? '['+x+']' : String(x); }).join('.').replace(/\.\[/g,'[');
  }
  function getAt(root,path){ var r=root; for(var i=0;i<path.length;i++){ if(r==null) return undefined; r=r[path[i]]; } return r; }
  function setAt(root,path,value){ var r=root; for(var i=0;i<path.length-1;i++) r=r[path[i]]; r[path[path.length-1]]=value; }
  function vtype(v){ if(v===null) return 'null'; if(Array.isArray(v)) return 'array'; return typeof v; }
  function preview(v){
    if(v===null) return 'null';
    if(typeof v==='string') return '"'+v+'"';
    if(typeof v==='number' || typeof v==='boolean') return String(v);
    if(Array.isArray(v)) return '[array: '+v.length+']';
    if(typeof v==='object') return '{object: '+Object.keys(v).length+'}';
    return String(v);
  }
  function parseLike(text, original){
    var s=String(text);
    if(typeof original==='number'){
      var n=Number(s); if(!Number.isFinite(n)) throw new Error('Number expected'); return n;
    }
    if(typeof original==='boolean'){
      var t=s.trim().toLowerCase(); if(t==='true') return true; if(t==='false') return false; throw new Error('Boolean expected');
    }
    if(original===null){ if(s.trim()==='null') return null; try{return JSON.parse(s);}catch(e){return s;} }
    return s;
  }
  function itemLabel(path,obj){
    if(!path.length || typeof path[path.length-1] !== 'number') return '';
    var idx=path[path.length-1]+1, parent='';
    for(var i=path.length-2;i>=0;i--){ if(typeof path[i]==='string'){ parent=path[i]; break; } }
    var type='Item';
    if(parent==='chambers') type='Chamber'; else if(parent==='orifices') type='Orifice'; else if(parent==='walls') type='Wall';
    else if(parent==='pyro'||parent==='pyros') type='Pyro'; else if(parent==='filter'||parent==='filters') type='Filter';
    var lab=obj&&typeof obj==='object'&&!Array.isArray(obj)&&obj.label?String(obj.label):'';
    return type+' '+idx+(lab?'  —  '+lab:'');
  }

  function injectCss(){
    if(document.getElementById('aippRawJsonTreeRealignCss')) return;
    var s=document.createElement('style'); s.id='aippRawJsonTreeRealignCss';
    s.textContent=[
      '#tabCode{min-width:82px;text-align:center;}',
      '#codePane{background:#101923;}',
      '#codeToolbar{background:#f8fafc;}',
      '#rawJsonEditorShell{flex:1;min-height:0;display:grid;grid-template-columns:auto 1fr 72px;background:#101923;overflow:hidden;}',
      '#rawJsonLineNumbers{background:#0b121a;color:#607286;font-family:Consolas,monospace;font-size:12px;line-height:18px;text-align:right;padding:10px 8px 10px 4px;overflow:hidden;user-select:none;border-right:1px solid #25384d;}',
      '#codeEditor.rawJsonVsEditor{display:block!important;background:#101923!important;color:#d9e6f2!important;font-family:Consolas,monospace!important;font-size:12px!important;line-height:18px!important;padding:10px!important;white-space:pre!important;overflow:auto!important;resize:none!important;}',
      '#rawJsonMiniMap{background:#0b121a;border-left:1px solid #25384d;overflow:hidden;padding:4px 3px;}',
      '.rawJsonMiniLine{height:2px;margin:1px 0;border-radius:2px;opacity:.65;background:#33485e;}',
      '.rawJsonMiniLine.key{background:#61d394}.rawJsonMiniLine.brace{background:#67b7ff}.rawJsonMiniLine.value{background:#9cc9ff}',
      '#rawJsonFindInfo{font-size:11px;color:var(--muted);margin-left:4px;}',
      '.rawJsonToolbarHidden{display:none!important;}',
      '#treePane{padding:0!important;overflow:hidden!important;background:#101923;}',
      '#structuredTreeToolbar{height:42px;background:#f8fafc;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;padding:6px 8px;box-sizing:border-box;}',
      '#structuredTreeSearch{height:28px;width:240px;padding:0 8px;border:1px solid var(--line);border-radius:4px;font-size:12px;}',
      '#structuredTreeBody{height:calc(100% - 42px);overflow:auto;background:#101923;color:#d9e6f2;font-family:Consolas,monospace;font-size:12px;padding:8px;box-sizing:border-box;}',
      '.structuredTreeRow{display:flex;align-items:center;gap:4px;min-height:22px;white-space:nowrap;border-left:3px solid transparent;padding:1px 4px;}',
      '.structuredTreeRow.depth0{border-left-color:#005495}.structuredTreeRow.depth1{border-left-color:#009fe3}.structuredTreeRow.depth2{border-left-color:#147a1e}.structuredTreeRow.depth3{border-left-color:#b36b00}.structuredTreeRow.depth4{border-left-color:#7a2ab8}',
      '.structuredTreeRow:hover{background:#17283a;}',
      '.structuredTreeToggle{width:18px;height:18px;border:0;background:transparent;color:#9dd7ff;cursor:pointer;font-weight:900;padding:0;}',
      '.structuredTreeIndent{display:inline-block;width:18px;flex:0 0 auto;}',
      '.structuredTreeKey{color:#9dd7ff;font-weight:800;}',
      '.structuredTreeBadge{font-size:10px;color:#b8c7d6;border:1px solid #32475c;border-radius:999px;padding:1px 5px;background:#142333;}',
      '.structuredTreeLabel{color:#8a9bad;font-style:italic;margin-left:6px;}',
      '.structuredTreeInput{font-family:Consolas,monospace;font-size:12px;background:#0f1720;color:#e6edf3;border:1px solid #32475c;border-radius:3px;padding:2px 5px;min-width:120px;}',
      '.structuredTreeInput.string{color:#b6f5b6}.structuredTreeInput.number{color:#ffd28a}.structuredTreeInput.boolean{color:#ffb6d9}.structuredTreeInput.null{color:#b8c7d6}',
      '.structuredTreeInvalid{border-color:#c80000!important;background:#341c1c!important;}',
      '.structuredTreeMatch{background:#273d15!important;}',
      '.structuredTreeContext{opacity:.82;}',
      '#structuredTreeStatus{font-size:11px;color:#b8c7d6;padding:4px 6px;border-bottom:1px solid #25384d;margin-bottom:4px;}'
    ].join('\n'); document.head.appendChild(s);
  }

  function renameTabs(){ var t=document.getElementById('tabCode'); if(t) t.textContent='RAW JSON'; }

  function ensureRawJsonTextEditor(){
    injectCss(); renameTabs();
    var ed=document.getElementById('codeEditor'); if(!ed) return;
    ed.classList.remove('rawJsonTextHidden'); ed.classList.add('rawJsonVsEditor'); ed.readOnly=false;
    var pane=document.getElementById('rawJsonStructuredPane'); if(pane) pane.style.display='none';
    var mode=document.getElementById('rawJsonModeSelect'); if(mode && mode.parentNode) mode.parentNode.classList.add('rawJsonToolbarHidden');
    if(!document.getElementById('rawJsonEditorShell')){
      var shell=document.createElement('div'); shell.id='rawJsonEditorShell';
      var nums=document.createElement('div'); nums.id='rawJsonLineNumbers';
      var mini=document.createElement('div'); mini.id='rawJsonMiniMap';
      ed.parentNode.insertBefore(shell, ed);
      shell.append(nums, ed, mini);
      ed.addEventListener('scroll', function(){ nums.scrollTop=ed.scrollTop; });
      ed.addEventListener('input', updateRawJsonDecorations);
    }
    var search=document.getElementById('rawJsonSearchBox');
    if(search){ search.oninput=findInRawJsonText; search.placeholder='find in RAW JSON...'; }
    var info=document.getElementById('rawJsonSearchInfo');
    if(info) info.id='rawJsonFindInfo';
    updateRawJsonDecorations();
  }

  function updateRawJsonDecorations(){
    var ed=document.getElementById('codeEditor'), nums=document.getElementById('rawJsonLineNumbers'), mini=document.getElementById('rawJsonMiniMap');
    if(!ed || !nums || !mini) return;
    var lines=(ed.value||'').split(/\r?\n/);
    nums.innerHTML=lines.map(function(_,i){return i+1;}).join('<br>');
    var max=220, step=Math.max(1, Math.ceil(lines.length/max));
    mini.innerHTML='';
    for(var i=0;i<lines.length;i+=step){
      var line=lines[i], d=document.createElement('div'); d.className='rawJsonMiniLine '+(/^\s*[}\]]/.test(line)||/^\s*[{\[]/.test(line)?'brace':(/"[^"\\]*(?:\\.[^"\\]*)*"\s*:/.test(line)?'key':(line.trim()?'value':'')));
      mini.appendChild(d);
    }
  }

  function findInRawJsonText(){
    var ed=document.getElementById('codeEditor'), q=document.getElementById('rawJsonSearchBox'), info=document.getElementById('rawJsonFindInfo')||document.getElementById('rawJsonSearchInfo');
    if(!ed || !q) return;
    var s=q.value||'';
    if(!s){ if(info) info.textContent=''; return; }
    var text=ed.value||'', idx=text.toLowerCase().indexOf(s.toLowerCase());
    var count=s?text.toLowerCase().split(s.toLowerCase()).length-1:0;
    if(idx>=0){ ed.focus(); ed.setSelectionRange(idx, idx+s.length); if(info) info.textContent=count+' match(es)'; }
    else if(info) info.textContent='0 matches';
  }

  function ensureTreeWorking(){ if(!treeWorkingCopy && typeof fullJson!=='undefined' && fullJson) treeWorkingCopy=clone(fullJson); }
  function ensureStructuredTree(){
    injectCss();
    var pane=document.getElementById('treePane'); if(!pane) return;
    if(!document.getElementById('structuredTreeToolbar')){
      pane.innerHTML='';
      var tb=document.createElement('div'); tb.id='structuredTreeToolbar';
      var search=document.createElement('input'); search.id='structuredTreeSearch'; search.placeholder='search tree...'; search.oninput=renderTree;
      var expand=document.createElement('button'); expand.className='smallBtn secondary'; expand.textContent='Expand All'; expand.onclick=function(){treeCollapsed={}; renderTree();};
      var collapse=document.createElement('button'); collapse.className='smallBtn secondary'; collapse.textContent='Collapse All'; collapse.onclick=function(){collapseTreeAll(); renderTree();};
      var undo=document.createElement('button'); undo.className='smallBtn secondary'; undo.textContent='Undo'; undo.onclick=function(){treeWorkingCopy=fullJson?clone(fullJson):null; renderTree(); setStatus('Tree editor restored from current model.', true);};
      var apply=document.createElement('button'); apply.className='smallBtn'; apply.textContent='Apply JSON'; apply.onclick=applyStructuredTree;
      var status=document.createElement('span'); status.id='structuredTreeApplyStatus'; status.className='muted';
      var body=document.createElement('div'); body.id='structuredTreeBody';
      tb.append(search,expand,collapse,undo,apply,status); pane.append(tb,body);
    }
  }
  function collapseTreeAll(){
    ensureTreeWorking(); treeCollapsed={};
    function walk(v,path){ if(v&&typeof v==='object'){ treeCollapsed[pkey(path)] = path.length>0; if(Array.isArray(v)) v.forEach(function(x,i){walk(x,path.concat([i]));}); else Object.keys(v).forEach(function(k){walk(v[k],path.concat([k]));}); }}
    walk(treeWorkingCopy,[]);
  }
  function descMatch(v,path,q){
    if(!q) return true;
    var own=(ptext(path)+' '+preview(v)+' '+(path.length?path[path.length-1]:'root')+' '+itemLabel(path,v)).toLowerCase();
    if(own.indexOf(q)>=0) return true;
    if(v&&typeof v==='object'){
      if(Array.isArray(v)) return v.some(function(x,i){return descMatch(x,path.concat([i]),q);});
      return Object.keys(v).some(function(k){return descMatch(v[k],path.concat([k]),q);});
    }
    return false;
  }
  function renderTreeNow(){
    ensureStructuredTree(); ensureTreeWorking();
    var body=document.getElementById('structuredTreeBody'); if(!body) return;
    body.innerHTML='';
    if(!treeWorkingCopy){ body.innerHTML='<div id="structuredTreeStatus">Load a JSON file to view tree.</div>'; return; }
    var q=(document.getElementById('structuredTreeSearch')?.value||'').toLowerCase().trim();
    var st=document.createElement('div'); st.id='structuredTreeStatus'; st.textContent=q?'Tree filtered by: '+q+' (matches plus parent context shown)':'Structured Tree editor. Primitive values are editable.'; body.appendChild(st);
    renderTreeNode(treeWorkingCopy,[], '$', body,0,q);
  }
  function renderTreeNode(v,path,key,parent,depth,q){
    if(q && !descMatch(v,path,q)) return;
    var isObj=v&&typeof v==='object';
    var row=document.createElement('div'); row.className='structuredTreeRow depth'+(depth%5); row.style.paddingLeft=(depth*14+4)+'px';
    var own=(ptext(path)+' '+preview(v)+' '+String(key)+' '+itemLabel(path,v)).toLowerCase();
    if(q) row.className += own.indexOf(q)>=0?' structuredTreeMatch':' structuredTreeContext';
    if(isObj){
      var collapsed=!!treeCollapsed[pkey(path)];
      var tog=document.createElement('button'); tog.className='structuredTreeToggle'; tog.textContent=collapsed?'▶':'▼'; tog.onclick=function(){treeCollapsed[pkey(path)]=!treeCollapsed[pkey(path)]; renderTree();};
      var ks=document.createElement('span'); ks.className='structuredTreeKey'; ks.textContent=path.length?String(key):'$';
      var badge=document.createElement('span'); badge.className='structuredTreeBadge'; badge.textContent=Array.isArray(v)?'array: '+v.length:'object: '+Object.keys(v).length;
      row.append(tog,ks,badge); var lab=itemLabel(path,v); if(lab){var l=document.createElement('span'); l.className='structuredTreeLabel'; l.textContent=lab; row.appendChild(l);} parent.appendChild(row);
      if(!collapsed){ if(Array.isArray(v)) v.forEach(function(x,i){renderTreeNode(x,path.concat([i]),i,parent,depth+1,q);}); else Object.keys(v).forEach(function(k){renderTreeNode(v[k],path.concat([k]),k,parent,depth+1,q);}); }
    }else{
      var ind=document.createElement('span'); ind.className='structuredTreeIndent';
      var kspan=document.createElement('span'); kspan.className='structuredTreeKey'; kspan.textContent=String(key)+':';
      var input=document.createElement('input'); input.className='structuredTreeInput '+vtype(v); input.value=v===null?'null':String(v); input.title=ptext(path);
      input.oninput=function(){try{var cur=getAt(treeWorkingCopy,path); var parsed=parseLike(input.value,cur); setAt(treeWorkingCopy,path,parsed); input.classList.remove('structuredTreeInvalid'); var s=document.getElementById('structuredTreeApplyStatus'); if(s) s.textContent='Unapplied tree changes';}catch(e){input.classList.add('structuredTreeInvalid'); var s=document.getElementById('structuredTreeApplyStatus'); if(s){s.textContent=e.message; s.className='bad';}}};
      var badge=document.createElement('span'); badge.className='structuredTreeBadge'; badge.textContent=vtype(v);
      row.append(ind,kspan,input,badge); parent.appendChild(row);
    }
  }
  function applyStructuredTree(){
    try{ fullJson=clone(treeWorkingCopy); refreshAllViews(); setStatus('JSON updated from Tree editor.', true); }
    catch(e){ setStatus('Tree apply failed: '+e.message, false); }
  }

  window.renderTree=function(){
    if(treeRenderScheduled) return;
    treeRenderScheduled=true;
    requestAnimationFrame(function(){treeRenderScheduled=false; renderTreeNow();});
  };
  window.expandAll=function(){ treeCollapsed={}; renderTree(); };
  window.collapseAll=function(){ collapseTreeAll(); renderTree(); };

  window.updateCodeTextFromModel=function(){
    var ed=document.getElementById('codeEditor'), er=document.getElementById('codeError');
    if(ed) ed.value=fullJson?stringifyAippJsonPretty(fullJson):'';
    if(er) er.textContent='';
    treeWorkingCopy=fullJson?clone(fullJson):null;
    ensureRawJsonTextEditor();
    updateRawJsonDecorations();
  };
  window.applyCodeEdits=function(){
    try{ fullJson=JSON.parse(document.getElementById('codeEditor').value); treeWorkingCopy=clone(fullJson); refreshAllViews(); setStatus('JSON updated from RAW JSON editor.', true); }
    catch(e){ setStatus('Invalid JSON: '+e.message,false); var er=document.getElementById('codeError'); if(er) er.textContent='Invalid JSON: '+e.message; }
  };
  window.resetCodeEditor=function(){ updateCodeTextFromModel(); setStatus('RAW JSON editor restored from current model.', true); };
  window.setTab=function(t){
    try{ currentTab=t; }catch(e){}
    var tabTree=document.getElementById('tabTree'), tabCode=document.getElementById('tabCode'), treePane=document.getElementById('treePane'), codePane=document.getElementById('codePane');
    if(tabTree) tabTree.classList.toggle('active',t==='tree'); if(tabCode){ tabCode.classList.toggle('active',t==='code'); tabCode.textContent='RAW JSON'; }
    if(treePane) treePane.style.display=t==='tree'?'block':'none'; if(codePane) codePane.style.display=t==='code'?'flex':'none';
    if(t==='code'){ ensureRawJsonTextEditor(); updateCodeTextFromModel(); }
    if(t==='tree'){ renderTree(); }
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ renameTabs(); ensureRawJsonTextEditor(); ensureStructuredTree(); renderTree(); });
  else { renameTabs(); ensureRawJsonTextEditor(); ensureStructuredTree(); renderTree(); }
  setTimeout(function(){ renameTabs(); ensureRawJsonTextEditor(); ensureStructuredTree(); renderTree(); },0);
})();
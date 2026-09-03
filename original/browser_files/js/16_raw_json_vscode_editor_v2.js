/* 16_raw_json_vscode_editor_v2.js
   RAW JSON VS-Code-like editor pass.
   Load after 15_raw_json_and_tree_realign_v1.js.

   Goals:
   - Keep Tree exactly as the structured editor from patch 15.
   - Make RAW JSON a raw, copy/paste-friendly editor with syntax colors and fold controls.
   - Remove the fake minimap/scroll representation.
*/
(function(){
  if(window.__aippRawJsonVsCodeEditorV2Applied) return;
  window.__aippRawJsonVsCodeEditorV2Applied = true;

  var rawFolded = {};
  var rawRenderQueued = false;
  var rawIsEditing = false;

  function injectCss(){
    if(document.getElementById('aippRawJsonVsCodeEditorCss')) return;
    var s=document.createElement('style');
    s.id='aippRawJsonVsCodeEditorCss';
    s.textContent=[
      '#rawJsonMiniMap{display:none!important;}',
      '#rawJsonEditorShell{grid-template-columns:1fr!important;position:relative;background:#101923;}',
      '#rawJsonLineNumbers{display:none!important;}',
      '#codeEditor.rawJsonBackingStore{display:none!important;}',
      '#rawJsonVsCodeSurface{flex:1;min-height:0;height:100%;overflow:auto;background:#101923;color:#d9e6f2;font-family:Consolas,monospace;font-size:12px;line-height:18px;box-sizing:border-box;padding:8px 0;outline:none;white-space:pre;tab-size:2;}',
      '.rawJsonCodeLine{display:grid;grid-template-columns:42px 18px 1fr;min-height:18px;}',
      '.rawJsonCodeLine:hover{background:#1a2635;}',
      '.rawJsonLineNo{color:#607286;text-align:right;padding-right:8px;user-select:none;border-right:1px solid #25384d;}',
      '.rawJsonFoldBtn{border:0;background:transparent;color:#8fbfe8;cursor:pointer;font-size:11px;line-height:18px;padding:0;user-select:none;}',
      '.rawJsonFoldBtn.empty{visibility:hidden;}',
      '.rawJsonLineText{padding-left:8px;min-height:18px;outline:none;}',
      '.rawJsonLineText:focus{background:#202d3d;}',
      '.rawJsonFoldPlaceholder{color:#8a9bad;font-style:italic;background:#142333;border:1px solid #25384d;border-radius:3px;padding:0 6px;margin-left:4px;}',
      '.jsonTokKey{color:#65e28a;font-weight:700;}',
      '.jsonTokString{color:#8fc7ff;}',
      '.jsonTokNumber{color:#ffd28a;}',
      '.jsonTokBool{color:#ff9bd1;}',
      '.jsonTokNull{color:#c7b7ff;}',
      '.jsonTokPunct{color:#67b7ff;}',
      '.jsonTokColon{color:#d9e6f2;}',
      '.rawJsonFindHit{background:#5a4b00;color:#fff;border-radius:2px;}',
      '#rawJsonEditorStatus{position:absolute;right:10px;bottom:6px;color:#8a9bad;font-size:11px;background:rgba(16,25,35,.82);padding:2px 6px;border-radius:4px;pointer-events:none;}',
      '.rawJsonFoldToolbar{display:flex;gap:6px;align-items:center;margin-left:4px;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function getEditor(){ return document.getElementById('codeEditor'); }
  function getSurface(){ return document.getElementById('rawJsonVsCodeSurface'); }
  function getSearch(){ return document.getElementById('rawJsonSearchBox'); }
  function textLines(){ var ed=getEditor(); return (ed && ed.value ? ed.value : '').split(/\r?\n/); }
  function escape(s){ return escapeHtml(String(s==null?'':s)); }

  function ensureToolbar(){
    var toolbar=document.getElementById('codeToolbar');
    if(!toolbar || document.getElementById('rawJsonFoldToolbar')) return;
    var group=document.createElement('div');
    group.id='rawJsonFoldToolbar';
    group.className='rawJsonFoldToolbar';
    var expand=document.createElement('button'); expand.className='smallBtn secondary'; expand.textContent='Expand All'; expand.onclick=function(){rawFolded={}; renderRawJsonEditor();};
    var collapse=document.createElement('button'); collapse.className='smallBtn secondary'; collapse.textContent='Collapse All'; collapse.onclick=function(){collapseAllRaw(); renderRawJsonEditor();};
    var format=document.createElement('button'); format.className='smallBtn secondary'; format.textContent='Format'; format.onclick=function(){formatRawJsonText();};
    group.append(expand,collapse,format);
    var err=document.getElementById('codeError');
    toolbar.insertBefore(group, err || null);
  }

  function ensureSurface(){
    injectCss();
    var ed=getEditor(); if(!ed) return null;
    ed.classList.add('rawJsonBackingStore');
    var shell=document.getElementById('rawJsonEditorShell');
    if(!shell){
      shell=document.createElement('div'); shell.id='rawJsonEditorShell';
      ed.parentNode.insertBefore(shell, ed);
      shell.appendChild(ed);
    }
    var surface=getSurface();
    if(!surface){
      surface=document.createElement('div');
      surface.id='rawJsonVsCodeSurface';
      surface.setAttribute('spellcheck','false');
      surface.setAttribute('role','textbox');
      surface.setAttribute('aria-label','RAW JSON editor');
      shell.insertBefore(surface, ed);
      surface.addEventListener('input', function(){ rawIsEditing=true; syncSurfaceToBackingStore(); setRawStatus('Unapplied RAW JSON changes'); });
      surface.addEventListener('blur', function(){ rawIsEditing=false; renderRawJsonEditor(); });
      surface.addEventListener('paste', function(e){
        e.preventDefault();
        var txt=(e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, txt);
        syncSurfaceToBackingStore();
      });
      surface.addEventListener('keydown', function(e){
        if(e.key==='Tab'){
          e.preventDefault();
          document.execCommand('insertText', false, '  ');
          syncSurfaceToBackingStore();
        }
      });
      var status=document.createElement('div'); status.id='rawJsonEditorStatus'; shell.appendChild(status);
    }
    return surface;
  }

  function setRawStatus(msg){ var s=document.getElementById('rawJsonEditorStatus'); if(s) s.textContent=msg||''; }

  function findFoldRanges(lines){
    var stack=[], ranges={};
    function opens(line){ var t=line.trim(); return /[\{\[]\s*,?$/.test(t); }
    function closes(line){ var t=line.trim(); return /^[\}\]]/.test(t); }
    for(var i=0;i<lines.length;i++){
      if(closes(lines[i]) && stack.length){ var start=stack.pop(); if(i>start+1) ranges[start]=i; }
      if(opens(lines[i])) stack.push(i);
    }
    return ranges;
  }

  function collapseAllRaw(){
    var lines=textLines(), ranges=findFoldRanges(lines);
    rawFolded={};
    Object.keys(ranges).forEach(function(k){ if(Number(k)>0) rawFolded[k]=ranges[k]; });
  }

  function syntaxLine(line, query){
    var out='', i=0;
    var re=/("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\b\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?\b)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}\[\],])|(:)/g;
    var m;
    while((m=re.exec(line))!==null){
      out += escape(line.slice(i,m.index));
      var tok=m[0], cls='';
      if(m[1]) cls='jsonTokKey'; else if(m[2]) cls='jsonTokString'; else if(m[3]) cls='jsonTokNumber'; else if(m[4]) cls='jsonTokBool'; else if(m[5]) cls='jsonTokNull'; else if(m[6]) cls='jsonTokPunct'; else if(m[7]) cls='jsonTokColon';
      out += '<span class="'+cls+'">'+escape(tok)+'</span>';
      i = m.index + tok.length;
    }
    out += escape(line.slice(i));
    if(query){
      var q=escape(query).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      try{ out=out.replace(new RegExp(q,'ig'), function(x){return '<span class="rawJsonFindHit">'+x+'</span>';}); }catch(e){}
    }
    return out || '&nbsp;';
  }

  function renderRawJsonEditor(){
    if(rawRenderQueued) return;
    rawRenderQueued=true;
    requestAnimationFrame(function(){ rawRenderQueued=false; renderRawJsonEditorNow(); });
  }

  function renderRawJsonEditorNow(){
    var surface=ensureSurface(); if(!surface || rawIsEditing) return;
    var lines=textLines();
    var ranges=findFoldRanges(lines);
    var q=(getSearch()?getSearch().value:'')||'';
    surface.innerHTML='';
    for(var i=0;i<lines.length;i++){
      var line=document.createElement('div'); line.className='rawJsonCodeLine'; line.dataset.line=String(i+1);
      var no=document.createElement('div'); no.className='rawJsonLineNo'; no.textContent=i+1;
      var btn=document.createElement('button'); btn.className='rawJsonFoldBtn'+(ranges[i]?'':' empty'); btn.type='button';
      if(ranges[i]){
        btn.textContent=rawFolded[i]?'▶':'▼';
        btn.onclick=(function(start,end){return function(e){e.preventDefault(); if(rawFolded[start]) delete rawFolded[start]; else rawFolded[start]=end; renderRawJsonEditor();};})(i,ranges[i]);
      }else btn.textContent='';
      var code=document.createElement('div'); code.className='rawJsonLineText'; code.setAttribute('contenteditable','true'); code.dataset.lineIndex=String(i);
      if(rawFolded[i]){
        code.innerHTML=syntaxLine(lines[i], q)+' <span class="rawJsonFoldPlaceholder">… '+(rawFolded[i]-i-1)+' lines folded …</span>';
        line.append(no,btn,code); surface.appendChild(line); i=rawFolded[i]; continue;
      }
      code.innerHTML=syntaxLine(lines[i], q);
      line.append(no,btn,code); surface.appendChild(line);
    }
    setRawStatus(lines.length+' lines');
  }

  function syncSurfaceToBackingStore(){
    var surface=getSurface(), ed=getEditor(); if(!surface || !ed) return;
    // If any folds are active, expand before reading edited content so placeholders are not written back.
    if(Object.keys(rawFolded).length){ rawFolded={}; rawIsEditing=false; renderRawJsonEditorNow(); rawIsEditing=true; }
    var rows=Array.prototype.slice.call(surface.querySelectorAll('.rawJsonLineText'));
    ed.value=rows.map(function(r){ return r.textContent.replace(/\u00a0/g,''); }).join('\n');
  }

  function findInRawJson(){
    var q=getSearch(); if(!q) return;
    renderRawJsonEditor();
    var text=(getEditor()?.value||'').toLowerCase(), s=(q.value||'').toLowerCase();
    var info=document.getElementById('rawJsonFindInfo')||document.getElementById('rawJsonSearchInfo');
    if(!s){ if(info) info.textContent=''; return; }
    var count=text.split(s).length-1;
    if(info) info.textContent=count+' match(es)';
    setTimeout(function(){ var hit=document.querySelector('.rawJsonFindHit'); if(hit) hit.scrollIntoView({block:'center'}); },30);
  }

  function formatRawJsonText(){
    var ed=getEditor(); if(!ed) return;
    try{ ed.value=stringifyAippJsonPretty(JSON.parse(ed.value)); rawFolded={}; rawIsEditing=false; renderRawJsonEditor(); setStatus('RAW JSON formatted.', true); }
    catch(e){ setStatus('Cannot format invalid JSON: '+e.message, false); }
  }

  var priorUpdate=window.updateCodeTextFromModel;
  window.updateCodeTextFromModel=function(){
    if(typeof priorUpdate==='function') priorUpdate();
    ensureRawJsonEditorV2();
  };
  var priorApply=window.applyCodeEdits;
  window.applyCodeEdits=function(){
    syncSurfaceToBackingStore();
    if(typeof priorApply==='function') return priorApply();
  };
  var priorReset=window.resetCodeEditor;
  window.resetCodeEditor=function(){
    if(typeof priorReset==='function') priorReset();
    rawFolded={}; rawIsEditing=false; renderRawJsonEditor();
  };
  var priorSetTab=window.setTab;
  window.setTab=function(t){
    var out=typeof priorSetTab==='function'?priorSetTab(t):undefined;
    if(t==='code') ensureRawJsonEditorV2();
    return out;
  };

  function ensureRawJsonEditorV2(){
    injectCss(); ensureToolbar(); ensureSurface();
    var search=getSearch(); if(search){ search.oninput=findInRawJson; search.placeholder='find in RAW JSON...'; }
    rawIsEditing=false;
    renderRawJsonEditor();
  }

  window.renderRawJsonEditorV2=renderRawJsonEditor;
  window.formatRawJsonText=formatRawJsonText;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ensureRawJsonEditorV2);
  else ensureRawJsonEditorV2();
  setTimeout(ensureRawJsonEditorV2,0);
})();
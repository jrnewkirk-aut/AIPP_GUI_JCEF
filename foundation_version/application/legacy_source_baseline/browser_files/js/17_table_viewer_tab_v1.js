/* 17_table_viewer_tab_v1.js
   Adds a third left-pane tab: Table.
   Load after current left-pane editor patches, preferably after 16_raw_json_vscode_editor_v2.js.

   Based on the provided json_table_editor_v10.html concept:
   - table view of chambers, orifices, and walls
   - editable cells
   - collapsible sections, rows, and columns
   - column resizing
   - field-row drag reorder with JSON key order sync

   Explicitly excluded per AIPP GUI requirements:
   - no JSON load button
   - no JSON save button
   - no add/remove chamber/orifice/wall buttons
   Entity creation/removal remains owned by the robust assembly flowchart/topology workflow.
*/
(function(){
  if(window.__aippTableViewerTabV1Applied) return;
  window.__aippTableViewerTabV1Applied = true;

  var tableWorkingCopy = null;
  var tableRenderQueued = false;
  var draggedTableRow = null;

  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function h(s){ return escapeHtml(String(s == null ? '' : s)); }
  function ensureCopy(){ if(!tableWorkingCopy && typeof fullJson !== 'undefined' && fullJson) tableWorkingCopy = clone(fullJson); }
  function tableInfo(){ return getAssemblyInfo(tableWorkingCopy || fullJson || {}); }
  function fmtField(field){ return String(field).replace(/_/g,' ').split(' ').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' '); }
  function isNested(v){ return v !== null && typeof v === 'object'; }
  function parseCellText(text, original){
    var s=String(text == null ? '' : text).trim();
    if(isNested(original)){
      if(!s) return undefined;
      return JSON.parse(s);
    }
    if(typeof original === 'number'){
      var n=Number(s); if(!Number.isFinite(n)) throw new Error('Number expected'); return n;
    }
    if(typeof original === 'boolean'){
      var t=s.toLowerCase(); if(t==='true') return true; if(t==='false') return false; throw new Error('Boolean expected');
    }
    if(original === null){ if(s==='null') return null; try{return JSON.parse(s);}catch(e){return s;} }
    // Use existing parser when available to preserve current GUI conventions for user-entered primitives.
    try{ if(typeof parseLoose === 'function') return parseLoose(s); }catch(e){}
    return s;
  }

  function injectCss(){
    if(document.getElementById('aippTableViewerCss')) return;
    var s=document.createElement('style');
    s.id='aippTableViewerCss';
    s.textContent=[
      '#tabTable{padding:8px 10px;border:1px solid var(--line);border-bottom:0;border-radius:6px 6px 0 0;background:#fafafa;cursor:pointer;font-weight:700;font-size:12px;}',
      '#tabTable.active{background:#fff;color:var(--blue);}',
      '#tablePane{flex:1;overflow:auto;padding:0;background:#f5f6f7;box-sizing:border-box;}',
      '#tableToolbar{height:42px;background:#f8fafc;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;padding:6px 8px;box-sizing:border-box;position:sticky;top:0;z-index:20;}',
      '#tableSearchBox{height:28px;width:230px;padding:0 8px;border:1px solid var(--line);border-radius:4px;font-size:12px;}',
      '#tableContent{padding:10px;}',
      '.jsonTableSection{background:#fff;border-radius:8px;margin-bottom:12px;box-shadow:0 2px 4px rgba(0,0,0,.10);overflow:hidden;}',
      '.jsonTableSectionHeader{margin:0;padding:10px 12px;color:#333;border-bottom:2px solid #0066cc;cursor:pointer;user-select:none;font-size:15px;background:#fff;}',
      '.jsonTableSectionHeader:hover{background:#f0f7ff;}',
      '.jsonTableSectionToggle{display:inline-block;margin-right:8px;transition:transform .2s;}',
      '.jsonTableSectionBody{padding:12px;overflow:auto;}',
      '.jsonTableContainer{overflow:auto;max-width:100%;}',
      '.jsonEntityTable{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;}',
      '.jsonEntityTable th{background:#0066cc;color:#fff;padding:8px;text-align:left;font-weight:700;position:sticky;top:42px;z-index:10;white-space:nowrap;}',
      '.jsonEntityTable td{padding:7px;border:1px solid #e0e0e0;vertical-align:top;}',
      '.jsonEntityTable tbody tr:nth-child(even){background:#f9f9f9;}',
      '.jsonEntityTable tbody tr:hover{background:#f0f7ff;}',
      '.tableFieldLabel{font-weight:700;color:#0066cc;cursor:pointer;user-select:none;white-space:nowrap;}',
      '.tableFieldLabel:hover{background:#e6f2ff;}',
      '.tableToggleIcon,.tableHeaderToggle{display:inline-block;margin-right:6px;transition:transform .2s;}',
      '.tableCellValue{background:#fff;border:1px solid #ddd;border-radius:3px;padding:5px 8px;font-family:Consolas,monospace;min-height:24px;min-width:80px;display:block;white-space:pre-wrap;}',
      '.tableCellValue[contenteditable="true"]{background:#fffceb;cursor:text;}',
      '.tableCellValue[contenteditable="true"]:focus{outline:2px solid #0066cc;outline-offset:-1px;}',
      '.tableCellValue.invalid{outline:2px solid #c80000!important;background:#fff0f0!important;}',
      '.tableMissing{color:#bbb;font-family:Consolas,monospace;}',
      'th.tableResizable{position:relative;}',
      '.tableColResizer{position:absolute;top:0;right:-3px;width:8px;height:100%;cursor:col-resize;background:rgba(0,0,0,.15);}',
      '.tableColResizer:hover{background:rgba(0,0,0,.35);}',
      'tr.tableDraggableRow{cursor:grab;}',
      'tr.tableDragging{opacity:.50;}',
      'tr.tableDragOverTop{border-top:3px solid #0066cc;}',
      'tr.tableDragOverBottom{border-bottom:3px solid #0066cc;}',
      '.tableHelp{font-size:12px;color:var(--muted);margin-left:auto;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function ensureTabAndPane(){
    injectCss();
    var tabs=document.getElementById('tabs');
    if(tabs && !document.getElementById('tabTable')){
      var tab=document.createElement('div');
      tab.id='tabTable';
      tab.textContent='Table';
      tab.onclick=function(){ setTab('table'); };
      tabs.appendChild(tab);
    }
    var left=document.getElementById('left');
    if(left && !document.getElementById('tablePane')){
      var pane=document.createElement('div');
      pane.id='tablePane';
      pane.style.display='none';
      pane.innerHTML='<div id="tableToolbar"><input id="tableSearchBox" placeholder="search table fields / values..." oninput="renderTableViewer()"><button class="smallBtn secondary" id="tableUndoBtn">Undo</button><button class="smallBtn" id="tableApplyBtn">Apply JSON</button><span id="tableStatus" class="muted"></span><span class="tableHelp">Tables edit chambers, orifices, and walls only. Add/remove is handled in the flow chart.</span></div><div id="tableContent"></div>';
      left.appendChild(pane);
      pane.querySelector('#tableUndoBtn').onclick=function(){ tableWorkingCopy = fullJson ? clone(fullJson) : null; renderTableViewer(); setStatus('Table editor restored from current model.', true); };
      pane.querySelector('#tableApplyBtn').onclick=applyTableChanges;
    }
  }

  function setActiveTab(name){
    var tree=document.getElementById('tabTree'), code=document.getElementById('tabCode'), table=document.getElementById('tabTable');
    if(tree) tree.classList.toggle('active', name==='tree');
    if(code) code.classList.toggle('active', name==='code');
    if(table) table.classList.toggle('active', name==='table');
    var treePane=document.getElementById('treePane'), codePane=document.getElementById('codePane'), tablePane=document.getElementById('tablePane');
    if(treePane) treePane.style.display=name==='tree'?'block':'none';
    if(codePane) codePane.style.display=name==='code'?'flex':'none';
    if(tablePane) tablePane.style.display=name==='table'?'block':'none';
  }

  function renderTableViewer(){
    if(tableRenderQueued) return;
    tableRenderQueued=true;
    requestAnimationFrame(function(){ tableRenderQueued=false; renderTableViewerNow(); });
  }

  function renderTableViewerNow(){
    ensureTabAndPane();
    ensureCopy();
    var content=document.getElementById('tableContent');
    if(!content) return;
    content.innerHTML='';
    if(!tableWorkingCopy){ content.innerHTML='<div class="jsonTableSection"><h3 class="jsonTableSectionHeader">No JSON loaded</h3></div>'; return; }
    var info=tableInfo(), a=info.assembly || {};
    content.appendChild(renderEntitySection('chambers','Chambers', Array.isArray(a.chambers)?a.chambers:[]));
    content.appendChild(renderEntitySection('orifices','Orifices', Array.isArray(a.orifices)?a.orifices:[]));
    content.appendChild(renderEntitySection('walls','Walls', Array.isArray(a.walls)?a.walls:[]));
  }

  function renderEntitySection(key,title,arr){
    var section=document.createElement('div');
    section.className='jsonTableSection';
    section.id='tableSection_'+key;
    var header=document.createElement('h3');
    header.className='jsonTableSectionHeader';
    header.innerHTML='<span class="jsonTableSectionToggle">▼</span>'+title+' (<span>'+arr.length+'</span>)';
    var body=document.createElement('div');
    body.className='jsonTableSectionBody';
    header.onclick=function(){
      var icon=header.querySelector('.jsonTableSectionToggle');
      var hidden=body.style.display!=='none' ? true : false;
      body.style.display=hidden?'none':'';
      icon.textContent=hidden?'▶':'▼';
    };
    section.append(header,body);
    if(!arr.length){ body.innerHTML='<div class="muted">No '+title.toLowerCase()+' defined.</div>'; return section; }
    var container=document.createElement('div'); container.className='jsonTableContainer';
    var table=document.createElement('table'); table.className='jsonEntityTable'; table.id='entityTable_'+key;
    var thead=document.createElement('thead'); var tbody=document.createElement('tbody');
    table.append(thead,tbody); container.appendChild(table); body.appendChild(container);
    renderTableHeader(thead, table, key, title, arr);
    renderTableBody(tbody, table, key, arr);
    autoSizeFirstColumn(table);
    return section;
  }

  function entitySingular(key){ return key==='chambers'?'Chamber':key==='orifices'?'Orifice':key==='walls'?'Wall':'Entity'; }

  function renderTableHeader(thead, table, key, title, arr){
    var tr=document.createElement('tr');
    var control=document.createElement('th');
    control.className='column-header';
    control.style.cursor='pointer';
    control.innerHTML='<span class="tableHeaderToggle">▼</span>';
    control.onclick=function(){
      var icon=control.querySelector('.tableHeaderToggle');
      var collapsed=icon.textContent==='▼';
      icon.textContent=collapsed?'▶':'▼';
      table.querySelectorAll('tr').forEach(function(row){
        Array.prototype.slice.call(row.children).forEach(function(cell,idx){ if(idx>0) cell.style.display=collapsed?'none':''; });
      });
    };
    tr.appendChild(control);
    arr.forEach(function(_,i){
      var th=document.createElement('th'); th.textContent=entitySingular(key)+' '+(i+1); tr.appendChild(th);
    });
    thead.appendChild(tr);
    Array.prototype.slice.call(tr.children).forEach(function(_,idx){ if(idx>0) makeColumnResizable(table,idx); });
  }

  function uniqueFields(arr){
    var set=new Set();
    arr.forEach(function(obj){ if(obj && typeof obj==='object' && !Array.isArray(obj)) Object.keys(obj).forEach(function(k){set.add(k);}); });
    return Array.from(set);
  }

  function renderTableBody(tbody, table, key, arr){
    var q=(document.getElementById('tableSearchBox')?.value||'').toLowerCase().trim();
    uniqueFields(arr).forEach(function(field){
      var row=document.createElement('tr'); row.dataset.field=field;
      var rowText=field+' '+arr.map(function(o){return o&&o[field]!==undefined?JSON.stringify(o[field]):'';}).join(' ');
      if(q && rowText.toLowerCase().indexOf(q)<0) return;
      var label=document.createElement('td'); label.className='tableFieldLabel'; label.innerHTML='<span class="tableToggleIcon">▼</span>'+fmtField(field);
      label.onclick=function(){
        var icon=label.querySelector('.tableToggleIcon');
        var collapsed=icon.textContent==='▼';
        icon.textContent=collapsed?'▶':'▼';
        Array.prototype.slice.call(row.children).forEach(function(cell,idx){ if(idx>0) cell.style.display=collapsed?'none':''; });
      };
      row.appendChild(label);
      arr.forEach(function(obj,idx){
        var td=document.createElement('td');
        td.appendChild(createCellEditor(obj,field));
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    enableRowDragWithJsonSync(tbody,arr);
  }

  function createCellEditor(obj,field){
    var div=document.createElement('div'); div.className='tableCellValue'; div.contentEditable='true';
    var has=obj && Object.prototype.hasOwnProperty.call(obj,field);
    var original=has?obj[field]:undefined;
    if(!has){ div.innerHTML='<span class="tableMissing">—</span>'; div.dataset.empty='1'; }
    else if(isNested(original)){ div.textContent=JSON.stringify(original,null,2); }
    else { div.textContent=String(original); }
    div.addEventListener('focus',function(){ if(div.dataset.empty==='1'){ div.textContent=''; delete div.dataset.empty; } });
    div.addEventListener('blur',function(){
      try{
        var txt=div.textContent;
        if(txt.trim()==='' && !has){ delete obj[field]; div.innerHTML='<span class="tableMissing">—</span>'; div.dataset.empty='1'; return; }
        obj[field]=parseCellText(txt, original);
        div.classList.remove('invalid');
        var st=document.getElementById('tableStatus'); if(st) st.textContent='Unapplied table changes';
      }catch(e){ div.classList.add('invalid'); var st=document.getElementById('tableStatus'); if(st){st.textContent=e.message; st.className='bad';} }
    });
    return div;
  }

  function makeColumnResizable(table,colIndex){
    var th=table.querySelector('thead tr th:nth-child('+(colIndex+1)+')'); if(!th) return;
    th.classList.add('tableResizable');
    if(th.querySelector('.tableColResizer')) return;
    var res=document.createElement('div'); res.className='tableColResizer'; th.appendChild(res);
    var startX=0,startW=0;
    res.addEventListener('mousedown',function(e){
      startX=e.pageX; startW=th.offsetWidth;
      function move(ev){ var w=Math.max(40,startW+(ev.pageX-startX)); table.querySelectorAll('tr').forEach(function(row){ var cell=row.children[colIndex]; if(cell) cell.style.width=w+'px'; }); }
      function up(){ document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); }
      document.addEventListener('mousemove',move); document.addEventListener('mouseup',up); e.preventDefault(); e.stopPropagation();
    });
  }

  function enableRowDragWithJsonSync(tbody,dataArray){
    tbody.querySelectorAll('tr').forEach(function(row){
      if(!row.dataset.field) return;
      row.classList.add('tableDraggableRow'); row.draggable=true;
      row.addEventListener('dragstart',function(){ draggedTableRow=row; row.classList.add('tableDragging'); });
      row.addEventListener('dragend',function(){ draggedTableRow=null; row.classList.remove('tableDragging'); tbody.querySelectorAll('tr').forEach(function(r){r.classList.remove('tableDragOverTop','tableDragOverBottom');}); syncJsonKeyOrder(tbody,dataArray); });
      row.addEventListener('dragover',function(e){ e.preventDefault(); var r=row.getBoundingClientRect(), above=e.clientY<r.top+r.height/2; row.classList.toggle('tableDragOverTop',above); row.classList.toggle('tableDragOverBottom',!above); });
      row.addEventListener('dragleave',function(){ row.classList.remove('tableDragOverTop','tableDragOverBottom'); });
      row.addEventListener('drop',function(e){ e.preventDefault(); if(!draggedTableRow || draggedTableRow===row) return; var r=row.getBoundingClientRect(), above=e.clientY<r.top+r.height/2; row.classList.remove('tableDragOverTop','tableDragOverBottom'); tbody.insertBefore(draggedTableRow, above?row:row.nextSibling); });
    });
  }

  function syncJsonKeyOrder(tbody,dataArray){
    var order=Array.prototype.slice.call(tbody.querySelectorAll('tr')).map(function(r){return r.dataset.field;}).filter(Boolean);
    dataArray.forEach(function(obj){
      if(!obj || typeof obj!=='object' || Array.isArray(obj)) return;
      var reordered={};
      order.forEach(function(k){ if(Object.prototype.hasOwnProperty.call(obj,k)) reordered[k]=obj[k]; });
      Object.keys(obj).forEach(function(k){ if(!Object.prototype.hasOwnProperty.call(reordered,k)) reordered[k]=obj[k]; });
      Object.keys(obj).forEach(function(k){ delete obj[k]; });
      Object.assign(obj,reordered);
    });
    var st=document.getElementById('tableStatus'); if(st) st.textContent='Unapplied table row order changes';
  }

  function autoSizeFirstColumn(table){
    var max=90;
    table.querySelectorAll('td.tableFieldLabel').forEach(function(cell){ max=Math.max(max, Math.min(260, cell.textContent.length*8+28)); });
    table.querySelectorAll('tr').forEach(function(row){ if(row.children[0]) row.children[0].style.width=max+'px'; });
  }

  function applyTableChanges(){
    try{ fullJson=clone(tableWorkingCopy); refreshAllViews(); setStatus('JSON updated from Table viewer.', true); }
    catch(e){ setStatus('Table apply failed: '+e.message,false); }
  }

  var priorRefresh=window.refreshAllViews;
  window.refreshAllViews=function(){
    if(typeof priorRefresh==='function') priorRefresh();
    tableWorkingCopy = fullJson ? clone(fullJson) : null;
    renderTableViewer();
  };
  var priorSetTab=window.setTab;
  window.setTab=function(t){
    ensureTabAndPane();
    if(t==='table'){
      try{ currentTab='table'; }catch(e){}
      setActiveTab('table');
      if(!tableWorkingCopy && fullJson) tableWorkingCopy=clone(fullJson);
      renderTableViewer();
      return;
    }
    var out=typeof priorSetTab==='function'?priorSetTab(t):undefined;
    if(t==='tree' || t==='code') setActiveTab(t);
    return out;
  };

  window.renderTableViewer=renderTableViewer;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ ensureTabAndPane(); tableWorkingCopy=fullJson?clone(fullJson):null; renderTableViewer(); });
  else { ensureTabAndPane(); tableWorkingCopy=fullJson?clone(fullJson):null; renderTableViewer(); }
  setTimeout(function(){ ensureTabAndPane(); renderTableViewer(); },0);
})();
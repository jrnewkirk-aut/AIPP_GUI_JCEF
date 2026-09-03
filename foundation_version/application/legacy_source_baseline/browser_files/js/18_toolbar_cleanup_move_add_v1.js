/* 18_toolbar_cleanup_move_add_v1.js
   Surgical UI cleanup only.
   Load after 17_table_viewer_tab_v1.js.

   Changes:
   - Hide/remove the old top-toolbar Expand All, Collapse All, and global Search controls.
   - Move the existing topology Add button/menu into the Assembly Flow header.
   - Preserve existing openTopologyAddMenu/openAddEntityDialog behavior and all add/remove logic.
*/
(function(){
  if(window.__aippToolbarCleanupMoveAddV1Applied) return;
  window.__aippToolbarCleanupMoveAddV1Applied = true;

  function injectCleanupCss(){
    if(document.getElementById('aippToolbarCleanupMoveAddCss')) return;
    var style=document.createElement('style');
    style.id='aippToolbarCleanupMoveAddCss';
    style.textContent = [
      '#toolbar .aippLegacyTreeControlHidden{display:none!important;}',
      '#toolbar .toolbarDivider.aippLegacyTreeControlHidden{display:none!important;}',
      '#vizHeader{position:relative;}',
      '#vizAddControlWrap{display:flex;align-items:center;gap:6px;margin-left:10px;position:relative;}',
      '#vizHeader #topologyAddMenu{top:32px!important;left:auto!important;right:0!important;z-index:1200;}',
      '#vizHeader .btn{padding:6px 9px;font-size:12px;}',
      '#vizHeader .topologyMenu button{font-size:12px;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function markHidden(el){
    if(!el) return;
    el.classList.add('aippLegacyTreeControlHidden');
    el.setAttribute('aria-hidden','true');
  }

  function hideLegacyTopToolbarControls(){
    var toolbar=document.getElementById('toolbar');
    if(!toolbar) return;

    // Hide the old top-level Tree controls. Tree/Table/RAW JSON now own their local controls.
    Array.prototype.slice.call(toolbar.querySelectorAll('button')).forEach(function(btn){
      var onclick=String(btn.getAttribute('onclick')||'');
      var txt=String(btn.textContent||'').trim();
      if(onclick.indexOf('expandAll')>=0 || onclick.indexOf('collapseAll')>=0 || txt==='Expand All' || txt==='Collapse All'){
        markHidden(btn);
      }
    });

    // Hide global tree search field shown in the top toolbar.
    Array.prototype.slice.call(toolbar.querySelectorAll('.field')).forEach(function(field){
      if(field.querySelector('#searchBox') || /search\s*:/i.test(field.textContent||'')) markHidden(field);
    });

    // Hide dividers that were only separating the removed controls from the Add button.
    Array.prototype.slice.call(toolbar.querySelectorAll('.toolbarDivider')).forEach(function(div){
      markHidden(div);
    });
  }

  function findAddButton(){
    var btns=Array.prototype.slice.call(document.querySelectorAll('button'));
    return btns.find(function(btn){
      var onclick=String(btn.getAttribute('onclick')||'');
      var txt=String(btn.textContent||'').trim();
      return onclick.indexOf('openTopologyAddMenu')>=0 || /^Add\s*▼?$/.test(txt);
    });
  }

  function moveAddToAssemblyFlowHeader(){
    var vizHeader=document.getElementById('vizHeader');
    if(!vizHeader) return;
    var tools=vizHeader.querySelector('.vizHeaderTools');
    var addBtn=findAddButton();
    var menu=document.getElementById('topologyAddMenu');
    if(!addBtn || !menu) return;

    var wrap=document.getElementById('vizAddControlWrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='vizAddControlWrap';
      if(tools) tools.insertBefore(wrap, tools.firstChild);
      else vizHeader.appendChild(wrap);
    }

    if(addBtn.parentNode !== wrap) wrap.appendChild(addBtn);
    if(menu.parentNode !== wrap) wrap.appendChild(menu);

    addBtn.classList.add('smallBtn');
    addBtn.classList.add('secondary');
    addBtn.classList.remove('btn');
    addBtn.title='Add chamber, orifice, or wall to the assembly';
  }

  // Existing openTopologyAddMenu uses the menu element directly. Preserve it, but make sure the moved menu stays anchored.
  var originalOpenTopologyAddMenu = window.openTopologyAddMenu;
  window.openTopologyAddMenu = function(e){
    moveAddToAssemblyFlowHeader();
    if(typeof originalOpenTopologyAddMenu === 'function') return originalOpenTopologyAddMenu(e);
    var m=document.getElementById('topologyAddMenu');
    if(m) m.style.display=m.style.display==='none'?'block':'none';
    if(e) e.stopPropagation();
  };

  function applyCleanup(){
    injectCleanupCss();
    hideLegacyTopToolbarControls();
    moveAddToAssemblyFlowHeader();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', applyCleanup);
  else applyCleanup();
  [0,50,200,700,1500].forEach(function(ms){ setTimeout(applyCleanup, ms); });
})();
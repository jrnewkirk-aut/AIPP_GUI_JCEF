/* 12_flow_chart_overlay_sync_v2.js
   Replacement for 12_flow_chart_overlay_sync_v1.js.
   Load after 11_flow_chart_chamber_cards_v1.js.

   Root cause fixed:
   - v1 referenced window.cyPrototype, but cyPrototype is declared with top-level `let` in the bundle.
   - Top-level `let` variables are not properties of window, so v1 frequently saw no graph instance.
   - This replacement uses the lexical cyPrototype variable used by the existing graph engine.

   Purpose:
   - Keep HTML chamber detail cards aligned to Cytoscape chamber nodes during pan/zoom/fit/layout.
   - Resize the detail card to match the rendered Cytoscape chamber rectangle.
   - Remove stale overlay cards after graph rebuilds.
*/
(function(){
  if(window.__aippFlowChartOverlaySyncV2Applied) return;
  window.__aippFlowChartOverlaySyncV2Applied = true;

  var overlaySyncRaf = null;
  var listenersInstalledFor = null;

  function getCy(){
    try{
      if(typeof cyPrototype !== 'undefined' && cyPrototype) return cyPrototype;
    }catch(e){}
    return null;
  }

  function requestOverlaySync(){
    if(overlaySyncRaf) cancelAnimationFrame(overlaySyncRaf);
    overlaySyncRaf = requestAnimationFrame(syncOverlayToRenderedNodes);
  }

  function installOverlaySyncListeners(){
    var cy = getCy();
    if(!cy || listenersInstalledFor === cy) return;
    listenersInstalledFor = cy;
    try{
      cy.on('pan zoom viewport resize render', requestOverlaySync);
      cy.on('position drag free', 'node', requestOverlaySync);
      cy.ready(function(){ requestOverlaySync(); });
    }catch(e){
      try{ console.warn('AIPP overlay sync listener install failed', e); }catch(_e){}
    }
  }

  function syncOverlayToRenderedNodes(){
    overlaySyncRaf = null;
    var cy = getCy();
    if(!cy) return;
    var layer = document.getElementById('cyChamberOverlayLayer');
    if(!layer) return;

    var liveIds = {};
    try{
      cy.nodes('[type="chamber"]').forEach(function(node){ liveIds['cyOverlay_'+node.id()] = true; });
      layer.querySelectorAll('.cyChamberCardOverlay').forEach(function(card){
        if(!liveIds[card.id] && card.parentNode) card.parentNode.removeChild(card);
      });
    }catch(e){}

    try{
      cy.nodes('[type="chamber"]').forEach(function(node){
        var card = document.getElementById('cyOverlay_'+node.id());
        if(!card) return;
        var bb = node.renderedBoundingBox({includeLabels:false});
        var w = Math.max(80, bb.w + 2);
        var h = Math.max(52, bb.h + 2);

        card.style.left = (bb.x1 - 1) + 'px';
        card.style.top = (bb.y1 - 1) + 'px';
        card.style.width = w + 'px';
        card.style.height = h + 'px';
        card.style.minHeight = h + 'px';
        card.style.transform = 'none';
        card.style.willChange = 'left, top, width, height';
      });
    }catch(e){
      try{ console.warn('AIPP overlay sync failed', e); }catch(_e){}
    }
  }

  window.updateCytoscapeOverlayPositions = syncOverlayToRenderedNodes;

  var originalSchedule = window.scheduleCytoscapeOverlayUpdate;
  window.scheduleCytoscapeOverlayUpdate = function(){
    installOverlaySyncListeners();
    requestOverlaySync();
    // Do not call the older scheduler here; it can schedule the pre-v2 updater and fight the new sync.
  };

  var originalBuild = window.buildCytoscapeChamberOverlays;
  window.buildCytoscapeChamberOverlays = function(){
    if(typeof originalBuild === 'function') originalBuild();
    installOverlaySyncListeners();
    requestOverlaySync();
    setTimeout(requestOverlaySync, 0);
    setTimeout(requestOverlaySync, 60);
  };

  var originalRender = window.renderCytoscapePrototype;
  window.renderCytoscapePrototype = function(){
    if(typeof originalRender === 'function') originalRender();
    [0,50,150,350,900].forEach(function(ms){
      setTimeout(function(){ installOverlaySyncListeners(); requestOverlaySync(); }, ms);
    });
  };

  var originalLayout = window.applyAippCytoscapeLayout;
  window.applyAippCytoscapeLayout = function(anim){
    if(typeof originalLayout === 'function') originalLayout(anim);
    [0,80,180,320,600].forEach(function(ms){
      setTimeout(function(){ installOverlaySyncListeners(); requestOverlaySync(); }, ms);
    });
  };

  var originalFit = window.fitCytoscapePrototype;
  window.fitCytoscapePrototype = function(){
    if(typeof originalFit === 'function') originalFit();
    [0,80,180,320].forEach(function(ms){
      setTimeout(function(){ installOverlaySyncListeners(); requestOverlaySync(); }, ms);
    });
  };

  setTimeout(function(){ installOverlaySyncListeners(); requestOverlaySync(); }, 0);
})();

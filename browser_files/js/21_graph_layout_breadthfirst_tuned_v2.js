/* 21_graph_layout_breadthfirst_tuned_v2.js
   Optional Cytoscape breadthfirst layout with production defaults selected from JCEF tuning.

   Joseph-selected defaults:
     bfDirection = 'leftward'
     bfAvoidOverlap = true
     bfDirected = false
     bfCircle = false
     bfGrid = true
     bfSpacingFactor = 0.9
     bfMaximal = true
     bfFit = true
     bfPadding = 1000
     bfAnimate = true
     bfAnimationDuration = 600
     bfNodeDimensionsIncludeLabels = false
     includeWallsInAutoLayout = true

   Default mode remains the existing manual/preset layout.
*/
(function(){
  if(window.__aippGraphLayoutBreadthfirstTunedV2Applied) return;
  window.__aippGraphLayoutBreadthfirstTunedV2Applied = true;

  window.aippGraphLayoutConfig = window.aippGraphLayoutConfig || {};
  var cfg = window.aippGraphLayoutConfig;

  if(!cfg.mode) cfg.mode = 'preset_manual';
  if(!cfg.autoLayout) cfg.autoLayout = 'breadthfirst';

  // Tuned breadthfirst layout defaults.
  // Valid direction values in current bundled Cytoscape: downward, leftward, upward, rightward.
  if(cfg.bfDirection == null) cfg.bfDirection = 'leftward';
  if(cfg.bfAvoidOverlap == null) cfg.bfAvoidOverlap = true;
  if(cfg.bfDirected == null) cfg.bfDirected = false;
  if(cfg.bfCircle == null) cfg.bfCircle = false;
  if(cfg.bfGrid == null) cfg.bfGrid = true;
  if(cfg.bfSpacingFactor == null) cfg.bfSpacingFactor = 0.9;
  if(cfg.bfMaximal == null) cfg.bfMaximal = true;
  if(cfg.bfAnimate == null) cfg.bfAnimate = true;
  if(cfg.bfAnimationDuration == null) cfg.bfAnimationDuration = 600;
  if(cfg.bfFit == null) cfg.bfFit = true;
  if(cfg.bfPadding == null) cfg.bfPadding = 1000;
  if(cfg.bfNodeDimensionsIncludeLabels == null) cfg.bfNodeDimensionsIncludeLabels = false;

  // AIPP-specific post processing.
  if(cfg.tankRight == null) cfg.tankRight = true;
  if(cfg.includeWallsInAutoLayout == null) cfg.includeWallsInAutoLayout = true;
  if(cfg.wallYOffset == null) cfg.wallYOffset = 230;
  if(cfg.wallXSpread == null) cfg.wallXSpread = 115;
  if(cfg.tankRightMargin == null) cfg.tankRightMargin = 260;

  var originalApplyAippCytoscapeLayout = (typeof applyAippCytoscapeLayout === 'function') ? applyAippCytoscapeLayout : null;

  function getCy(){
    try{
      if(typeof cyPrototype !== 'undefined' && cyPrototype) return cyPrototype;
    }catch(e){}
    if(window.cyPrototype) return window.cyPrototype;
    return null;
  }

  function getAippTankNodeId(){
    try{
      var info = (typeof getAssemblyInfo === 'function') ? getAssemblyInfo(fullJson) : {assembly:null};
      var assembly = info && info.assembly;
      var tankId = null;

      if(assembly && assembly.tank_id != null) tankId = assembly.tank_id;
      else if(fullJson && fullJson.tank_id != null) tankId = fullJson.tank_id;
      else if(fullJson && fullJson.aipp_calculation && fullJson.aipp_calculation.tank_id != null) tankId = fullJson.aipp_calculation.tank_id;
      else if(fullJson && fullJson.aipp_calculation && fullJson.aipp_calculation.assembly && fullJson.aipp_calculation.assembly.tank_id != null) tankId = fullJson.aipp_calculation.assembly.tank_id;

      var n = parseInt(tankId, 10);
      if(Number.isFinite(n) && n > 0) return 'c' + n;
    }catch(e){
      console.warn('[AIPP GRAPH] Unable to determine tank_id:', e);
    }
    return null;
  }

  function getBreadthfirstRootsSelector(cy){
    var rootCfg = window.aippGraphLayoutConfig.bfRoots;
    if(rootCfg != null && rootCfg !== '') return rootCfg;

    var tankNodeId = getAippTankNodeId();
    if(tankNodeId && cy && cy.getElementById(tankNodeId).length) return '#' + tankNodeId;
    return undefined;
  }

  function overlaySync(delay){
    delay = delay || 0;
    setTimeout(function(){
      if(typeof scheduleCytoscapeOverlayUpdate === 'function') scheduleCytoscapeOverlayUpdate();
      else if(typeof updateCytoscapeOverlayPositions === 'function') updateCytoscapeOverlayPositions();
    }, delay);
  }

  function forceTankRight(cy, tankNodeId){
    if(!cy || !tankNodeId) return;
    var tank = cy.getElementById(tankNodeId);
    if(!tank || tank.empty || tank.empty()) return;

    var maxX = -Infinity;
    cy.nodes().forEach(function(n){
      var x = n.position('x');
      if(Number.isFinite(x) && x > maxX) maxX = x;
    });
    if(!Number.isFinite(maxX)) return;

    var margin = Number(window.aippGraphLayoutConfig.tankRightMargin) || 260;
    if(tank.position('x') < maxX - 1){
      tank.position({x: maxX + margin, y: tank.position('y')});
    }
  }

  function connectedChamberIdForWallNode(wallNode){
    try{
      var id = wallNode.id();
      var sim = (typeof simNodes !== 'undefined') ? simNodes.find(function(n){ return n.id === id; }) : null;
      var w = sim && sim.data ? sim.data : {};
      var ci = null;
      if(w.left_connection && w.left_connection.chamber_index != null) ci = w.left_connection.chamber_index;
      else if(w.right_connection && w.right_connection.chamber_index != null) ci = w.right_connection.chamber_index;
      ci = parseInt(ci, 10);
      if(Number.isFinite(ci) && ci > 0) return 'c' + ci;
    }catch(e){}
    return null;
  }

  function repositionWallsBelowChambers(cy){
    if(!cy || window.aippGraphLayoutConfig.includeWallsInAutoLayout) return;
    var walls = cy.nodes('[type = "wall"]');
    if(!walls || walls.length === 0) return;

    walls.forEach(function(wall, i){
      var chamberId = connectedChamberIdForWallNode(wall);
      var anchor = chamberId ? cy.getElementById(chamberId) : null;
      if(!anchor || anchor.empty || anchor.empty()) return;
      var p = anchor.position();
      var spread = Number(window.aippGraphLayoutConfig.wallXSpread) || 115;
      var yoff = Number(window.aippGraphLayoutConfig.wallYOffset) || 230;
      wall.position({
        x: p.x + ((i % 3) - 1) * spread,
        y: p.y + yoff + Math.floor(i / 3) * 55
      });
    });
  }

  function runBreadthfirstAutoLayout(anim){
    var cy = getCy();
    if(!cy){
      if(originalApplyAippCytoscapeLayout) return originalApplyAippCytoscapeLayout(anim);
      return;
    }

    var cfg = window.aippGraphLayoutConfig || {};
    var tankNodeId = getAippTankNodeId();
    var roots = getBreadthfirstRootsSelector(cy);
    var shouldAnimate = (cfg.bfAnimate !== false) && !!anim;

    var layoutOptions = {
      name: 'breadthfirst',
      roots: roots,
      avoidOverlap: cfg.bfAvoidOverlap !== false,
      directed: !!cfg.bfDirected,
      circle: !!cfg.bfCircle,
      grid: !!cfg.bfGrid,
      spacingFactor: Number(cfg.bfSpacingFactor) || 0.9,
      maximal: !!cfg.bfMaximal,
      fit: cfg.bfFit !== false,
      padding: Number(cfg.bfPadding) || 1000,
      animate: shouldAnimate,
      animationDuration: shouldAnimate ? (Number(cfg.bfAnimationDuration) || 600) : 0,
      nodeDimensionsIncludeLabels: !!cfg.bfNodeDimensionsIncludeLabels,
      direction: cfg.bfDirection || 'leftward',
      stop: function(){
        try{
          if(cfg.tankRight !== false) forceTankRight(cy, tankNodeId);
          repositionWallsBelowChambers(cy);
          if(cfg.bfFit !== false) cy.fit(cy.elements(), Number(cfg.bfPadding) || 1000);
        }catch(e){
          console.warn('[AIPP GRAPH] breadthfirst post-layout adjustment failed:', e);
        }
        overlaySync(0);
      }
    };

    try{
      var eles = cy.elements();
      if(cfg.includeWallsInAutoLayout === false){
        eles = cy.nodes().not('[type = "wall"]').union(cy.edges('[type = "flow"]'));
      }
      var layout = eles.layout(layoutOptions);
      layout.run();
      overlaySync(shouldAnimate ? (Number(cfg.bfAnimationDuration) || 600) + 40 : 90);
    }catch(e){
      console.warn('[AIPP GRAPH] breadthfirst layout failed; falling back to preset layout:', e);
      if(originalApplyAippCytoscapeLayout) originalApplyAippCytoscapeLayout(anim);
    }
  }

  window.setAippGraphLayoutMode = function(mode){
    window.aippGraphLayoutConfig.mode = mode || 'preset_manual';
    if(typeof setStatus === 'function') setStatus('Graph layout mode: ' + window.aippGraphLayoutConfig.mode, true);
  };

  window.applyAippBreadthfirstLayout = function(anim){
    window.aippGraphLayoutConfig.mode = 'breadthfirst_auto';
    runBreadthfirstAutoLayout(anim !== false);
  };

  window.applyAippPresetManualLayout = function(anim){
    window.aippGraphLayoutConfig.mode = 'preset_manual';
    if(originalApplyAippCytoscapeLayout) originalApplyAippCytoscapeLayout(anim !== false);
  };

  window.getAippBreadthfirstLayoutOptions = function(){
    var cfg = window.aippGraphLayoutConfig || {};
    return {
      bfRoots: cfg.bfRoots,
      bfAvoidOverlap: cfg.bfAvoidOverlap,
      bfDirected: cfg.bfDirected,
      bfCircle: cfg.bfCircle,
      bfGrid: cfg.bfGrid,
      bfSpacingFactor: cfg.bfSpacingFactor,
      bfMaximal: cfg.bfMaximal,
      bfDirection: cfg.bfDirection,
      bfFit: cfg.bfFit,
      bfPadding: cfg.bfPadding,
      bfAnimate: cfg.bfAnimate,
      bfAnimationDuration: cfg.bfAnimationDuration,
      bfNodeDimensionsIncludeLabels: cfg.bfNodeDimensionsIncludeLabels,
      includeWallsInAutoLayout: cfg.includeWallsInAutoLayout,
      tankRight: cfg.tankRight,
      tankRightMargin: cfg.tankRightMargin,
      wallYOffset: cfg.wallYOffset,
      wallXSpread: cfg.wallXSpread
    };
  };

  applyAippCytoscapeLayout = function(anim){
    if(window.aippGraphLayoutConfig && window.aippGraphLayoutConfig.mode === 'breadthfirst_auto'){
      return runBreadthfirstAutoLayout(anim);
    }
    if(originalApplyAippCytoscapeLayout) return originalApplyAippCytoscapeLayout(anim);
  };

  function installLayoutButtons(){
    var tools = document.querySelector('#vizHeader .vizHeaderTools') || document.getElementById('vizHeader');
    if(!tools || document.getElementById('graphLayoutModeBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'graphLayoutModeBtn';
    btn.className = 'smallBtn secondary';
    btn.textContent = 'Breadthfirst Layout';
    btn.title = 'Toggle tuned Cytoscape breadthfirst layout anchored by tank_id.';
    btn.onclick = function(){
      var current = window.aippGraphLayoutConfig.mode;
      if(current === 'breadthfirst_auto'){
        window.applyAippPresetManualLayout(true);
        btn.textContent = 'Breadthfirst Layout';
      }else{
        window.applyAippBreadthfirstLayout(true);
        btn.textContent = 'Manual Layout';
      }
    };
    tools.appendChild(btn);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installLayoutButtons);
  else installLayoutButtons();
  setTimeout(installLayoutButtons, 0);
})();

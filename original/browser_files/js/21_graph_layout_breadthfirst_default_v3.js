/* 21_graph_layout_breadthfirst_default_v3.js
   Default Cytoscape breadthfirst flow-chart layout.

   This module removes the user-facing manual/preset layout toggle. The app now defaults to
   breadthfirst_auto with Joseph-selected tuned settings. The original preset/manual layout is
   retained only as an internal fallback if Cytoscape breadthfirst fails.
*/
(function(){
  if(window.__aippGraphLayoutBreadthfirstDefaultV3Applied) return;
  window.__aippGraphLayoutBreadthfirstDefaultV3Applied = true;

  window.aippGraphLayoutConfig = window.aippGraphLayoutConfig || {};
  var cfg = window.aippGraphLayoutConfig;

  // New default: use the tuned Cytoscape breadthfirst layout.
  cfg.mode = 'breadthfirst_auto';
  cfg.autoLayout = 'breadthfirst';

  // Tuned breadthfirst layout defaults selected in JCEF testing.
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

  // AIPP-specific behavior.
  if(cfg.tankRight == null) cfg.tankRight = true;
  if(cfg.includeWallsInAutoLayout == null) cfg.includeWallsInAutoLayout = true;
  if(cfg.wallYOffset == null) cfg.wallYOffset = 230;
  if(cfg.wallXSpread == null) cfg.wallXSpread = 115;
  if(cfg.tankRightMargin == null) cfg.tankRightMargin = 260;

  var originalApplyAippCytoscapeLayout = (typeof applyAippCytoscapeLayout === 'function') ? applyAippCytoscapeLayout : null;

  function getCy(){
    try{ if(typeof cyPrototype !== 'undefined' && cyPrototype) return cyPrototype; }catch(e){}
    if(window.cyPrototype) return window.cyPrototype;
    return null;
  }

  function getAippTankNodeId(){
    try{
      var info = (typeof getAssemblyInfo === 'function') ? getAssemblyInfo(fullJson) : {assembly:null};
      var a = info && info.assembly;
      var tankId = null;
      if(a && a.tank_id != null) tankId = a.tank_id;
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
      tank.position({x:maxX + margin, y:tank.position('y')});
    }
  }

  function connectedChamberIdForWallNode(wallNode){
    try{
      var id = wallNode.id();
      var sim = (typeof simNodes !== 'undefined') ? simNodes.find(function(n){return n.id === id;}) : null;
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
      wall.position({x:p.x + ((i % 3) - 1) * spread, y:p.y + yoff + Math.floor(i / 3) * 55});
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
      console.warn('[AIPP GRAPH] breadthfirst layout failed; falling back to original preset/manual layout:', e);
      if(originalApplyAippCytoscapeLayout) originalApplyAippCytoscapeLayout(anim);
    }
  }

  // Public helpers retained for console tuning and rerunning layout.
  window.setAippGraphLayoutMode = function(mode){
    // Manual mode is no longer exposed in the UI, but this remains for debug/fallback.
    window.aippGraphLayoutConfig.mode = mode || 'breadthfirst_auto';
    if(typeof setStatus === 'function') setStatus('Graph layout mode: ' + window.aippGraphLayoutConfig.mode, true);
  };

  window.applyAippBreadthfirstLayout = function(anim){
    window.aippGraphLayoutConfig.mode = 'breadthfirst_auto';
    runBreadthfirstAutoLayout(anim !== false);
  };

  window.getAippBreadthfirstLayoutOptions = function(){
    var c = window.aippGraphLayoutConfig || {};
    return {
      bfRoots:c.bfRoots,
      bfAvoidOverlap:c.bfAvoidOverlap,
      bfDirected:c.bfDirected,
      bfCircle:c.bfCircle,
      bfGrid:c.bfGrid,
      bfSpacingFactor:c.bfSpacingFactor,
      bfMaximal:c.bfMaximal,
      bfDirection:c.bfDirection,
      bfFit:c.bfFit,
      bfPadding:c.bfPadding,
      bfAnimate:c.bfAnimate,
      bfAnimationDuration:c.bfAnimationDuration,
      bfNodeDimensionsIncludeLabels:c.bfNodeDimensionsIncludeLabels,
      includeWallsInAutoLayout:c.includeWallsInAutoLayout,
      tankRight:c.tankRight,
      tankRightMargin:c.tankRightMargin,
      wallYOffset:c.wallYOffset,
      wallXSpread:c.wallXSpread
    };
  };

  // Override existing Auto Layout handler. It now always uses tuned breadthfirst unless debug mode is manually set otherwise.
  applyAippCytoscapeLayout = function(anim){
    if(window.aippGraphLayoutConfig && window.aippGraphLayoutConfig.mode === 'preset_manual'){
      // Debug-only fallback path. No UI button exposes this mode.
      if(originalApplyAippCytoscapeLayout) return originalApplyAippCytoscapeLayout(anim);
    }
    return runBreadthfirstAutoLayout(anim);
  };
})();

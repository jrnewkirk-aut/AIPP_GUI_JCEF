"use strict";
window.P3={version:"0.2",metrics:[],state:{dataset:null,viewport:null},cache:new Map(),cacheHits:0,cacheMisses:0};
P3.PlotAdapter=class PlotAdapter{initialize(){throw new Error("initialize not implemented");}setSeries(){throw new Error("setSeries not implemented");}setViewport(){throw new Error("setViewport not implemented");}updateSeries(){throw new Error("updateSeries not implemented");}resize(){throw new Error("resize not implemented");}getMetrics(){return{};}destroy(){}};

/* ============================================================
   App state
   ============================================================ */
let fullJson = null;
let currentTab = "tree";

let treeOpenAll = false;
let treeUserOpen = new Set();   // remember open paths when not global expand

// visualization state
let simNodes = []; // {id,type,label,x,y,fx,fy,data}
let simEdges = []; // {a,b,type,label}
let raf = null;

// popup state
let popupNode = null;
let popupWorkingCopy = null;
let popupOriginalCopy = null;

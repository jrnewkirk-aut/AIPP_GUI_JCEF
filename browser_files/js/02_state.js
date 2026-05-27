/* ============================================================
   App state
   ============================================================ */
let fullJson = null;
let currentTab = "tree";
let treeOpenAll = false;
let treeUserOpen = new Set();

// Code editor state. The textarea may contain unapplied edits.
let codeEditorDirty = false;
let lastValidCodeText = "";

// Visualization state
let simNodes = [];
let simEdges = [];
let raf = null;

// Popup state
let popupNode = null;
let popupPath = null;
let popupWorkingCopy = null;
let popupOriginalCopy = null;

// Overall model state
let jsonDirty = false;

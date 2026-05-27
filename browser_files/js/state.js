var state = {
  fullJson: null,
  currentTab: "tree",

  treeOpenAll: false,
  treeUserOpen: new Set(),

  simNodes: [],
  simEdges: [],

  popupNode: null,
  popupWorkingCopy: null,
  popupOriginalCopy: null
};
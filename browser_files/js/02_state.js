let fullJson=null,currentTab="tree",treeOpenAll=false,treeUserOpen=new Set(),selectedJsonPath=null;
let codeEditorDirty=false,lastValidCodeText="";
let simNodes=[],simEdges=[],raf=null;
let popupNode=null,popupPath=null,popupWorkingCopy=null,popupOriginalCopy=null;
let pendingCdCsvImport=null;
let jsonDirty=false;

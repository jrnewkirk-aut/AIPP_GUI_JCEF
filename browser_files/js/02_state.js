let fullJson=null,currentTab="tree",treeOpenAll=false,treeUserOpen=new Set();
let simNodes=[],simEdges=[],popupNode=null,popupPath=null,popupWorkingCopy=null,popupOriginalCopy=null,pendingCdCsvImport=null;
let flowViewBox={x:0,y:0,w:1000,h:700,base:null},flowPan={active:false,x:0,y:0,start:null};
let popupDrag={active:false,dx:0,dy:0};

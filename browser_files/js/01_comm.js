/* ============================================================
   Scilab comm
   ============================================================ */
function toScilabMsg(obj){
  const s = JSON.stringify(obj);
  window.toScilab(s);
}
function selectFile(){
  toScilabMsg({type:"select_file"});
}
function asciiToString(arr){
  return arr.map(c => String.fromCharCode(c)).join('');
}

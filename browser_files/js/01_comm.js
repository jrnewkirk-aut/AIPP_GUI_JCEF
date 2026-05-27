function toScilabMsg(obj){window.toScilab(JSON.stringify(obj));}
function selectFile(){toScilabMsg({type:"select_file"});}
function selectCsvFile(){toScilabMsg({type:"select_csv"});}
function asciiToString(arr){return arr.map(c=>String.fromCharCode(c)).join('');}

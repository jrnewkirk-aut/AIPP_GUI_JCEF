"use strict";
(function(root){
  const P7=root.P7;
  function constructorName(value){return value&&value.constructor&&value.constructor.name?value.constructor.name:typeof value;}
  function isNumericKeyedObject(value){if(!value||typeof value!=="object"||Array.isArray(value))return false;const keys=Object.keys(value);return keys.length>0&&keys.every((key,index)=>String(index)===key);}
  function sampleArray(value,limit){const count=value.length>>>0;const indexes=[];if(count){indexes.push(0);if(count>2)indexes.push(Math.floor(count/2));if(count>1)indexes.push(count-1);}return indexes.slice(0,limit).map(index=>({index,value:Number(value[index])}));}
  function fnv1aText(text){let hash=2166136261;for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16).padStart(8,"0");}
  function safeText(text,maxChars){const value=String(text),truncated=value.length>maxChars;return {length:value.length,sample:truncated?value.slice(0,maxChars):value,truncated,hash_fnv1a32:fnv1aText(value)};}
  function summarize(value,options={}){
    const sampleItems=Number.isInteger(options.sampleItems)?options.sampleItems:P7.limits.payloadSampleItems;
    const sampleChars=Number.isInteger(options.sampleChars)?options.sampleChars:P7.limits.payloadSampleChars;
    if(value===null)return {kind:"null"};
    if(value===undefined)return {kind:"undefined"};
    const type=typeof value;
    if(type==="string")return {kind:"string",...safeText(value,sampleChars)};
    if(type==="number"||type==="boolean")return {kind:type,value};
    if(Array.isArray(value)||ArrayBuffer.isView(value)){
      const count=value.length>>>0;return {kind:"numeric_array",constructor:constructorName(value),count,estimated_bytes:count*(value.BYTES_PER_ELEMENT||8),sample:sampleArray(value,sampleItems),full_payload_logged:false};
    }
    if(isNumericKeyedObject(value)){
      const count=Object.keys(value).length;return {kind:"numeric_keyed_object",constructor:constructorName(value),count,estimated_bytes:count*8,sample:sampleArray(value,sampleItems),full_payload_logged:false};
    }
    if(type==="object"){
      const keys=Object.keys(value),summary={kind:"object",constructor:constructorName(value),field_count:keys.length,fields:keys.slice(0,20),truncated_fields:keys.length>20,full_payload_logged:false};
      for(const name of ["type","status","protocol","protocol_version","request_id","transfer_id"]){if(Object.prototype.hasOwnProperty.call(value,name)&&["string","number","boolean"].includes(typeof value[name]))summary[name]=value[name];}
      return summary;
    }
    return {kind:type,constructor:constructorName(value),sample:safeText(String(value),sampleChars),full_payload_logged:false};
  }
  P7.payloadSummary={summarize,fnv1aText};
})(window);

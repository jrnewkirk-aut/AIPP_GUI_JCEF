"use strict";
(function(root){
  const P7=root.P7;
  function cleanId(value){return value===undefined||value===null||value===""?null:String(value);}
  function validate(record){const errors=[];if(!record||typeof record!=="object")return {pass:false,errors:["record must be an object"]};if(typeof record.timestamp!=="string"||!record.timestamp)errors.push("timestamp is required");if(!["browser","scilab"].includes(record.runtime))errors.push("runtime must be browser or scilab");if(!P7.levels.includes(record.level))errors.push("invalid level");if(!P7.categories.includes(record.category))errors.push("invalid category");if(typeof record.event!=="string"||!record.event)errors.push("event is required");if(record.details===null||typeof record.details!=="object"||Array.isArray(record.details))errors.push("details must be an object");return {pass:errors.length===0,errors};}
  function create(level,category,event,context={},details={}){const record={schema_version:P7.observabilityVersion,timestamp:new Date().toISOString(),runtime:"browser",level,category,event,request_id:cleanId(context.requestId??context.request_id),transfer_id:cleanId(context.transferId??context.transfer_id),details:details&&typeof details==="object"&&!Array.isArray(details)?details:{value:details}};const result=validate(record);if(!result.pass)throw new Error(`Invalid observability record: ${result.errors.join("; ")}`);return record;}
  P7.record={create,validate};
})(window);

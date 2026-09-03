"use strict";
P2.validation = {
  envelope(message){const errors=[];if(!message||typeof message!=="object"||Array.isArray(message))errors.push("message must be an object");else{if(message.protocol!==P2.protocolName)errors.push("invalid protocol");if(message.protocol_version!==P2.protocolVersion)errors.push("unsupported protocol version");if(typeof message.type!=="string"||!message.type)errors.push("type is required");if(typeof message.request_id!=="string"||!message.request_id)errors.push("request_id is required");}return{pass:errors.length===0,errors};},
  response(response,requestId){const v=this.envelope(response);if(!v.pass)return v;if(response.request_id!==requestId)return{pass:false,errors:[`request_id mismatch ${response.request_id}`]};return{pass:true,errors:[]};}
};

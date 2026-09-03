"use strict";
P2.RequestRegistry = class RequestRegistry {
  constructor(){this.requests=new Map();}
  register(state){if(this.requests.has(state.requestId))throw new P2.ProtocolError("DUPLICATE_REQUEST_ID",`Duplicate request ID: ${state.requestId}`);this.requests.set(state.requestId,state);P7.performance?.gauge("request.pending.count",this.requests.size,"count",{request_id:state.requestId});}
  get(id){return this.requests.get(id);}
  settle(id,outcome){const s=this.requests.get(id);if(!s||s.settled)return false;s.settled=true;clearTimeout(s.timer);this.requests.delete(id);P7.performance?.gauge("request.pending.count",this.requests.size,"count",{request_id:id});if(!outcome.ok){const code=outcome.error?.code||outcome.error?.name||"REQUEST_FAILED";if(code==="REQUEST_CANCELLED")P7.performance?.increment("request.cancelled.count",1,{request_id:id},{error_code:code});else if(code==="REQUEST_TIMEOUT"||code==="TimeoutError"||code==="TIMEOUT")P7.performance?.increment("request.timed_out.count",1,{request_id:id},{error_code:code});else P7.performance?.increment("request.failed.count",1,{request_id:id},{error_code:code});}outcome.ok?s.resolve(outcome.value):s.reject(outcome.error);return true;}
  cancel(id,reason="cancelled"){return this.settle(id,{ok:false,error:new P2.ProtocolError("REQUEST_CANCELLED",reason,{requestId:id})});}
  get size(){return this.requests.size;}
};
P2.requests=new P2.RequestRegistry();

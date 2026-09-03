"use strict";
P2.TransferHandle=class TransferHandle{
 constructor(state){this.state=state;this.listeners=new Map();this.events=[];}
 get transferId(){return this.state.transferId;}get viewportId(){return this.state.viewportId;}get promise(){return this.state.promise;}get status(){return this.state.status;}
 on(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);return()=>this.off(type,listener);}
 onProgress(listener){return this.on("progress",listener);}onStateChanged(listener){return this.on("state",listener);}
 off(type,listener){const set=this.listeners.get(type);if(!set)return false;const result=set.delete(listener);if(set.size===0)this.listeners.delete(type);return result;}
 emit(type,payload={}){const event={type,transferId:this.transferId,viewportId:this.viewportId,timestamp:performance.now(),...payload};this.events.push(event);for(const listener of this.listeners.get(type)||[]){try{listener(event);}catch(error){P2.ui.log(`Transfer listener error: ${error.message}`);}}return event;}
 listenerCount(){let n=0;for(const set of this.listeners.values())n+=set.size;return n;}
 clearListeners(){this.listeners.clear();}
 cancel(reason="cancelled"){return P2.numeric.cancel(this.state,reason);}
 snapshot(){return{transferId:this.transferId,viewportId:this.viewportId,status:this.status,received:this.state.received.size,committed:this.state.committed.size,batchCount:this.state.batchCount,duplicates:this.state.duplicates,stale:this.state.stale};}
};

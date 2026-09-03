"use strict";
P2.router = { handlers:new Map(), register(type,handler){if(this.handlers.has(type))throw new P2.ProtocolError("DUPLICATE_HANDLER",type);this.handlers.set(type,handler);}, route(message){const h=this.handlers.get(message.type);if(!h)return false;h(message);return true;} };

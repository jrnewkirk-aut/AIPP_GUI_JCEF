"use strict";
P2.application=P2.application||{};P2.application.registry={services:new Map(),register(name,service){if(this.services.has(name))throw new P2.ProtocolError("DUPLICATE_APPLICATION_SERVICE",name);this.services.set(name,service);P2.application[name]=service;},has(name){return this.services.has(name);}};

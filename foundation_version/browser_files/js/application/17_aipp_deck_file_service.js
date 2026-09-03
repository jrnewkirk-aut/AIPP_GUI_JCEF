"use strict";
(function(){
 const NATIVE_DIALOG_TIMEOUT_MS=3600000;
 function request(type,payload){return P2.client.request(type,payload||{},{timeoutMs:NATIVE_DIALOG_TIMEOUT_MS});}
 P2.application.registry.register("aippDeckFiles",{
  open(){return request("application.aipp.deck.open.request",{});},
  save(deckJson,name,path,saveAs){return request("application.aipp.deck.save.request",{deck_json:String(deckJson),suggested_name:String(name||"untitled.json"),path:String(path||""),save_as:!!saveAs});}
 });
})();

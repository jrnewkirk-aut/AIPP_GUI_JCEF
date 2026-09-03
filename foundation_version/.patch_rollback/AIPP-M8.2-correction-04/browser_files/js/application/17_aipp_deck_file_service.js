"use strict";
(function(){
 function request(type,payload){return P2.client.request(type,payload||{});}
 P2.application.registry.register("aippDeckFiles",{
  open(){return request("application.aipp.deck.open.request",{});},
  save(deckJson,name,path,saveAs){return request("application.aipp.deck.save.request",{deck_json:String(deckJson),suggested_name:String(name||"untitled.json"),path:String(path||""),save_as:!!saveAs});}
 });
})();

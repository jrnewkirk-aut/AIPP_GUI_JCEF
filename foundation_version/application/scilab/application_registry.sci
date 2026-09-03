function p55ApplicationRegistryReset()
 global P55_APP_ROUTE_TYPES P55_APP_ROUTE_HANDLERS;P55_APP_ROUTE_TYPES=[];P55_APP_ROUTE_HANDLERS=[];
endfunction
function p55RegisterApplicationRoute(messageType,handlerName)
 global P55_APP_ROUTE_TYPES P55_APP_ROUTE_HANDLERS;if find(P55_APP_ROUTE_TYPES==messageType)<>[] then error("DUPLICATE_APPLICATION_ROUTE: "+messageType);end;if P55_APP_ROUTE_TYPES==[] then P55_APP_ROUTE_TYPES=messageType;P55_APP_ROUTE_HANDLERS=handlerName;else P55_APP_ROUTE_TYPES($+1)=messageType;P55_APP_ROUTE_HANDLERS($+1)=handlerName;end
endfunction
function p55RegisterReferenceApplication()
 p55ApplicationRegistryReset();
 p55RegisterApplicationRoute("application.example.ping.request","p55HandleReferencePing");
 p55RegisterApplicationRoute("application.example.sum.request","p56HandleReferenceSum");
 p55RegisterApplicationRoute("application.aipp.status.request","pAippHandleStatus");
 p55RegisterApplicationRoute("application.aipp.pyrolist.request","pAippHandlePyrolist");
 p55RegisterApplicationRoute("application.aipp.materials.request","pAippHandleMaterials");
 p55RegisterApplicationRoute("application.aipp.deck.open.request","pAippHandleDeckOpen");
 p55RegisterApplicationRoute("application.aipp.deck.save.request","pAippHandleDeckSave");
p55RegisterApplicationRoute("application.aipp.runtime.bridge.request","pAippHandleRuntimeBridge");
 p55InitializeApplicationState();
endfunction
function [handled,response]=p55RouteApplicationMessage(message)
 global P55_APP_ROUTE_TYPES P55_APP_ROUTE_HANDLERS;handled=%f;response=[];idx=find(P55_APP_ROUTE_TYPES==message.type);if idx==[] then return;end;handled=%t;response=evstr(P55_APP_ROUTE_HANDLERS(idx(1))+"(message)");
endfunction

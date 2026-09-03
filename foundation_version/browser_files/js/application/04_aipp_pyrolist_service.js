"use strict";
(function(){
 function request(options){const include=!(options&&options.includeFormulations===false);return P2.client.request("application.aipp.pyrolist.request",{include_formulations:include});}
 P2.application.registry.register("aippPyrolist",request);
})();

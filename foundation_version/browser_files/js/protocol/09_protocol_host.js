"use strict";
function fromScilab(data){
  if(P2.codec.looksLikeControl(data)){const message=P2.codec.decode(data);if(P2.numeric&&P2.numeric.handleControl(message))return;if(message.type==="protocol.host_ready"){P2.hostReady=true;P2.hostVersion=message.payload?.scilab_version||"unknown";P2.ui.ready(P2.hostVersion);return;}if(P2.router.route(message))return;}
  if(P2.numeric&&P2.numeric.handleData(data))return;
  P2.ui.log("Unclaimed host data received.");
}

(function(){let marked=false;const timer=setInterval(()=>{if(!marked&&P2.hostReady){marked=true;P7.startup?.markHostReady?.();clearInterval(timer);}},25);setTimeout(()=>clearInterval(timer),30000);})();

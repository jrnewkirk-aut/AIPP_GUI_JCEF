"use strict";
P2.transport = {
  call(payload,timeoutMs=P2.constants.defaultTimeoutMs){return new Promise((resolve,reject)=>{let done=false;const timer=setTimeout(()=>{if(!done){done=true;reject(new Error(`Bridge timeout after ${timeoutMs} ms`));}},timeoutMs);try{if(typeof window.toScilab!=="function")throw new Error("JCEF bridge is unavailable");window.toScilab(payload,response=>{if(done)return;done=true;clearTimeout(timer);resolve(response);});}catch(error){if(!done){done=true;clearTimeout(timer);reject(error);}}});}
};

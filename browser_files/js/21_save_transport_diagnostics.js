/* 21_save_transport_diagnostics.js
   Patch 3B - Browser -> Scilab ASCII payload-size diagnostics.
*/
(function(){
  if(window.__aippSaveTransportDiagnosticsPatch3BApplied) return;
  window.__aippSaveTransportDiagnosticsPatch3BApplied = true;

  function makePayload(n, value){
    n = Math.max(0, Number(n) || 0);
    value = Number(value);
    if(!Number.isFinite(value)) value = 65;
    var data = [];
    for(var i = 0; i < n; i++) data.push(value);
    return data;
  }

  window.aippTestToScilabAsciiPayloadSize = function(n){
    var data = makePayload(n, 65);
    var msg = { type: 'debug_payload', requested_size: Number(n) || 0, data: data };
    console.log('[AIPP 3B] Sending debug_payload with data length:', data.length);
    if(typeof toScilabAsciiMsg !== 'function'){
      console.error('[AIPP 3B] toScilabAsciiMsg is not available. Patch 3A is required.');
      return;
    }
    toScilabAsciiMsg(msg);
    if(typeof setStatus === 'function') setStatus('Sent debug payload size '+data.length+' to Scilab.', true);
  };

  window.aippRunPayloadSizeSweep = function(sizes, delayMs){
    sizes = Array.isArray(sizes) ? sizes : [100, 250, 500, 1000, 1200, 1500, 1700];
    delayMs = Number(delayMs);
    if(!Number.isFinite(delayMs) || delayMs < 0) delayMs = 750;
    var i = 0;
    function next(){
      if(i >= sizes.length){ console.log('[AIPP 3B] Payload size sweep complete.'); return; }
      var n = sizes[i++];
      console.log('[AIPP 3B] Sweep sending size:', n);
      window.aippTestToScilabAsciiPayloadSize(n);
      setTimeout(next, delayMs);
    }
    next();
  };
})();

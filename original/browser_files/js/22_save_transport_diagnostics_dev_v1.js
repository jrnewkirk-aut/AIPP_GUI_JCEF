/* 21_save_transport_diagnostics_dev_v1.js
   Optional development-only diagnostics.

   To enable: copy this file into browser_files/js/ and rebuild the bundle.
*/
(function(){
  if(window.__aippSaveTransportDiagnosticsDevV1Applied) return;
  window.__aippSaveTransportDiagnosticsDevV1Applied = true;

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
    console.log('[AIPP DIAG] Sending debug_payload with data length:', data.length);
    if(typeof toScilabAsciiMsg !== 'function'){
      console.error('[AIPP DIAG] toScilabAsciiMsg is not available.');
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
      if(i >= sizes.length){ console.log('[AIPP DIAG] Payload size sweep complete.'); return; }
      var n = sizes[i++];
      window.aippTestToScilabAsciiPayloadSize(n);
      setTimeout(next, delayMs);
    }
    next();
  };
})();
/* 19_scilab_2025_quote_transport_v1.js
   Patch 2A - Browser receive compatibility decoder.

   Purpose:
   - Preserve existing browser message handlers.
   - Add support for future Scilab -> browser direct ASCII-array messages.
   - Continue to support existing JSON-string envelopes, quote-token envelopes, and AIPP_ASCII frames.

   This patch intentionally does NOT change browser -> Scilab sending.
*/
(function(){
  if(window.__aippScilab2025QuoteTransportV1Patch2AApplied) return;
  window.__aippScilab2025QuoteTransportV1Patch2AApplied = true;

  function aippAsciiArrayToString(a){
    if(!Array.isArray(a)) return '';
    var out = '';
    for(var i=0;i<a.length;i++) out += String.fromCharCode(Number(a[i]));
    return out;
  }

  function aippDecodeScilabTransportPayload(payload){
    if(Array.isArray(payload)){
      return JSON.parse(aippAsciiArrayToString(payload));
    }

    if(payload && typeof payload === 'object' && typeof payload.length === 'number' && !payload.type){
      try{
        var arr = Array.prototype.slice.call(payload).map(Number);
        if(arr.length && arr.every(Number.isFinite)) return JSON.parse(aippAsciiArrayToString(arr));
      }catch(e){}
    }

    if(payload && typeof payload === 'object'){
      return payload;
    }

    if(typeof payload === 'string'){
      var txt = payload;
      if(txt.indexOf('<-quote->') >= 0){
        txt = txt.replaceAll('<-quote->', '"');
        window.AIPP_SCILAB_QUOTE_TOKEN_MODE = true;
      }
      if(txt.indexOf('AIPP_ASCII:') === 0){
        var body = txt.substring('AIPP_ASCII:'.length);
        var nums = body.split(',').map(function(x){ return Number(x); }).filter(Number.isFinite);
        txt = aippAsciiArrayToString(nums);
      }
      return JSON.parse(txt);
    }

    throw new Error('Unsupported Scilab transport payload type: ' + typeof payload);
  }

  function aippDispatchDecodedScilabMessage(o, originalPayload){
    if(o && o.type === 'save_json_success'){
      if(typeof setStatus === 'function') setStatus('Saved JSON: ' + (o.path || o.file || 'selected file'), true);
      return;
    }
    if(o && o.type === 'save_json_error'){
      var msg = o.message || 'unknown error';
      if(typeof setStatus === 'function') setStatus('Save JSON failed: ' + msg, false);
      if(window.alert) window.alert('Save JSON failed: ' + msg);
      return;
    }
    if(o && o.type === 'save_json_cancelled'){
      if(typeof setStatus === 'function') setStatus('Save JSON cancelled.', true);
      return;
    }

    if(typeof window.__aippOriginalFromScilabBeforeTransportPatch2A === 'function'){
      return window.__aippOriginalFromScilabBeforeTransportPatch2A(originalPayload);
    }

    if(o && o.type === 'json_ascii'){
      var jsonText = (typeof asciiToString === 'function') ? asciiToString(o.data) : aippAsciiArrayToString(o.data || []);
      fullJson = JSON.parse(jsonText);
      if(typeof refreshAllViews === 'function') refreshAllViews();
      if(typeof setStatus === 'function') setStatus('JSON loaded.', true);
      return;
    }
    if(o && o.type === 'csv_ascii'){
      if(typeof handleCsvAsciiMessage === 'function') return handleCsvAsciiMessage(o);
      console.warn('[AIPP RX] csv_ascii received but no handler was found.', o);
      return;
    }
    if(o && o.type === 'pyrolist_ascii'){
      var pyroText = (typeof asciiToString === 'function') ? asciiToString(o.data) : aippAsciiArrayToString(o.data || []);
      if(typeof loadPyroListFromText === 'function') loadPyroListFromText(pyroText);
      else console.warn('[AIPP RX] pyrolist_ascii received but loadPyroListFromText was not found.');
      return;
    }
    if(o && o.type === 'pyrolist_error'){
      if(typeof setStatus === 'function') setStatus(o.message || 'Pyrolist load error.', false);
      return;
    }

    console.warn('[AIPP RX] Unhandled decoded Scilab message:', o);
  }

  if(!window.__aippOriginalFromScilabBeforeTransportPatch2A && typeof window.fromScilab === 'function'){
    window.__aippOriginalFromScilabBeforeTransportPatch2A = window.fromScilab;
  }

  window.aippDecodeScilabTransportPayload = aippDecodeScilabTransportPayload;

  window.fromScilab = function(payload){
    var decoded;
    try{
      decoded = aippDecodeScilabTransportPayload(payload);
    }catch(e){
      console.error('[AIPP RX] Failed to decode Scilab payload:', e, payload);
      if(typeof window.__aippOriginalFromScilabBeforeTransportPatch2A === 'function'){
        return window.__aippOriginalFromScilabBeforeTransportPatch2A(payload);
      }
      return;
    }

    if(typeof window.__aippOriginalFromScilabBeforeTransportPatch2A === 'function'){
      return aippDispatchDecodedScilabMessage(decoded, JSON.stringify(decoded));
    }
    return aippDispatchDecodedScilabMessage(decoded, payload);
  };
})();

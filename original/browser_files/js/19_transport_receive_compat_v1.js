/* 19_transport_receive_compat_v1.js
   Browser receive compatibility and transport config handler.
*/
(function(){
  if(window.__aippTransportReceiveCompatV1Applied) return;
  window.__aippTransportReceiveCompatV1Applied = true;

  function aippAsciiArrayToString(a){
    if(!Array.isArray(a)) return '';
    var out = '';
    for(var i=0;i<a.length;i++) out += String.fromCharCode(Number(a[i]));
    return out;
  }

  function aippApplyTransportConfig(o){
    window.aippTransportConfig = window.aippTransportConfig || {};
    window.aippSaveTransportConfig = window.aippSaveTransportConfig || {};

    window.aippTransportConfig.scilab_version = o.scilab_version || 'unknown';
    window.aippTransportConfig.raw = o;

    if(o.save_transport){
      window.aippSaveTransportConfig.mode = o.save_transport;
    }
    if(o.save_chunk_size){
      window.aippSaveTransportConfig.chunk_size = Number(o.save_chunk_size) || 1200;
    }
    if(o.save_chunk_delay_ms != null){
      window.aippSaveTransportConfig.chunk_delay_ms = Number(o.save_chunk_delay_ms);
    }

    console.log('[AIPP TRANSPORT] Applied transport config:', window.aippSaveTransportConfig);
    if(typeof setStatus === 'function'){
      setStatus('Transport configured: save=' + (window.aippSaveTransportConfig.mode || 'default'), true);
    }
  }

  function aippDecodeScilabTransportPayload(payload){
    if(Array.isArray(payload)) return JSON.parse(aippAsciiArrayToString(payload));
    if(payload && typeof payload === 'object' && typeof payload.length === 'number' && !payload.type){
      try{
        var arr = Array.prototype.slice.call(payload).map(Number);
        if(arr.length && arr.every(Number.isFinite)) return JSON.parse(aippAsciiArrayToString(arr));
      }catch(e){}
    }
    if(payload && typeof payload === 'object') return payload;
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
    if(o && o.type === 'transport_config'){
      aippApplyTransportConfig(o);
      return;
    }
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
    if(typeof window.__aippOriginalFromScilabBeforeTransportCompat === 'function'){
      return window.__aippOriginalFromScilabBeforeTransportCompat(originalPayload);
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

  if(!window.__aippOriginalFromScilabBeforeTransportCompat && typeof window.fromScilab === 'function'){
    window.__aippOriginalFromScilabBeforeTransportCompat = window.fromScilab;
  }
  window.aippDecodeScilabTransportPayload = aippDecodeScilabTransportPayload;
  window.aippApplyTransportConfig = aippApplyTransportConfig;

  window.fromScilab = function(payload){
    var decoded;
    try{ decoded = aippDecodeScilabTransportPayload(payload); }
    catch(e){
      console.error('[AIPP RX] Failed to decode Scilab payload:', e, payload);
      if(typeof window.__aippOriginalFromScilabBeforeTransportCompat === 'function') return window.__aippOriginalFromScilabBeforeTransportCompat(payload);
      return;
    }
    if(typeof window.__aippOriginalFromScilabBeforeTransportCompat === 'function') return aippDispatchDecodedScilabMessage(decoded, JSON.stringify(decoded));
    return aippDispatchDecodedScilabMessage(decoded, payload);
  };
})();

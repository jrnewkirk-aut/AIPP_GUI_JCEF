/* 20_save_json_transport_v1.js
   Modular Save JSON transport.

   Config is supplied by Scilab via transport_config on browser load:
   - Scilab 2025.1.0 => chunked, chunk_size 1200
   - newer Scilab => direct_ascii

   Safe fallback before config arrives is chunked.
*/
(function(){
  if(window.__aippSaveJsonTransportV1Applied) return;
  window.__aippSaveJsonTransportV1Applied = true;

  window.aippSaveTransportConfig = window.aippSaveTransportConfig || {};
  if(!window.aippSaveTransportConfig.mode) window.aippSaveTransportConfig.mode = 'chunked';
  if(!window.aippSaveTransportConfig.chunk_size) window.aippSaveTransportConfig.chunk_size = 1200;
  if(window.aippSaveTransportConfig.chunk_delay_ms == null) window.aippSaveTransportConfig.chunk_delay_ms = 5;

  function stringToAsciiArrayForSaveTransport(s){
    s = String(s == null ? '' : s);
    var out = [];
    for(var i=0; i<s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function aippSendDirectSaveJson(jsonText, suggestedName){
    var msg = {
      type: 'save_json_ascii',
      data: stringToAsciiArrayForSaveTransport(jsonText),
      suggested_name: suggestedName || 'aipp_input_updated.json'
    };
    toScilabAsciiMsg(msg);
  }

  function aippSendChunkedSaveJson(jsonText, suggestedName){
    var chunkSize = Number(window.aippSaveTransportConfig.chunk_size) || 1200;
    var delayMs = Number(window.aippSaveTransportConfig.chunk_delay_ms);
    if(!Number.isFinite(delayMs) || delayMs < 0) delayMs = 5;

    jsonText = String(jsonText == null ? '' : jsonText);
    suggestedName = suggestedName || 'aipp_input_updated.json';

    var transferId = 'save_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    var totalChunks = Math.max(1, Math.ceil(jsonText.length / chunkSize));

    toScilabAsciiMsg({
      type: 'save_json_begin',
      transfer_id: transferId,
      total_chars: jsonText.length,
      total_chunks: totalChunks,
      suggested_name: suggestedName,
      chunk_size: chunkSize
    });

    var chunkIndex = 1;
    function sendNextChunk(){
      if(chunkIndex > totalChunks){
        toScilabAsciiMsg({type: 'save_json_end', transfer_id: transferId});
        if(typeof setStatus === 'function') setStatus('Chunked save transfer complete. Choose output file in Scilab dialog.', true);
        return;
      }
      var start = (chunkIndex - 1) * chunkSize;
      var chunkText = jsonText.slice(start, start + chunkSize);
      toScilabAsciiMsg({
        type: 'save_json_chunk',
        transfer_id: transferId,
        chunk_index: chunkIndex,
        total_chunks: totalChunks,
        data: stringToAsciiArrayForSaveTransport(chunkText)
      });
      chunkIndex++;
      setTimeout(sendNextChunk, delayMs);
    }
    setTimeout(sendNextChunk, delayMs);
  }

  window.aippSendSaveJsonRequest = function(jsonText, suggestedName){
    var mode = (window.aippSaveTransportConfig && window.aippSaveTransportConfig.mode) || 'chunked';
    if(mode === 'direct_ascii') return aippSendDirectSaveJson(jsonText, suggestedName);
    return aippSendChunkedSaveJson(jsonText, suggestedName);
  };
})();

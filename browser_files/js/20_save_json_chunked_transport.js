/* 20_save_json_chunked_transport.js
   Patch 3C - Modular chunked Save JSON transport.

   Default mode is chunked with max JSON text chunk size 1200 characters.
   To force direct ASCII mode in newer Scilab versions, set before saving:
     window.aippSaveTransportConfig.mode = 'direct_ascii';
*/
(function(){
  if(window.__aippSaveJsonChunkedTransportPatch3CApplied) return;
  window.__aippSaveJsonChunkedTransportPatch3CApplied = true;

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

    var beginMsg = {
      type: 'save_json_begin',
      transfer_id: transferId,
      total_chars: jsonText.length,
      total_chunks: totalChunks,
      suggested_name: suggestedName,
      chunk_size: chunkSize
    };

    console.log('[AIPP SAVE] chunked save begin', beginMsg);
    toScilabAsciiMsg(beginMsg);

    var chunkIndex = 1;
    function sendNextChunk(){
      if(chunkIndex > totalChunks){
        var endMsg = {
          type: 'save_json_end',
          transfer_id: transferId
        };
        console.log('[AIPP SAVE] chunked save end', endMsg);
        toScilabAsciiMsg(endMsg);
        if(typeof setStatus === 'function') setStatus('Chunked save transfer complete. Choose output file in Scilab dialog.', true);
        return;
      }

      var start = (chunkIndex - 1) * chunkSize;
      var chunkText = jsonText.slice(start, start + chunkSize);
      var chunkMsg = {
        type: 'save_json_chunk',
        transfer_id: transferId,
        chunk_index: chunkIndex,
        total_chunks: totalChunks,
        data: stringToAsciiArrayForSaveTransport(chunkText)
      };

      console.log('[AIPP SAVE] sending chunk', chunkIndex, 'of', totalChunks, 'chars', chunkText.length);
      toScilabAsciiMsg(chunkMsg);
      chunkIndex++;
      setTimeout(sendNextChunk, delayMs);
    }

    setTimeout(sendNextChunk, delayMs);
  }

  window.aippSendSaveJsonRequest = function(jsonText, suggestedName){
    var mode = (window.aippSaveTransportConfig && window.aippSaveTransportConfig.mode) || 'chunked';
    if(mode === 'direct_ascii'){
      return aippSendDirectSaveJson(jsonText, suggestedName);
    }
    return aippSendChunkedSaveJson(jsonText, suggestedName);
  };
})();

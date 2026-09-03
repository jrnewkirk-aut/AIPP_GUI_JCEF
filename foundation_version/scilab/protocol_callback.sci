function protocolCallback(data, cb)
    global P2_PROTOCOL_NAME;
    global P2_PROTOCOL_VERSION;
    global P2_MIN_PROTOCOL_VERSION;
    global P2_MAX_PROTOCOL_VERSION;
    if isempty(data) then return; end
    if typeof(data) == "string" & size(data, "*") == 1 & data == "loaded" then
        ready = struct("protocol", P2_PROTOCOL_NAME, ...
                       "protocol_version", P2_PROTOCOL_VERSION, ...
                       "type", "protocol.host_ready", ...
                       "request_id", "host-ready", ...
                       "status", "success", ...
                       "payload", struct("scilab_version", getversion(), "minimum_scilab_version", "2026.1.0"));
        p2SendBrowserData(p2EncodeControl(ready));
        return;
    end
    try
        message = p2DecodeControl(data);
        [ok, validationError] = p2ValidateEnvelope(message);
        if ~ok then cb(p2EncodeControl(validationError)); return; end
        response = p2RouteMessage(message);  
        encodeStart=getdate();encodedResponse=p2EncodeControl(response);encodeMs=etime(getdate(),encodeStart)*1000;
        if message.type=="plot.viewport.request" then global P35113_ENCODING_IDS P35113_ENCODING_MS P35113_ENCODING_CHARS;P35113_ENCODING_IDS($+1)=message.request_id;P35113_ENCODING_MS($+1)=encodeMs;P35113_ENCODING_CHARS($+1)=length(encodedResponse);if size(P35113_ENCODING_IDS,"*")>100 then P35113_ENCODING_IDS=P35113_ENCODING_IDS($-99:$);P35113_ENCODING_MS=P35113_ENCODING_MS($-99:$);P35113_ENCODING_CHARS=P35113_ENCODING_CHARS($-99:$);end;end
        cb(encodedResponse);
        if message.type == "transfer.numeric.start" & response.status == "success" then p2PrimeNumericTransfer(); end
    catch
        rid = "";
        if exists("message", "local") & typeof(message) == "st" then
            if isfield(message, "request_id") then rid = message.request_id; end
        end
        err = lasterror();
        response = p2ProtocolError(rid, "HOST_CALLBACK_EXCEPTION", "Host callback failed: " + err, %f);
        cb(p2EncodeControl(response));
    end
endfunction

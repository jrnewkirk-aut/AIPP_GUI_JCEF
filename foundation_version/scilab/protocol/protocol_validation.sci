function tf = p2HasField(value, fieldName)
    global P2_PROTOCOL_NAME;
    global P2_PROTOCOL_VERSION;
    global P2_MIN_PROTOCOL_VERSION;
    global P2_MAX_PROTOCOL_VERSION;
    tf = typeof(value) == "st" & grep(fieldnames(value), fieldName) <> [];
endfunction

function [ok, errorMessage] = p2ValidateEnvelope(message)
    ok = %f;
    errorMessage = [];
    requestId = "";
    if typeof(message) <> "st" then
        errorMessage = p2ProtocolError(requestId, "INVALID_ENVELOPE", "Control message must be a JSON object.", %f);
        return;
    end
    if p2HasField(message, "request_id") then requestId = message.request_id; end
    if ~p2HasField(message, "protocol") | message.protocol <> P2_PROTOCOL_NAME then
        errorMessage = p2ProtocolError(requestId, "INVALID_PROTOCOL", "Protocol identity is missing or invalid.", %f); return;
    end
    if ~p2HasField(message, "protocol_version") then
        errorMessage = p2ProtocolError(requestId, "MISSING_PROTOCOL_VERSION", "protocol_version is required.", %f); return;
    end
    if message.protocol_version < P2_MIN_PROTOCOL_VERSION | message.protocol_version > P2_MAX_PROTOCOL_VERSION then
        errorMessage = p2ProtocolError(requestId, "UNSUPPORTED_VERSION", "Protocol version is not supported.", %f); return;
    end
    if ~p2HasField(message, "type") then
        errorMessage = p2ProtocolError(requestId, "MISSING_TYPE", "type is required.", %f); return;
    end
    if ~p2HasField(message, "request_id") | message.request_id == "" then
        errorMessage = p2ProtocolError(requestId, "MISSING_REQUEST_ID", "request_id is required.", %f); return;
    end
    ok = %t;
endfunction

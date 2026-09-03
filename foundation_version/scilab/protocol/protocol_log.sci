function p2HostLog(level, category, eventName, requestId, transferId, details)
    // Pillar 7 compatibility facade.
    p7HostLog(level,category,eventName,requestId,transferId,details);
endfunction

function response = p2HandleHostLogRequest(message)
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","diagnostic.host_log.response", ...
                    "request_id",message.request_id,"status","success","payload",struct("lines",p7HostLogSnapshot()));
endfunction

function response = p2HandleHostLogClear(message)
    p7HostLogClear();
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","diagnostic.host_log.cleared", ...
                    "request_id",message.request_id,"status","success","payload",struct("count",0));
endfunction

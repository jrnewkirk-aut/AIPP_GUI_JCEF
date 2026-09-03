global P7_HOST_LOG_LINES;
if ~isdef("P7_HOST_LOG_LINES") then P7_HOST_LOG_LINES=[];end

function record = p7HostLog(level,category,eventName,requestId,transferId,details)
    global P7_HOST_LOG_LINES P7_OBS_MAX_RECORDS;
    record=p7CreateObservabilityRecord(level,category,eventName,requestId,transferId,details);
    line=toJSON(record);if P7_HOST_LOG_LINES==[] then P7_HOST_LOG_LINES=line;else P7_HOST_LOG_LINES($+1)=line;end
    if size(P7_HOST_LOG_LINES,"*")>P7_OBS_MAX_RECORDS then P7_HOST_LOG_LINES=P7_HOST_LOG_LINES($-P7_OBS_MAX_RECORDS+1:$);end
endfunction

function lines = p7HostLogSnapshot()
    global P7_HOST_LOG_LINES;lines=P7_HOST_LOG_LINES;
endfunction

function p7HostLogClear()
    global P7_HOST_LOG_LINES;P7_HOST_LOG_LINES=[];
endfunction

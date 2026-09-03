function response = p2HandleHandshake(message)
    global P2_PROTOCOL_NAME;
    global P2_PROTOCOL_VERSION;
    global P2_MIN_PROTOCOL_VERSION;
    global P2_MAX_PROTOCOL_VERSION;
    response = struct("protocol", P2_PROTOCOL_NAME, ...
                      "protocol_version", P2_PROTOCOL_VERSION, ...
                      "type", "protocol.handshake.response", ...
                      "request_id", message.request_id, ...
                      "status", "success", ...
                      "payload", struct("scilab_version", getversion(), ...
                                        "minimum_scilab_version", "2026.1.0", ...
                                        "capabilities", ["safe_control_json", "request_response", "structured_errors"]));
endfunction

function response = p2HandleEcho(message)
    response = struct("protocol", P2_PROTOCOL_NAME, ...
                      "protocol_version", P2_PROTOCOL_VERSION, ...
                      "type", "diagnostic.echo.response", ...
                      "request_id", message.request_id, ...
                      "status", "success", ...
                      "payload", message.payload);
endfunction

function response = p2HandleDelay(message)
    delayMs = message.payload.delay_ms;
    sleep(delayMs);
    response = struct("protocol", P2_PROTOCOL_NAME, ...
                      "protocol_version", P2_PROTOCOL_VERSION, ...
                      "type", "diagnostic.delay.response", ...
                      "request_id", message.request_id, ...
                      "status", "success", ...
                      "payload", struct("delay_ms", delayMs));
endfunction


function response = p2HandleResultsExport(message)
    global P2_APP_ROOT;
    resultsDir = fullfile(P2_APP_ROOT, "results"); if ~isdir(resultsDir) then mkdir(resultsDir); end
    stamp = string(getdate("s"));
    jsonPath = fullfile(resultsDir, "protocol_results_" + stamp + ".json");
    csvPath = fullfile(resultsDir, "protocol_results_" + stamp + ".csv");
    if isfield(message.payload,"report_json") then
        mputl(strsplit(message.payload.report_json, ascii(10)), jsonPath);
    else
        mputl(strsplit(toJSON(message.payload), ascii(10)), jsonPath);
    end
    mputl(strsplit(message.payload.csv, ascii(10)), csvPath);
    response = struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","diagnostic.results.exported","request_id",message.request_id,"status","success", ...
                      "payload",struct("json_path",jsonPath,"csv_path",csvPath));
endfunction


function response = p2HandleCapabilities(message)
    response = struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","protocol.capabilities.response","request_id",message.request_id,"status","success", ...
                      "payload",struct("protocol_version",P2_PROTOCOL_VERSION,"scilab_version",getversion(), ...
                      "features",["safe_control_json","request_response","structured_errors","numeric_transfer","windowed_acknowledgements","cancellation","supersession","progress_events","viewport_service","diagnostics","result_export","schema_validation","adapter_interface","shutdown","host_lifecycle","generic_chunk_assembly","host_transport_logging","shared_contract_fixtures"]));
endfunction

function response = p2HandleShutdown(message)
    global P2_LIBRARY_ACTIVE;
    global P2_TX_ACTIVE;
    if P2_TX_ACTIVE then p2ResetTransfer(); end
    P2_LIBRARY_ACTIVE = %f;
    response = struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","protocol.shutdown.response","request_id",message.request_id,"status","success", ...
                      "payload",struct("active",P2_LIBRARY_ACTIVE,"requests_processed",P2_REQUEST_COUNT));
endfunction


function response = p2HandleInitialize(message)
    global P2_LIBRARY_ACTIVE;
    global P2_TX_ACTIVE;
    if P2_TX_ACTIVE then p2ResetTransfer(); end
    P2_LIBRARY_ACTIVE = %t;
    response = struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","protocol.initialize.response","request_id",message.request_id,"status","success", ...
                      "payload",struct("active",P2_LIBRARY_ACTIVE,"library_version",message.payload.library_version,"scilab_version",getversion()));
endfunction

function response = p2HandleLifecycleStatus(message)
    global P2_LIBRARY_ACTIVE;
    response = struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","protocol.lifecycle.status.response","request_id",message.request_id,"status","success", ...
                      "payload",struct("active",P2_LIBRARY_ACTIVE));
endfunction

function response=p35113HandleEncodingMetric(message)
 global P35113_ENCODING_IDS P35113_ENCODING_MS P35113_ENCODING_CHARS;rid="";if p2HasField(message.payload,"request_id") then rid=message.payload.request_id;end;idx=find(P35113_ENCODING_IDS==rid);found=idx<>[];ms=0;chars=0;if found then j=idx($);ms=P35113_ENCODING_MS(j);chars=P35113_ENCODING_CHARS(j);end;response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","diagnostic.encoding_metric.response","request_id",message.request_id,"status","success","payload",struct("request_id",rid,"found",found,"host_json_encoding_ms",ms,"encoded_response_chars",chars,"estimated_utf8_bytes",chars));
endfunction

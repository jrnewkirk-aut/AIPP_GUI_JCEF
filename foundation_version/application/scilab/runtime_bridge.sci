function pAippRuntimeBridgeReset()
    global P55_AIPP_RUNTIME_BRIDGE;
    P55_AIPP_RUNTIME_BRIDGE=struct("state","unavailable","host","127.0.0.1","port",8765,"owned",%f,"script","","log","","last_error","");
endfunction

function state=pAippRuntimeBridgeStart(appRoot)
    global P55_AIPP_RUNTIME_BRIDGE;
    pAippRuntimeBridgeReset();
    probe=unix_g("curl.exe --fail --silent --show-error --max-time 1 http://127.0.0.1:8765/health");
    if probe<>"" & strindex(probe,"rt9")<>[] then
        P55_AIPP_RUNTIME_BRIDGE.state="ready";
        P55_AIPP_RUNTIME_BRIDGE.owned=%f;
        P55_AIPP_RUNTIME_BRIDGE.last_error="";
        state=P55_AIPP_RUNTIME_BRIDGE;
        return;
    end
    script=fullfile(appRoot,"tools","runtime","start_runtime_bridge.cmd");
    logPath=fullfile(appRoot,"tools","runtime","runtime_bridge.log");
    if ~isfile(script) then
        P55_AIPP_RUNTIME_BRIDGE.state="unavailable";
        P55_AIPP_RUNTIME_BRIDGE.last_error="Runtime bridge script was not found: "+script;
        state=P55_AIPP_RUNTIME_BRIDGE;
        return;
    end
    P55_AIPP_RUNTIME_BRIDGE.script=script;
    P55_AIPP_RUNTIME_BRIDGE.log=logPath;
    command="cmd /c """+script+"""";
    try
        host(command);
        P55_AIPP_RUNTIME_BRIDGE.state="started";
        P55_AIPP_RUNTIME_BRIDGE.owned=%t;
        P55_AIPP_RUNTIME_BRIDGE.last_error="";
    catch
        P55_AIPP_RUNTIME_BRIDGE.state="unavailable";
        P55_AIPP_RUNTIME_BRIDGE.last_error="Unable to start the Runtime Bridge.";
    end
    state=P55_AIPP_RUNTIME_BRIDGE;
endfunction

function ready=pAippRuntimeBridgeHealthy()
    probe=unix_g("curl.exe --fail --silent --show-error --max-time 1 http://127.0.0.1:8765/health");
    ready=probe<>"";
endfunction

function snapshot=pAippRuntimeBridgeSnapshot()
    global P55_AIPP_RUNTIME_BRIDGE;
    snapshot=P55_AIPP_RUNTIME_BRIDGE;
endfunction

function pAippRuntimeBridgeShutdown()
    global P55_AIPP_RUNTIME_BRIDGE;
    P55_AIPP_RUNTIME_BRIDGE.state="stopped";
endfunction

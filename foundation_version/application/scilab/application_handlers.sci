function response=p55HandleReferencePing(message)
 response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.example.ping.response","request_id",message.request_id,"status","success","payload",struct("message","pong","source","application-owned-handler","application_version","0.8.7-m8.7"));
endfunction
function response=p56HandleReferenceSum(message)
 if ~p2HasField(message.payload,"values") then response=p2ProtocolError(message.request_id,"INVALID_APPLICATION_PAYLOAD","values is required.",%f);return;end
 values=message.payload.values;
 if typeof(values)<>"constant" then response=p2ProtocolError(message.request_id,"INVALID_APPLICATION_PAYLOAD","values must be numeric.",%f);return;end
 response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.example.sum.response","request_id",message.request_id,"status","success","payload",struct("sum",sum(values),"count",size(values,"*"),"source","application-owned-handler","application_version","0.8.7-m8.7"));
endfunction
function response=pAippHandleStatus(message)
 global P55_APPLICATION_STARTED P55_AIPP_MODEL_LOADED;
 response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.aipp.status.response","request_id",message.request_id,"status","success","payload",struct("application_id","application.aipp","application_name","AIPP Inflator Model Viewer","application_version","0.8.7-m8.7","ready",P55_APPLICATION_STARTED,"model_loaded",P55_AIPP_MODEL_LOADED,"foundation_release","AI-1.0.0","runtime_foundation","P6.4.0-0.1","minimum_scilab_version","2026.1.0"));
endfunction
function response=pAippHandlePyrolist(message)
    includeFormulations=%t;
    if p2HasField(message.payload,"include_formulations") then
        includeFormulations=message.payload.include_formulations;
        if typeof(includeFormulations)<>"boolean"|size(includeFormulations,"*")<>1 then
            response=p2ProtocolError(message.request_id,"INVALID_APPLICATION_PAYLOAD","include_formulations must be a scalar boolean.",%f);return;
        end
    end
    path=fullfile(pwd(),"application","data","pyrolist.json");
    if ~isfile(path) then response=p2ProtocolError(message.request_id,"AIPP_PYROLIST_NOT_FOUND","Application pyrolist was not found.",%f);return;end
    lines=mgetl(path);if lines==[] then response=p2ProtocolError(message.request_id,"AIPP_PYROLIST_EMPTY","Application pyrolist is empty.",%f);return;end
    try
        formulations=fromJSON(strcat(lines,ascii(10)));
    catch
        response=p2ProtocolError(message.request_id,"AIPP_PYROLIST_INVALID","Application pyrolist is not valid JSON.",%f);return;
    end
    names=gsort(fieldnames(formulations),"g","i");
    payload=struct("source","application/data/pyrolist.json","count",size(names,"*"),"names",names,"application_version","0.8.7-m8.7");
    if includeFormulations then payload.formulations=formulations;end
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.aipp.pyrolist.response","request_id",message.request_id,"status","success","payload",payload);
endfunction

function response=pAippHandleMaterials(message)
    path=fullfile(pwd(),"application","data","material_list.json");
    if ~isfile(path) then response=p2ProtocolError(message.request_id,"AIPP_MATERIAL_LIST_NOT_FOUND","Application material list was not found.",%f);return;end
    lines=mgetl(path);if lines==[] then response=p2ProtocolError(message.request_id,"AIPP_MATERIAL_LIST_EMPTY","Application material list is empty.",%f);return;end
    try
        materials=fromJSON(strcat(lines,ascii(10)));
    catch
        response=p2ProtocolError(message.request_id,"AIPP_MATERIAL_LIST_INVALID","Application material list is not valid JSON.",%f);return;
    end
    names=matrix(gsort(fieldnames(materials),"g","i"),1,-1);
    if size(names,"*")==0 then response=p2ProtocolError(message.request_id,"AIPP_MATERIAL_LIST_EMPTY","Application material list has no materials.",%f);return;end
    payload=struct("source","application/data/material_list.json","count",size(names,"*"),"names",names,"materials",materials,"application_version","0.8.7-m8.7");
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.aipp.materials.response","request_id",message.request_id,"status","success","payload",payload);
endfunction

function response=pAippHandleDeckOpen(message)
    selected=uigetfile("*.json",".","Open AIPP input deck");
    if selected=="" then
        payload=struct("cancelled",%t,"name","","path","","deck_json","");
    else
        lines=mgetl(selected);
        deckJson=strcat(lines,ascii(10));
        [folder,name,extension]=fileparts(selected);
        payload=struct("cancelled",%f,"name",name+extension,"path",selected,"deck_json",deckJson);
    end
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.aipp.deck.open.response","request_id",message.request_id,"status","success","payload",payload);
endfunction

function response=pAippHandleDeckSave(message)
    payloadIn=message.payload;
    target="";
    if isfield(payloadIn,"path") then target=string(payloadIn.path);end
    saveAs=%f;if isfield(payloadIn,"save_as") then saveAs=payloadIn.save_as;end
    suggested="untitled.json";if isfield(payloadIn,"suggested_name") then suggested=string(payloadIn.suggested_name);end
    if saveAs|target=="" then target=uiputfile(["*.json", "JSON files"],".","Save AIPP input deck as "+suggested);end
    if target=="" then
        payload=struct("cancelled",%t,"name","","path","");
    else
        deckJson=string(payloadIn.deck_json);
        fd=mopen(target,"wt");
        if fd<0 then response=p2ProtocolError(message.request_id,"AIPP_DECK_SAVE_OPEN_FAILED","Unable to open selected deck path for writing.",%t);return;end
        mputstr(deckJson,fd);mclose(fd);
        [folder,name,extension]=fileparts(target);
        payload=struct("cancelled",%f,"name",name+extension,"path",target);
    end
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.aipp.deck.save.response","request_id",message.request_id,"status","success","payload",payload);
endfunction

function response=pAippHandleRuntimeBridge(message)
    state=pAippRuntimeBridgeSnapshot();
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","application.aipp.runtime.bridge.response","request_id",message.request_id,"status","success","payload",state);
endfunction

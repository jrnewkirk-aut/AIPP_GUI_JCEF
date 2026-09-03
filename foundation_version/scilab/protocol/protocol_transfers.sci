function p2ResetTransfer()
    global P2_TX_ACTIVE P2_TX_ID P2_TX_VIEWPORT_ID P2_TX_BATCH_COUNT P2_TX_VALUE_COUNT P2_TX_WINDOW_SIZE P2_TX_NEXT_BATCH P2_TX_ACKED P2_TX_CANCELLED;
    P2_TX_ACTIVE = %f; P2_TX_ID = ""; P2_TX_VIEWPORT_ID = 0; P2_TX_BATCH_COUNT = 0; P2_TX_VALUE_COUNT = 0;
    P2_TX_WINDOW_SIZE = 2; P2_TX_NEXT_BATCH = 0; P2_TX_ACKED = 0; P2_TX_CANCELLED = %f;
endfunction

function p2SendTransferBatch(batchIndex)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    global P2_TX_ID P2_TX_VIEWPORT_ID P2_TX_BATCH_COUNT P2_TX_VALUE_COUNT;
    metadata = struct("protocol", P2_PROTOCOL_NAME, "protocol_version", P2_PROTOCOL_VERSION, ...
                      "type", "transfer.numeric.batch_ready", "request_id", "batch-" + P2_TX_ID + "-" + string(batchIndex), ...
                      "status", "success", "payload", struct("transfer_id", P2_TX_ID, "viewport_id", P2_TX_VIEWPORT_ID, ...
                      "batch_index", batchIndex, "batch_count", P2_TX_BATCH_COUNT, "value_count", P2_TX_VALUE_COUNT));
    p2SendBrowserData(p2EncodeControl(metadata));
    indexes = 0:(P2_TX_VALUE_COUNT-1);
    values = P2_TX_VIEWPORT_ID * 0.000001 + batchIndex * 1000000 + indexes * 0.001 + 0.5;
    p2SendBrowserData(values);
endfunction

function response = p2StartNumericTransfer(message)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    global P2_TX_ACTIVE P2_TX_ID P2_TX_VIEWPORT_ID P2_TX_BATCH_COUNT P2_TX_VALUE_COUNT P2_TX_WINDOW_SIZE P2_TX_NEXT_BATCH P2_TX_ACKED P2_TX_CANCELLED;
    if P2_TX_ACTIVE then response=p2ProtocolError(message.request_id,"HOST_BUSY","A numeric transfer is already active.",%t); return; end
    p=message.payload;
    if ~p2HasField(p,"transfer_id") | ~p2HasField(p,"viewport_id") | ~p2HasField(p,"batch_count") | ~p2HasField(p,"value_count") then
        response=p2ProtocolError(message.request_id,"INVALID_TRANSFER_START","Required transfer fields are missing.",%f); return;
    end
    if p.batch_count<=0 | p.value_count<=0 then response=p2ProtocolError(message.request_id,"INVALID_TRANSFER_SIZE","Counts must be positive.",%f); return; end
    P2_TX_ACTIVE=%t;P2_TX_ID=p.transfer_id;P2_TX_VIEWPORT_ID=p.viewport_id;P2_TX_BATCH_COUNT=p.batch_count;P2_TX_VALUE_COUNT=p.value_count;
    if p2HasField(p,"window_size") then P2_TX_WINDOW_SIZE=min(max(1,p.window_size),p.batch_count); else P2_TX_WINDOW_SIZE=min(2,p.batch_count); end
    P2_TX_NEXT_BATCH=0;P2_TX_ACKED=0;P2_TX_CANCELLED=%f;
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.numeric.started","request_id",message.request_id,"status","success", ...
                    "payload",struct("transfer_id",P2_TX_ID,"viewport_id",P2_TX_VIEWPORT_ID,"batch_count",P2_TX_BATCH_COUNT,"value_count",P2_TX_VALUE_COUNT,"window_size",P2_TX_WINDOW_SIZE));
endfunction

function p2PrimeNumericTransfer()
    global P2_TX_ACTIVE P2_TX_WINDOW_SIZE P2_TX_NEXT_BATCH P2_TX_BATCH_COUNT;
    if ~P2_TX_ACTIVE then return; end
    n=min(P2_TX_WINDOW_SIZE,P2_TX_BATCH_COUNT);
    for i=1:n; p2SendTransferBatch(P2_TX_NEXT_BATCH); P2_TX_NEXT_BATCH=P2_TX_NEXT_BATCH+1; end
endfunction

function response = p2AcknowledgeNumericBatch(message)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    global P2_TX_ACTIVE P2_TX_ID P2_TX_VIEWPORT_ID P2_TX_BATCH_COUNT P2_TX_NEXT_BATCH P2_TX_ACKED;
    p=message.payload;
    if ~P2_TX_ACTIVE then response=p2ProtocolError(message.request_id,"NOT_ACTIVE","No numeric transfer is active.",%f); return; end
    if p.transfer_id<>P2_TX_ID then response=p2ProtocolError(message.request_id,"TRANSFER_ID_MISMATCH","Acknowledgement transfer ID does not match.",%f); return; end
    if p.viewport_id<>P2_TX_VIEWPORT_ID then response=p2ProtocolError(message.request_id,"VIEWPORT_ID_MISMATCH","Acknowledgement viewport ID does not match.",%f); return; end
    if p.batch_index<>P2_TX_ACKED then response=p2ProtocolError(message.request_id,"UNEXPECTED_BATCH_ACK","Acknowledgement is duplicate or out of order.",%f); return; end
    P2_TX_ACKED=P2_TX_ACKED+1;
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.numeric.acknowledged","request_id",message.request_id,"status","success", ...
                    "payload",struct("transfer_id",P2_TX_ID,"batch_index",p.batch_index,"acknowledged_count",P2_TX_ACKED));
    if P2_TX_NEXT_BATCH<P2_TX_BATCH_COUNT then p2SendTransferBatch(P2_TX_NEXT_BATCH);P2_TX_NEXT_BATCH=P2_TX_NEXT_BATCH+1; end
    if P2_TX_ACKED>=P2_TX_BATCH_COUNT then
        completed=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.numeric.completed","request_id","complete-"+P2_TX_ID,"status","success", ...
                         "payload",struct("transfer_id",P2_TX_ID,"viewport_id",P2_TX_VIEWPORT_ID,"batch_count",P2_TX_BATCH_COUNT));
        p2SendBrowserData(p2EncodeControl(completed));p2ResetTransfer();
    end
endfunction

function response = p2CancelNumericTransfer(message)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    global P2_TX_ACTIVE P2_TX_ID P2_TX_VIEWPORT_ID P2_TX_NEXT_BATCH P2_TX_ACKED;
    p=message.payload;
    if ~P2_TX_ACTIVE | p.transfer_id<>P2_TX_ID then response=p2ProtocolError(message.request_id,"NOT_ACTIVE","Transfer is not active.",%f); return; end
    oldId=P2_TX_ID;oldViewport=P2_TX_VIEWPORT_ID;submitted=P2_TX_NEXT_BATCH;acked=P2_TX_ACKED;p2ResetTransfer();
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.cancelled","request_id",message.request_id,"status","success", ...
                    "payload",struct("transfer_id",oldId,"viewport_id",oldViewport,"submitted_batch_count",submitted,"acknowledged_batch_count",acked));
endfunction

function response = p2TransferStatus(message)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    global P2_TX_ACTIVE P2_TX_ID P2_TX_VIEWPORT_ID P2_TX_NEXT_BATCH P2_TX_ACKED;
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.status.response","request_id",message.request_id,"status","success", ...
                    "payload",struct("active",P2_TX_ACTIVE,"transfer_id",P2_TX_ID,"viewport_id",P2_TX_VIEWPORT_ID,"submitted",P2_TX_NEXT_BATCH,"acknowledged",P2_TX_ACKED));
endfunction

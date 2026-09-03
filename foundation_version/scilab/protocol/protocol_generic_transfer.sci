function checksum = p2TextChecksum(text)
    codes = ascii(text);
    checksum = modulo(sum(codes), 2147483647);
endfunction

function p2GenericReset()
    global P2_GX_ACTIVE P2_GX_ID P2_GX_REQUEST_ID P2_GX_EXPECTED_CHUNKS P2_GX_EXPECTED_SIZE P2_GX_CHECKSUM P2_GX_TIMEOUT_MS P2_GX_STARTED_S P2_GX_CHUNKS P2_GX_RECEIVED;
    P2_GX_ACTIVE=%f; P2_GX_ID=""; P2_GX_REQUEST_ID=""; P2_GX_EXPECTED_CHUNKS=0; P2_GX_EXPECTED_SIZE=0;
    P2_GX_CHECKSUM=0; P2_GX_TIMEOUT_MS=0; P2_GX_STARTED_S=0; P2_GX_CHUNKS=[]; P2_GX_RECEIVED=[];
endfunction

function timedOut = p2GenericTimedOut()
    global P2_GX_ACTIVE P2_GX_TIMEOUT_MS P2_GX_STARTED_S;
    timedOut = P2_GX_ACTIVE & ((getdate("s") - P2_GX_STARTED_S) * 1000 > P2_GX_TIMEOUT_MS);
endfunction

function response = p2GenericStart(message)
    global P2_GX_ACTIVE P2_GX_ID P2_GX_REQUEST_ID P2_GX_EXPECTED_CHUNKS P2_GX_EXPECTED_SIZE P2_GX_CHECKSUM P2_GX_TIMEOUT_MS P2_GX_STARTED_S P2_GX_CHUNKS P2_GX_RECEIVED;
    p=message.payload;
    if P2_GX_ACTIVE then response=p2ProtocolError(message.request_id,"GENERIC_TRANSFER_BUSY","A generic transfer is already active.",%t); return; end
    if p.chunk_count<=0 | p.total_size<0 | p.timeout_ms<=0 then response=p2ProtocolError(message.request_id,"INVALID_GENERIC_TRANSFER","Invalid generic transfer limits.",%f); return; end
    P2_GX_ACTIVE=%t; P2_GX_ID=p.transfer_id; P2_GX_REQUEST_ID=message.request_id; P2_GX_EXPECTED_CHUNKS=p.chunk_count; P2_GX_EXPECTED_SIZE=p.total_size;
    P2_GX_CHECKSUM=p.checksum; P2_GX_TIMEOUT_MS=p.timeout_ms; P2_GX_STARTED_S=getdate("s"); P2_GX_CHUNKS=emptystr(1,p.chunk_count); P2_GX_RECEIVED=zeros(1,p.chunk_count);
    p2HostLog("info","transport","generic_transfer_started",message.request_id,P2_GX_ID,struct("chunk_count",p.chunk_count,"total_size",p.total_size));
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.generic.started","request_id",message.request_id,"status","success", ...
                    "payload",struct("transfer_id",P2_GX_ID,"chunk_count",P2_GX_EXPECTED_CHUNKS));
endfunction

function response = p2GenericChunk(message)
    global P2_GX_ACTIVE P2_GX_ID P2_GX_EXPECTED_CHUNKS P2_GX_CHUNKS P2_GX_RECEIVED;
    p=message.payload;
    if p2GenericTimedOut() then old=P2_GX_ID;p2HostLog("warn","transport","generic_transfer_timed_out",message.request_id,old,struct());p2GenericReset();response=p2ProtocolError(message.request_id,"TRANSFER_TIMEOUT","Generic transfer timed out.",%f);return;end
    if ~P2_GX_ACTIVE then response=p2ProtocolError(message.request_id,"NOT_ACTIVE","No generic transfer is active.",%f);return;end
    if p.transfer_id<>P2_GX_ID then response=p2ProtocolError(message.request_id,"TRANSFER_ID_MISMATCH","Generic transfer ID does not match.",%f);return;end
    idx=p.chunk_index+1;
    if idx<1 | idx>P2_GX_EXPECTED_CHUNKS then response=p2ProtocolError(message.request_id,"CHUNK_INDEX_OUT_OF_RANGE","Chunk index is outside the expected range.",%f);return;end
    if P2_GX_RECEIVED(idx)==1 then response=p2ProtocolError(message.request_id,"DUPLICATE_CHUNK","Chunk was already received.",%f);return;end
    if p2TextChecksum(p.data)<>p.chunk_checksum then response=p2ProtocolError(message.request_id,"CHUNK_CHECKSUM_MISMATCH","Chunk checksum failed.",%f);return;end
    P2_GX_CHUNKS(idx)=p.data;P2_GX_RECEIVED(idx)=1;
    p2HostLog("debug","transport","generic_chunk_received",message.request_id,P2_GX_ID,struct("chunk_index",p.chunk_index,"size",length(p.data)));
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.generic.chunk.accepted","request_id",message.request_id,"status","success", ...
                    "payload",struct("transfer_id",P2_GX_ID,"chunk_index",p.chunk_index,"received_count",sum(P2_GX_RECEIVED)));
endfunction

function response = p2GenericComplete(message)
    global P2_GX_ACTIVE P2_GX_ID P2_GX_EXPECTED_CHUNKS P2_GX_EXPECTED_SIZE P2_GX_CHECKSUM P2_GX_CHUNKS P2_GX_RECEIVED P2_GX_COMMITTED;
    if p2GenericTimedOut() then old=P2_GX_ID;p2HostLog("warn","transport","generic_transfer_timed_out",message.request_id,old,struct());p2GenericReset();response=p2ProtocolError(message.request_id,"TRANSFER_TIMEOUT","Generic transfer timed out.",%f);return;end
    if ~P2_GX_ACTIVE then response=p2ProtocolError(message.request_id,"NOT_ACTIVE","No generic transfer is active.",%f);return;end
    if message.payload.transfer_id<>P2_GX_ID then response=p2ProtocolError(message.request_id,"TRANSFER_ID_MISMATCH","Generic transfer ID does not match.",%f);return;end
    if sum(P2_GX_RECEIVED)<>P2_GX_EXPECTED_CHUNKS then old=P2_GX_ID;p2HostLog("warn","transport","generic_transfer_incomplete",message.request_id,old,struct("received",sum(P2_GX_RECEIVED),"expected",P2_GX_EXPECTED_CHUNKS));p2GenericReset();response=p2ProtocolError(message.request_id,"INCOMPLETE_TRANSFER","One or more chunks are missing.",%f);return;end
    assembled=strcat(P2_GX_CHUNKS);
    if length(assembled)<>P2_GX_EXPECTED_SIZE then old=P2_GX_ID;p2GenericReset();response=p2ProtocolError(message.request_id,"TOTAL_SIZE_MISMATCH","Assembled size does not match declaration.",%f);return;end
    if p2TextChecksum(assembled)<>P2_GX_CHECKSUM then old=P2_GX_ID;p2GenericReset();response=p2ProtocolError(message.request_id,"TRANSFER_CHECKSUM_MISMATCH","Whole-transfer checksum failed.",%f);return;end
    P2_GX_COMMITTED=assembled;old=P2_GX_ID;p2HostLog("info","transport","generic_transfer_committed",message.request_id,old,struct("size",length(assembled)));p2GenericReset();
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.generic.completed","request_id",message.request_id,"status","success", ...
                    "payload",struct("transfer_id",old,"size",length(assembled),"checksum",p2TextChecksum(assembled)));
endfunction

function response = p2GenericCancel(message)
    global P2_GX_ACTIVE P2_GX_ID;
    if ~P2_GX_ACTIVE | message.payload.transfer_id<>P2_GX_ID then response=p2ProtocolError(message.request_id,"NOT_ACTIVE","Generic transfer is not active.",%f);return;end
    old=P2_GX_ID;p2HostLog("info","transport","generic_transfer_cancelled",message.request_id,old,struct("reason",message.payload.reason));p2GenericReset();
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.generic.cancelled","request_id",message.request_id,"status","success","payload",struct("transfer_id",old));
endfunction

function response = p2GenericStatus(message)
    global P2_GX_ACTIVE P2_GX_ID P2_GX_RECEIVED P2_GX_COMMITTED;
    timedOut=%f;if p2GenericTimedOut() then timedOut=%t;old=P2_GX_ID;p2GenericReset();end
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","transfer.generic.status.response","request_id",message.request_id,"status","success", ...
                    "payload",struct("active",P2_GX_ACTIVE,"transfer_id",P2_GX_ID,"received_count",sum(P2_GX_RECEIVED),"committed",P2_GX_COMMITTED,"timed_out",timedOut));
endfunction

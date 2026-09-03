function p358PyramidReset()
 global P358_PYRAMID_X P358_PYRAMID_Y P358_PYRAMID_READY P358_PYRAMID_BYTES P358_PYRAMID_BUILD_COUNT P359_PREP_ACTIVE P359_PREP_CANCELLED P359_PREP_NEXT P359_PREP_TOTAL P359_PREP_BATCH P359_PREP_STARTED;
 P358_PYRAMID_X=list();P358_PYRAMID_Y=list();P358_PYRAMID_READY=[];P358_PYRAMID_BYTES=0;P358_PYRAMID_BUILD_COUNT=0;P359_PREP_ACTIVE=%f;P359_PREP_CANCELLED=%f;P359_PREP_NEXT=1;P359_PREP_TOTAL=0;P359_PREP_BATCH=5;P359_PREP_STARTED=getdate();
endfunction
function [px,py,buildMs,cold]=p358PyramidEnsure(curveId)
 global P3_POINTS_PER_CURVE P3_X_MIN P3_X_MAX P358_PYRAMID_X P358_PYRAMID_Y P358_PYRAMID_READY P358_PYRAMID_BYTES P358_PYRAMID_BUILD_COUNT;
 cold=%t;buildMs=0;if P358_PYRAMID_READY<>[] & curveId<=size(P358_PYRAMID_READY,"*") then if P358_PYRAMID_READY(curveId)==1 then px=P358_PYRAMID_X(curveId);py=P358_PYRAMID_Y(curveId);cold=%f;return;end;end
 tStart=getdate();[x,y]=p3FullRange(curveId,P3_X_MIN,P3_X_MAX);[px,py]=p3ReduceMinMax(x,y,min(8192,ceil(P3_POINTS_PER_CURVE/2)));buildMs=etime(getdate(),tStart)*1000;
 P358_PYRAMID_X(curveId)=px;P358_PYRAMID_Y(curveId)=py;if P358_PYRAMID_READY==[] then P358_PYRAMID_READY=zeros(1,curveId);elseif size(P358_PYRAMID_READY,"*")<curveId then P358_PYRAMID_READY(curveId)=0;end;P358_PYRAMID_READY(curveId)=1;
 P358_PYRAMID_BYTES=P358_PYRAMID_BYTES+size(px,"*")*16;P358_PYRAMID_BUILD_COUNT=P358_PYRAMID_BUILD_COUNT+1;
endfunction
function [xr,yr,buildMs,lookupMs,cold,sourceCandidates]=p358PyramidViewport(curveId,xMin,xMax,pixelWidth)
 global P3_DATASET_ID P3_X_MIN P3_X_MAX;
 [px,py,buildMs,cold]=p358PyramidEnsure(curveId);tStart=getdate();tol=max(1d-12,abs(P3_X_MAX-P3_X_MIN)*1d-12);isAift=part(P3_DATASET_ID,1:min(5,length(P3_DATASET_ID)))=="aift-";isFull=abs(xMin-P3_X_MIN)<=tol & abs(xMax-P3_X_MAX)<=tol;
 // Exact AIFT policy: retained extrema are exact for the complete range. For partial
 // windows, use resident source arrays so partially intersected pyramid buckets
 // cannot import out-of-range extrema or omit an in-range extremum.
 if isAift & ~isFull then
  [xc,yc]=p3FullRange(curveId,xMin,xMax);sourceCandidates=size(xc,"*");[xr,yr]=p3ReduceMinMax(xc,yc,pixelWidth);
 else
  inside=find(px>=xMin & px<=xMax);if inside==[] then [xc,yc]=p3FullRange(curveId,xMin,xMax);sourceCandidates=size(xc,"*");[xr,yr]=p3ReduceMinMax(xc,yc,pixelWidth);else xc=px(inside);yc=py(inside);sourceCandidates=size(xc,"*");[xr,yr]=p3ReduceMinMax(xc,yc,pixelWidth);end
 end
 lookupMs=etime(getdate(),tStart)*1000;
endfunction
function response=p358HandlePyramidStatus(message)
 global P358_PYRAMID_READY P358_PYRAMID_BYTES P358_PYRAMID_BUILD_COUNT;ready=0;if P358_PYRAMID_READY<>[] then ready=sum(P358_PYRAMID_READY);end;response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.pyramid.status.response","request_id",message.request_id,"status","success","payload",struct("ready_curves",ready,"retained_bytes",P358_PYRAMID_BYTES,"build_count",P358_PYRAMID_BUILD_COUNT,"level_buckets",8192));
endfunction
function response=p358HandlePyramidClear(message)
 p358PyramidReset();response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.pyramid.cleared","request_id",message.request_id,"status","success","payload",struct("ready_curves",0,"retained_bytes",0));
endfunction

function ready=p359PyramidReady(curveId)
 global P358_PYRAMID_READY;ready=%f;if P358_PYRAMID_READY<>[] & curveId<=size(P358_PYRAMID_READY,"*") then ready=P358_PYRAMID_READY(curveId)==1;end
endfunction
function response=p359HandlePrepareStart(message)
 global P3_CURVE_COUNT P359_PREP_ACTIVE P359_PREP_CANCELLED P359_PREP_NEXT P359_PREP_TOTAL P359_PREP_BATCH P359_PREP_STARTED;
 p=message.payload;P359_PREP_TOTAL=min(P3_CURVE_COUNT,p.curve_count);P359_PREP_BATCH=max(1,min(20,p.batch_size));P359_PREP_NEXT=1;while P359_PREP_NEXT<=P359_PREP_TOTAL & p359PyramidReady(P359_PREP_NEXT);P359_PREP_NEXT=P359_PREP_NEXT+1;end;P359_PREP_ACTIVE=P359_PREP_NEXT<=P359_PREP_TOTAL;P359_PREP_CANCELLED=%f;P359_PREP_STARTED=getdate();
 response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.pyramid.prepare.started","request_id",message.request_id,"status","success","payload",p359PreparationStatus());
endfunction
function status=p359PreparationStatus()
 global P359_PREP_ACTIVE P359_PREP_CANCELLED P359_PREP_NEXT P359_PREP_TOTAL P359_PREP_BATCH P359_PREP_STARTED P358_PYRAMID_BYTES P358_PYRAMID_BUILD_COUNT;
 ready=0;global P358_PYRAMID_READY;if P358_PYRAMID_READY<>[] then ready=sum(P358_PYRAMID_READY);end;elapsed=etime(getdate(),P359_PREP_STARTED)*1000;remaining=max(0,P359_PREP_TOTAL-ready);eta=0;if ready>0 then eta=elapsed/ready*remaining;end;
 status=struct("active",P359_PREP_ACTIVE,"cancelled",P359_PREP_CANCELLED,"ready_curves",ready,"total_curves",P359_PREP_TOTAL,"next_curve",P359_PREP_NEXT,"batch_size",P359_PREP_BATCH,"progress",ready/max(1,P359_PREP_TOTAL),"elapsed_ms",elapsed,"estimated_remaining_ms",eta,"retained_bytes",P358_PYRAMID_BYTES,"build_count",P358_PYRAMID_BUILD_COUNT);
endfunction
function response=p359HandlePrepareStep(message)
 global P359_PREP_ACTIVE P359_PREP_CANCELLED P359_PREP_NEXT P359_PREP_TOTAL P359_PREP_BATCH;
 if ~P359_PREP_ACTIVE then response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.pyramid.prepare.step.response","request_id",message.request_id,"status","success","payload",p359PreparationStatus());return;end
 built=0;batchMs=0;while built<P359_PREP_BATCH & P359_PREP_NEXT<=P359_PREP_TOTAL & ~P359_PREP_CANCELLED;cid=P359_PREP_NEXT;if ~p359PyramidReady(cid) then [px,py,ms,cold]=p358PyramidEnsure(cid);batchMs=batchMs+ms;built=built+1;end;P359_PREP_NEXT=P359_PREP_NEXT+1;end;P359_PREP_ACTIVE=(P359_PREP_NEXT<=P359_PREP_TOTAL & ~P359_PREP_CANCELLED);payload=p359PreparationStatus();payload.batch_built=built;payload.batch_ms=batchMs;
 response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.pyramid.prepare.step.response","request_id",message.request_id,"status","success","payload",payload);
endfunction
function response=p359HandlePrepareStatus(message);response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.pyramid.prepare.status.response","request_id",message.request_id,"status","success","payload",p359PreparationStatus());endfunction
function response=p359HandlePrepareCancel(message);global P359_PREP_ACTIVE P359_PREP_CANCELLED;P359_PREP_ACTIVE=%f;P359_PREP_CANCELLED=%t;response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.pyramid.prepare.cancelled","request_id",message.request_id,"status","success","payload",p359PreparationStatus());endfunction

function ms=p342ElapsedMs()
 ms=toc()*1000;
endfunction
function ok=p342ValidDuration(ms)
 ok=isreal(ms) & size(ms,"*")==1 & ~isnan(ms) & ~isinf(ms) & ms>=0;
endfunction
function snap=p342ProcessMemorySnapshot()
 snap=struct("supported",%f,"working_set_bytes",-1,"private_bytes",-1,"pid",-1,"source","unavailable");
 try
  pid=getpid();q=ascii(34);cmd="powershell.exe -NoProfile -Command "+q+"$p=Get-Process -Id "+string(pid)+"; Write-Output ($p.WorkingSet64.ToString()+'',''+$p.PrivateMemorySize64.ToString())"+q;
  [lines,status]=unix_g(cmd);
  if status==0 & lines<>[] then parts=tokens(stripblanks(lines(1)),",");if size(parts,"*")==2 then snap=struct("supported",%t,"working_set_bytes",evstr(parts(1)),"private_bytes",evstr(parts(2)),"pid",pid,"source","powershell_get_process");end;end
 catch
 end
endfunction
function p34NativeReset()
 global P34_NATIVE_AXES P34_NATIVE_LINES P34_NATIVE_CURVE_IDS P34_NATIVE_ACTIVE;
 if P34_NATIVE_AXES<>[] & is_handle_valid(P34_NATIVE_AXES) then if P34_NATIVE_AXES.children<>[] then delete(P34_NATIVE_AXES.children);end;end
 P34_NATIVE_LINES=list();P34_NATIVE_CURVE_IDS=[];P34_NATIVE_ACTIVE=%f;
endfunction
function bytes=p34EstimatedCoordinateBytes(pointCount);bytes=pointCount*16;endfunction
function [allX,allY,totalPoints,minY,maxY,sourceMs,reductionMs]=p34PrepareSeries(ids,xMin,xMax,pixelWidth,mode)
 allX=list();allY=list();totalPoints=0;minY=%inf;maxY=-%inf;sourceMs=0;reductionMs=0;
 for k=1:size(ids,"*")
  tic();[x,y]=p3FullRange(ids(k),xMin,xMax);sourceMs=sourceMs+p342ElapsedMs();
  if mode=="full" then xr=x;yr=y;else tic();[xr,yr]=p3ReduceMinMax(x,y,pixelWidth);reductionMs=reductionMs+p342ElapsedMs();end
  allX(k)=xr;allY(k)=yr;totalPoints=totalPoints+size(xr,"*");minY=min(minY,min(yr));maxY=max(maxY,max(yr));
 end
endfunction
function metrics=p342NativeApplyPrepared(ids,allX,allY,xMin,xMax,strategy,sourceMs,reductionMs,sampleMemory)
 global P34_NATIVE_AXES P34_NATIVE_LINES P34_NATIVE_CURVE_IDS P34_NATIVE_ACTIVE P34_NATIVE_RENDER_COUNT;
 totalPoints=0;minY=%inf;maxY=-%inf;for k=1:size(ids,"*");totalPoints=totalPoints+size(allX(k),"*");minY=min(minY,min(allY(k)));maxY=max(maxY,max(allY(k)));end
 if sampleMemory then before=p342ProcessMemorySnapshot();else before=struct("supported",%f,"working_set_bytes",-1,"private_bytes",-1,"pid",-1,"source","disabled_for_timed_render");end;fig=P34_NATIVE_AXES.parent.parent;oldDraw=fig.immediate_drawing;fig.immediate_drawing="off";tic();
 if strategy=="retained" & P34_NATIVE_ACTIVE & size(P34_NATIVE_CURVE_IDS,"*")==size(ids,"*") & and(P34_NATIVE_CURVE_IDS==ids) then
  for k=1:size(ids,"*");h=P34_NATIVE_LINES(k);h.data=[allX(k)' allY(k)'];h.visible="on";h.clip_state="on";end;operation="update";
 else
  p34NativeReset();sca(P34_NATIVE_AXES);colors=[2 5 3 6 4 7 9 13 16 19];
  for k=1:size(ids,"*");xpoly(allX(k),allY(k),"lines");h=gce();h.foreground=colors(modulo(k-1,size(colors,"*"))+1);h.thickness=1;h.clip_state="on";P34_NATIVE_LINES(k)=h;end
  P34_NATIVE_CURVE_IDS=ids;P34_NATIVE_ACTIVE=%t;operation="create";
 end
 if maxY<=minY then maxY=minY+1;end;P34_NATIVE_AXES.auto_scale="off";P34_NATIVE_AXES.tight_limits=["on" "on" "off"];P34_NATIVE_AXES.data_bounds=[xMin minY;xMax maxY];
 submitMs=p342ElapsedMs();fig.immediate_drawing=oldDraw;tic();drawnow();drawSubmitMs=p342ElapsedMs();if sampleMemory then after=p342ProcessMemorySnapshot();else after=before;end;P34_NATIVE_RENDER_COUNT=P34_NATIVE_RENDER_COUNT+1;
 appliedBounds=P34_NATIVE_AXES.data_bounds;appliedXMin=appliedBounds(1,1);appliedXMax=appliedBounds(2,1);boundsTol=max(1d-12,abs(xMax-xMin)*1d-10);boundsValid=abs(appliedXMin-xMin)<=boundsTol & abs(appliedXMax-xMax)<=boundsTol;valid=p342ValidDuration(sourceMs)&p342ValidDuration(reductionMs)&p342ValidDuration(submitMs)&p342ValidDuration(drawSubmitMs)&boundsValid;
 metrics=struct("operation",operation,"strategy",strategy,"curve_count",size(ids,"*"),"point_count",totalPoints,"estimated_coordinate_bytes",p34EstimatedCoordinateBytes(totalPoints),"polyline_count",length(P34_NATIVE_LINES), ...
 "source_ms",sourceMs,"reduction_ms",reductionMs,"graphics_submit_ms",submitMs,"drawnow_return_ms",drawSubmitMs,"host_measured_ms",sourceMs+reductionMs+submitMs+drawSubmitMs,"timing_valid",valid,"timing_endpoint","drawnow_return", ...
 "memory_sampling_enabled",sampleMemory,"memory_before",before,"memory_after",after,"working_set_delta_bytes",after.working_set_bytes-before.working_set_bytes,"private_delta_bytes",after.private_bytes-before.private_bytes,"render_count",P34_NATIVE_RENDER_COUNT,"x_min",xMin,"x_max",xMax,"requested_x_min",xMin,"requested_x_max",xMax,"applied_x_min",appliedXMin,"applied_x_max",appliedXMax,"bounds_valid",boundsValid,"clipping_enabled",%t,"y_min",minY,"y_max",maxY,"active",P34_NATIVE_ACTIVE);
endfunction
function metrics=p34NativeSetSeries(ids,xMin,xMax,pixelWidth,mode,strategy)
 [allX,allY,totalPoints,minY,maxY,sourceMs,reductionMs]=p34PrepareSeries(ids,xMin,xMax,pixelWidth,mode);metrics=p342NativeApplyPrepared(ids,allX,allY,xMin,xMax,strategy,sourceMs,reductionMs,%t);metrics.mode=mode;
endfunction
function response=p34HandleNativeRender(message)
 p=message.payload;if p.curve_ids==[] then response=p2ProtocolError(message.request_id,"NO_VISIBLE_CURVES","No native curves requested.",%f);return;end
 m=p34NativeSetSeries(p.curve_ids,p.x_min,p.x_max,p.pixel_width,p.mode,p.strategy);response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.native.render.response","request_id",message.request_id,"status","success","payload",m);
endfunction
function response=p342HandlePrepareComparison(message)
 global P342_PREPARED_ID P342_PREPARED_IDS P342_PREPARED_X P342_PREPARED_Y P342_PREPARED_META;
 p=message.payload;[allX,allY,totalPoints,minY,maxY,sourceMs,reductionMs]=p34PrepareSeries(p.curve_ids,p.x_min,p.x_max,p.pixel_width,"reduced");P342_PREPARED_ID="prepared-"+message.request_id;P342_PREPARED_IDS=p.curve_ids;P342_PREPARED_X=allX;P342_PREPARED_Y=allY;P342_PREPARED_META=struct("x_min",p.x_min,"x_max",p.x_max,"pixel_width",p.pixel_width,"source_ms",sourceMs,"reduction_ms",reductionMs,"point_count",totalPoints,"min_y",minY,"max_y",maxY);
 payload=struct("prepared_id",P342_PREPARED_ID,"curve_ids",p.curve_ids,"x",allX,"y",allY,"point_count",totalPoints,"source_ms",sourceMs,"reduction_ms",reductionMs,"timing_valid",p342ValidDuration(sourceMs)&p342ValidDuration(reductionMs));response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.compare.prepare.response","request_id",message.request_id,"status","success","payload",payload);
endfunction
function response=p342HandleNativePrepared(message)
 global P342_PREPARED_ID P342_PREPARED_IDS P342_PREPARED_X P342_PREPARED_Y P342_PREPARED_META;
 if message.payload.prepared_id<>P342_PREPARED_ID then response=p2ProtocolError(message.request_id,"PREPARED_VIEWPORT_NOT_FOUND","Prepared viewport ID is not active.",%f);return;end
 m=p342NativeApplyPrepared(P342_PREPARED_IDS,P342_PREPARED_X,P342_PREPARED_Y,P342_PREPARED_META.x_min,P342_PREPARED_META.x_max,message.payload.strategy,0,0,message.payload.sample_memory);m.prepared_id=P342_PREPARED_ID;m.mode="prepared_reduced";response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.native.prepared.response","request_id",message.request_id,"status","success","payload",m);
endfunction
function response=p34HandleNativeVisibility(message)
 global P34_NATIVE_LINES P34_NATIVE_CURVE_IDS;p=message.payload;sampleMemory=%f;if p2HasField(p,"sample_memory") then sampleMemory=p.sample_memory;end;before=struct("supported",%f,"working_set_bytes",-1,"private_bytes",-1,"pid",-1,"source","disabled");after=before;if sampleMemory then before=p342ProcessMemorySnapshot();end;tic();for k=1:length(P34_NATIVE_LINES);h=P34_NATIVE_LINES(k);if or(P34_NATIVE_CURVE_IDS(k)==p.visible_curve_ids) then h.visible="on";else h.visible="off";end;end;submitMs=p342ElapsedMs();tic();drawnow();drawMs=p342ElapsedMs();if sampleMemory then after=p342ProcessMemorySnapshot();end;payload=struct("visible_count",size(p.visible_curve_ids,"*"),"graphics_submit_ms",submitMs,"drawnow_return_ms",drawMs,"host_measured_ms",submitMs+drawMs,"timing_valid",p342ValidDuration(submitMs)&p342ValidDuration(drawMs),"memory_sampling_enabled",sampleMemory,"memory_before",before,"memory_after",after);response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.native.visibility.response","request_id",message.request_id,"status","success","payload",payload);
endfunction
function response=p34HandleNativeStatus(message)
 global P34_NATIVE_AXES P34_NATIVE_LINES P34_NATIVE_CURVE_IDS P34_NATIVE_ACTIVE P34_NATIVE_RENDER_COUNT;p=message.payload;sampleMemory=%f;if p2HasField(p,"sample_memory") then sampleMemory=p.sample_memory;end;mem=struct("supported",%f,"working_set_bytes",-1,"private_bytes",-1,"pid",-1,"source","disabled");if sampleMemory then mem=p342ProcessMemorySnapshot();end;response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.native.status.response","request_id",message.request_id,"status","success","payload",struct("active",P34_NATIVE_ACTIVE,"axes_valid",P34_NATIVE_AXES<>[]&is_handle_valid(P34_NATIVE_AXES),"polyline_count",length(P34_NATIVE_LINES),"curve_ids",P34_NATIVE_CURVE_IDS,"render_count",P34_NATIVE_RENDER_COUNT,"memory_sampling_enabled",sampleMemory,"memory",mem));
endfunction
function response=p34HandleNativeDestroy(message)
 p=message.payload;sampleMemory=%f;if p2HasField(p,"sample_memory") then sampleMemory=p.sample_memory;end;before=struct("supported",%f,"working_set_bytes",-1,"private_bytes",-1,"pid",-1,"source","disabled");after=before;if sampleMemory then before=p342ProcessMemorySnapshot();end;tic();p34NativeReset();destroyMs=p342ElapsedMs();if sampleMemory then after=p342ProcessMemorySnapshot();end;response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.native.destroy.response","request_id",message.request_id,"status","success","payload",struct("active",%f,"polyline_count",0,"destroy_ms",destroyMs,"host_measured_ms",destroyMs,"timing_valid",p342ValidDuration(destroyMs),"memory_sampling_enabled",sampleMemory,"memory_before",before,"memory_after",after,"working_set_release_bytes",before.working_set_bytes-after.working_set_bytes,"private_release_bytes",before.private_bytes-after.private_bytes));
endfunction

function response=p35HandleMemoryCheckpoint(message)
 snap=p342ProcessMemorySnapshot();response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.experience.memory.response","request_id",message.request_id,"status","success","payload",snap);
endfunction

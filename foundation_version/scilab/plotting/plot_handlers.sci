function response=p3HandleDatasetCreate(message)
 global P2_APP_ROOT P3_DATASET_ID P3_CURVE_COUNT P3_POINTS_PER_CURVE P3_X_MIN P3_X_MAX P3510_AIFT_FILES P3510_AIFT_LOAD_MS P3510_AIFT_POINTS; p=message.payload;folder=fullfile(P2_APP_ROOT,"data","aift");try;[count,totalPoints,loadMs]=p3510LoadAiftDataset(folder,p.curve_count);catch;response=p2ProtocolError(message.request_id,"AIFT_LOAD_FAILED",lasterror(),%f);return;end;response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.dataset.create.response","request_id",message.request_id,"status","success","payload",struct("dataset_id",P3_DATASET_ID,"dataset_type","aift","curve_count",P3_CURVE_COUNT,"points_per_curve",P3_POINTS_PER_CURVE,"source_points",totalPoints,"ownership","scilab","x_min",P3_X_MIN,"x_max",P3_X_MAX,"utsread_total_ms",loadMs,"file_count",size(P3510_AIFT_FILES,"*"),"available_file_count",size(listfiles(fullfile(folder,"*.aift")),"*"),"per_file_load_ms",P3510_AIFT_LOAD_MS,"points_per_file",P3510_AIFT_POINTS));
endfunction
function response=p3HandleMetadata(message)
 global P3_DATASET_ACTIVE P3_DATASET_ID P3_CURVE_COUNT P3_POINTS_PER_CURVE P3_X_MIN P3_X_MAX P3510_AIFT_FILES P3510_AIFT_LOAD_MS P3510_AIFT_POINTS;
 if ~P3_DATASET_ACTIVE then response=p2ProtocolError(message.request_id,"DATASET_NOT_ACTIVE","Create a dataset first.",%f);return;end
 response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.dataset.metadata.response","request_id",message.request_id,"status","success", ...
 "payload",struct("dataset_id",P3_DATASET_ID,"dataset_type","aift","curve_count",P3_CURVE_COUNT,"points_per_curve",P3_POINTS_PER_CURVE,"source_points",sum(P3510_AIFT_POINTS),"x_min",P3_X_MIN,"x_max",P3_X_MAX,"files",P3510_AIFT_FILES,"per_file_load_ms",P3510_AIFT_LOAD_MS,"points_per_file",P3510_AIFT_POINTS));
endfunction
function response=p3HandleViewport(message)
 global P3_DATASET_ACTIVE P3_CURVE_COUNT P3_POINTS_PER_CURVE P3_VIEWPORT_CACHE_KEYS P3_VIEWPORT_CACHE_VALUES;
 if ~P3_DATASET_ACTIVE then response=p2ProtocolError(message.request_id,"DATASET_NOT_ACTIVE","Create a dataset first.",%f);return;end
 p=message.payload;ids=p.curve_ids;if ids==[] then response=p2ProtocolError(message.request_id,"NO_VISIBLE_CURVES","No visible curves requested.",%f);return;end
 if p.pixel_width<=0|p.x_min>=p.x_max then response=p2ProtocolError(message.request_id,"INVALID_VIEWPORT","Viewport dimensions are invalid.",%f);return;end
 validationMode=%f;if p2HasField(p,"validation_mode") then validationMode=p.validation_mode;end
 modeName="production";if validationMode then modeName="validation";end
 key=modeName+"|"+string(p.x_min)+"|"+string(p.x_max)+"|"+string(p.pixel_width)+"|"+strcat(string(ids),",")+"|"+p.algorithm;
 hit=find(P3_VIEWPORT_CACHE_KEYS==key);if hit<>[] then response=P3_VIEWPORT_CACHE_VALUES(hit(1));response.request_id=message.request_id;response.payload.cache_hit=%t;return;end
 outerStart=getdate();sourceAccumMs=0;rangeSearchMs=0;rangeSliceMs=0;reductionAccumMs=0;fidelityAccumMs=0;assemblyAccumMs=0;pyramidBuildMs=0;pyramidLookupMs=0;pyramidColdCurves=0;pyramidWarmCurves=0;pyramidCandidatePoints=0;allX=list();allY=list();delivered=0;sourceVisible=0;maxErr=0;minErr=0;rmsMax=0;areaMax=0;posPeak=0;negPeak=0;posTime=0;negTime=0;firstMax=0;lastMax=0;boundaryMax=0;pyramidLevel=0;
 for k=1:size(ids,"*")
  ci=ids(k);if ci<1|ci>P3_CURVE_COUNT then response=p2ProtocolError(message.request_id,"CURVE_ID_OUT_OF_RANGE","Curve ID is invalid.",%f);return;end
  if %f then // P3.5.11.1 pyramid retired from AIFT workflow
   [xr,yr,pb,plook,pcold,pcandidates]=p358PyramidViewport(ci,p.x_min,p.x_max,p.pixel_width);pyramidBuildMs=pyramidBuildMs+pb;pyramidLookupMs=pyramidLookupMs+plook;pyramidCandidatePoints=pyramidCandidatePoints+pcandidates;if pcold then pyramidColdCurves=pyramidColdCurves+1;else pyramidWarmCurves=pyramidWarmCurves+1;end;sourceVisible=sourceVisible+pcandidates;
  else
   stageStart=getdate();global P3510_AIFT_X P3510_AIFT_Y;x0=P3510_AIFT_X(ci);y0=P3510_AIFT_Y(ci);searchStart=getdate();inside=find(x0>=p.x_min&x0<=p.x_max);rangeSearchMs=rangeSearchMs+etime(getdate(),searchStart)*1000;sliceStart=getdate();if inside==[] then [d,idx]=min(abs(x0-(p.x_min+p.x_max)/2));x=x0(idx);y=y0(idx);else a=max(1,inside(1)-1);z=min(size(x0,"*"),inside($)+1);x=x0(a:z);y=y0(a:z);end;rangeSliceMs=rangeSliceMs+etime(getdate(),sliceStart)*1000;sourceAccumMs=sourceAccumMs+etime(getdate(),stageStart)*1000;sourceVisible=sourceVisible+size(x,"*");stageStart=getdate();select p.algorithm
   case "flmm" then [xr,yr]=p3ReduceFLMM(x,y,p.pixel_width);
   case "lttb" then [xr,yr]=p3ReduceLTTB(x,y,max(3,2*p.pixel_width));
   case "pyramid" then [xr,yr,pl]=p3ReducePyramid(x,y,p.pixel_width);pyramidLevel=max(pyramidLevel,pl);
   else [xr,yr]=p3ReduceMinMax(x,y,p.pixel_width);
   end;reductionAccumMs=reductionAccumMs+etime(getdate(),stageStart)*1000;
  end
  if validationMode then tic();f=p3Fidelity(y,yr);fa=p3FidelityAdvanced(x,y,xr,yr);maxErr=max(maxErr,f.max_error);minErr=max(minErr,f.min_error);rmsMax=max(rmsMax,fa.rms_error);areaMax=max(areaMax,fa.area_relative_error);posPeak=max(posPeak,fa.positive_peak_error);negPeak=max(negPeak,fa.negative_peak_error);posTime=max(posTime,fa.positive_peak_time_error);negTime=max(negTime,fa.negative_peak_time_error);firstMax=max(firstMax,fa.first_error);lastMax=max(lastMax,fa.last_error);boundaryMax=max(boundaryMax,fa.boundary_error);fidelityAccumMs=fidelityAccumMs+toc()*1000;end
  tic();allX(k)=xr;allY(k)=yr;delivered=delivered+size(xr,"*");assemblyAccumMs=assemblyAccumMs+toc()*1000;
 end
 totalHostMs=etime(getdate(),outerStart)*1000;payloadStart=getdate();
 payload=struct("curve_ids",ids,"x",allX,"y",allY,"algorithm",p.algorithm,"pixel_width",p.pixel_width,"source_visible_points",sourceVisible,"delivered_points",delivered, ...
 "max_extrema_error",maxErr,"min_extrema_error",minErr,"rms_error_max",rmsMax,"area_relative_error_max",areaMax,"positive_peak_error_max",posPeak,"negative_peak_error_max",negPeak,"positive_peak_time_error_max",posTime,"negative_peak_time_error_max",negTime,"first_error_max",firstMax,"last_error_max",lastMax,"boundary_error_max",boundaryMax,"pyramid_level",pyramidLevel, ...
 "full_resolution_retained",%t,"browser_full_copy",%f,"cache_hit",%f,"processing_mode",modeName,"validation_performed",validationMode,"host_ms",totalHostMs,"source_generation_ms",sourceAccumMs,"reduction_ms",reductionAccumMs,"fidelity_ms",fidelityAccumMs,"response_assembly_ms",assemblyAccumMs,"pyramid_build_ms",pyramidBuildMs,"pyramid_lookup_ms",pyramidLookupMs,"pyramid_cold_curves",pyramidColdCurves,"pyramid_warm_curves",pyramidWarmCurves,"pyramid_candidate_points",pyramidCandidatePoints,"estimated_numeric_payload_bytes",16*delivered);
 payloadStructureMs=etime(getdate(),payloadStart)*1000;payload.host_timing=struct("range_search_ms",rangeSearchMs,"range_slice_ms",rangeSliceMs,"source_total_ms",sourceAccumMs,"minmax_reduction_ms",reductionAccumMs,"list_assignment_ms",assemblyAccumMs,"fidelity_ms",fidelityAccumMs,"payload_structure_ms",payloadStructureMs,"host_total_before_encoding_ms",totalHostMs+payloadStructureMs);
 response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.viewport.response","request_id",message.request_id,"status","success","payload",payload);
 P3_VIEWPORT_CACHE_KEYS($+1)=key;P3_VIEWPORT_CACHE_VALUES($+1)=response;if size(P3_VIEWPORT_CACHE_KEYS,"*")>20 then P3_VIEWPORT_CACHE_KEYS=P3_VIEWPORT_CACHE_KEYS($-19:$);P3_VIEWPORT_CACHE_VALUES=P3_VIEWPORT_CACHE_VALUES($-19:$);end
endfunction
function response=p3HandlePointQuery(message)
 global P3_DATASET_ACTIVE P3_CURVE_COUNT;if ~P3_DATASET_ACTIVE then response=p2ProtocolError(message.request_id,"DATASET_NOT_ACTIVE","Load AIFT dataset first.",%f);return;end;p=message.payload;if p.curve_id<1|p.curve_id>P3_CURVE_COUNT then response=p2ProtocolError(message.request_id,"CURVE_ID_OUT_OF_RANGE","Curve ID is invalid.",%f);return;end;[x,y,idx]=p3510AiftPoint(p.curve_id,p.x);response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.point.query.response","request_id",message.request_id,"status","success","payload",struct("curve_id",p.curve_id,"index",idx,"x",x,"y",y,"resolution","full","source","aift"));
endfunction
function response=p3HandleCacheStatus(message)
 global P3_VIEWPORT_CACHE_KEYS;response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.cache.status.response","request_id",message.request_id,"status","success","payload",struct("entries",size(P3_VIEWPORT_CACHE_KEYS,"*")));
endfunction
function response=p3HandleCacheClear(message)
 global P3_VIEWPORT_CACHE_KEYS P3_VIEWPORT_CACHE_VALUES;P3_VIEWPORT_CACHE_KEYS=[];P3_VIEWPORT_CACHE_VALUES=list();response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","plot.cache.cleared","request_id",message.request_id,"status","success","payload",struct("entries",0));
endfunction

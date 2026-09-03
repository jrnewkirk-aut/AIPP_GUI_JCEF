global P7_METRIC_LINES P7_METRIC_MAX_RECORDS;
P7_METRIC_MAX_RECORDS=200;
if ~isdef("P7_METRIC_LINES") then P7_METRIC_LINES=[];end

function tf=p7ValidMetricValue(value)
    tf=type(value)==1 & size(value,"*")==1 & ~isnan(value) & ~isinf(value) & value>=0;
endfunction

function metric=p7RecordMetric(name,value,unitName,requestId,transferId,details)
    global P7_METRIC_LINES P7_METRIC_MAX_RECORDS;
    if ~p7ValidMetricValue(value) then error("Metric value must be finite, scalar, and nonnegative: "+name);end
    metric=struct("schema_version","1.0","timestamp_s",getdate("s"),"runtime","scilab","name",name,"value",value,"unit",unitName,"status","success","request_id",requestId,"transfer_id",transferId,"details",details);
    line=toJSON(metric);if P7_METRIC_LINES==[] then P7_METRIC_LINES=line;else P7_METRIC_LINES($+1)=line;end
    if size(P7_METRIC_LINES,"*")>P7_METRIC_MAX_RECORDS then P7_METRIC_LINES=P7_METRIC_LINES($-P7_METRIC_MAX_RECORDS+1:$);end
endfunction

function metric=p7RecordDuration(name,durationMs,requestId,transferId,details)
    metric=p7RecordMetric(name,durationMs,"ms",requestId,transferId,details);
endfunction

function lines=p7MetricSnapshot()
    global P7_METRIC_LINES;lines=P7_METRIC_LINES;
endfunction

function p7MetricClear()
    global P7_METRIC_LINES;P7_METRIC_LINES=[];
endfunction

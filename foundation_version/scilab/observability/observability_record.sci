function result = p7ValidateObservabilityRecord(record)
    global P7_OBS_LEVELS P7_OBS_CATEGORIES;
    errors=[];
    if typeof(record)<>"st" then result=struct("pass",%f,"errors","record must be a struct");return;end
    fields=fieldnames(record);
    required=["timestamp_s";"runtime";"level";"category";"event";"request_id";"transfer_id";"details"];
    for i=1:size(required,"*")
        if grep(fields,required(i))==[] then errors($+1)="missing "+required(i);end
    end
    if grep(fields,"runtime")<>[] & ~or(record.runtime==["browser","scilab"]) then errors($+1)="invalid runtime";end
    if grep(fields,"level")<>[] & ~p7ObsContains(P7_OBS_LEVELS,record.level) then errors($+1)="invalid level";end
    if grep(fields,"category")<>[] & ~p7ObsContains(P7_OBS_CATEGORIES,record.category) then errors($+1)="invalid category";end
    result=struct("pass",errors==[],"errors",errors);
endfunction

function record = p7CreateObservabilityRecord(level,category,eventName,requestId,transferId,details)
    global P7_OBS_SCHEMA_VERSION;
    record=struct("schema_version",P7_OBS_SCHEMA_VERSION,"timestamp_s",getdate("s"),"runtime","scilab","level",level,"category",category,"event",eventName,"request_id",requestId,"transfer_id",transferId,"details",details);
    validation=p7ValidateObservabilityRecord(record);if ~validation.pass then error("Invalid observability record: "+strcat(validation.errors,"; "));end
endfunction

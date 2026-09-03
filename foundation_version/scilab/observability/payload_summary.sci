function summary = p7PayloadSummary(value)
    valueType=typeof(value);
    summary=struct("kind",valueType,"full_payload_logged",%f);
    select valueType
    case "constant" then
        count=size(value,"*"); summary.kind="numeric_array"; summary.count=count; summary.rows=size(value,1); summary.columns=size(value,2); summary.estimated_bytes=count*8;
        if count>0 then indexes=unique([1,max(1,ceil(count/2)),count]); summary.sample_indices=indexes; summary.sample_values=value(indexes); else summary.sample_indices=[];summary.sample_values=[];end
    case "string" then
        count=length(value); summary.kind="string"; summary.length=count; sampleLength=min(count,160); if sampleLength>0 then summary.sample=part(value,1:sampleLength);else summary.sample="";end;summary.truncated=count>sampleLength;
    case "st" then
        names=fieldnames(value); summary.kind="object"; summary.field_count=size(names,"*"); summary.fields=names(1:min(size(names,"*"),20)); summary.truncated_fields=size(names,"*")>20;
    else
        summary.kind=valueType; summary.rows=size(value,1); summary.columns=size(value,2);
    end
endfunction

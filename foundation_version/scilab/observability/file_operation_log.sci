function tf = p7ValidFileStage(stage)
    tf=or(stage==["dialog","path_validation","open","read","parse","serialize","write","commit","close"]);
endfunction

function p7LogFileOperation(level,eventName,operation,stage,requestId,details)
    if ~p7ValidFileStage(stage) then error("Invalid file operation stage: "+stage);end
    eventDetails=struct("operation",operation,"stage",stage,"context",details);
    p7HostLog(level,"file_io",eventName,requestId,"",eventDetails);
endfunction

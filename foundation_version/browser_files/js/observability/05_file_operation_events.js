"use strict";
(function(root){
  const P7=root.P7,stages=Object.freeze(["dialog","path_validation","open","read","parse","serialize","write","commit","close"]);
  function assertStage(stage){if(!stages.includes(stage))throw new Error(`Invalid file operation stage: ${stage}`);}
  P7.fileOperations={stages,started(operation,stage,context={},details={}){assertStage(stage);return P7.logger.info("file_io","file_io.operation_started",context,{operation,stage,...details});},completed(operation,stage,context={},details={}){assertStage(stage);return P7.logger.info("file_io","file_io.operation_completed",context,{operation,stage,...details});},failed(operation,stage,error,context={},details={}){assertStage(stage);return P7.logger.error("file_io","file_io.operation_failed",context,{operation,stage,error_code:error?.code||error?.name||"FILE_OPERATION_FAILED",error_message:error?.message||String(error),...details});}};
})(window);

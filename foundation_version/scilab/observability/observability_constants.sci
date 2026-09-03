global P7_OBS_SCHEMA_VERSION P7_OBS_LEVELS P7_OBS_CATEGORIES P7_OBS_MAX_RECORDS;
P7_OBS_SCHEMA_VERSION="1.0";
P7_OBS_LEVELS=["debug";"info";"warn";"error"];
P7_OBS_CATEGORIES=["startup";"build";"transport";"protocol";"file_io";"state";"render";"plot";"performance";"test"];
P7_OBS_MAX_RECORDS=200;

function tf = p7ObsContains(values, value)
    tf = grep(values, value) <> [];
endfunction

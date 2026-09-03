// P6.3 production validate-only gate.
function result=p63ValidateProductionBundle(appRoot)
    bundlePath=fullfile(appRoot,"browser_files","dist","bundle.prod.html");
    if ~isfile(bundlePath) then error("BUILD_MISSING_PRODUCTION_BUNDLE: "+bundlePath);end
    lines=mgetl(bundlePath);
    if lines==[] then error("BUILD_BUNDLE_EMPTY: "+bundlePath);end
    text=strcat(lines,ascii(10));
    if length(text)<10000 then error("BUILD_BUNDLE_TOO_SMALL: "+string(length(text)));end
    required=["P6.4.0-0.1";"P2.application.registry.register(""ping""";"application.example.ping.request";"application.aipp.status.request"];
    for i=1:size(required,"*")
        if strindex(text,required(i))==[] then error("BUILD_REQUIRED_MARKER_MISSING: "+required(i));end
    end
    forbidden=["__JCEF_TEST_API__";"P4.register";"<!-- P4_STYLES -->";"<!-- P4_COMPONENTS -->";"<!-- P4_SCRIPTS -->"];
    for i=1:size(forbidden,"*")
        if strindex(text,forbidden(i))<>[] then error("BUILD_PRODUCTION_FORBIDDEN: "+forbidden(i));end
    end
    result=struct("valid",%t,"path",bundlePath,"characters",length(text),"mode","production_validate_only");
endfunction

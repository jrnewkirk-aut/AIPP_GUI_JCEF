function response=p45IntentionalHandlerFailure(message)
    error("INTENTIONAL_P45_HANDLER_FAILURE");
endfunction
function row=p4TestRow(id,name,requirements,pass,durationMs,details)
    row=struct("test_id",id,"name",name,"requirements",requirements,"pass",pass,"duration_ms",durationMs,"details",details);
endfunction
function rows=p4RunScilabTests(tier)
    rows=list();
    t=getdate(); m=struct("protocol","scilab-jcef","protocol_version",1,"type","diagnostic.echo.request","request_id","p4-unit","payload",struct()); [ok,e]=p2ValidateEnvelope(m); rows($+1)=p4TestRow("SC-PRO-001","Valid envelope accepted",["PRO-001","PRO-002","PRO-003"],ok,etime(getdate(),t)*1000,struct("validation_error",e));
    t=getdate(); bad=m; bad=rmfield(bad,"type"); [ok,e]=p2ValidateEnvelope(bad); rows($+1)=p4TestRow("SC-PRO-002","Missing type rejected",["PRO-001","TST-003"],~ok,etime(getdate(),t)*1000,struct("validation_error",e));
    t=getdate(); bad=m; bad.protocol_version=99; [ok,e]=p2ValidateEnvelope(bad); rows($+1)=p4TestRow("SC-PRO-003","Unsupported version rejected",["PRO-014","TST-003"],~ok,etime(getdate(),t)*1000,struct("validation_error",e));
    t=getdate(); chunks=list("abc","def","ghi"); assembled=chunks(1)+chunks(2)+chunks(3); rows($+1)=p4TestRow("SC-XFR-001","Ordered chunk assembly",["PRO-010"],assembled=="abcdefghi",etime(getdate(),t)*1000,struct("assembled",assembled));
    t=getdate(); seen=[0 0 0]; duplicate=%f; idx=[1 2 2]; for i=1:size(idx,"*"); if seen(idx(i))==1 then duplicate=%t; else seen(idx(i))=1; end; end; rows($+1)=p4TestRow("SC-XFR-002","Duplicate chunk detected",["PRO-010","TST-003"],duplicate,etime(getdate(),t)*1000,struct("duplicate",duplicate));
    t=getdate(); x=0:0.001:1; y=sin(2*%pi*x); y(201)=10; y(801)=-8; [xr,yr]=p3ReduceMinMax(x,y,120); pass=(abs(max(yr)-10)<1d-12)&(abs(min(yr)+8)<1d-12); rows($+1)=p4TestRow("SC-PLOT-001","Min/max extrema preserved",["PLT-006"],pass,etime(getdate(),t)*1000,struct("source_min",min(y),"source_max",max(y),"reduced_min",min(yr),"reduced_max",max(yr)));
    t=getdate(); x1=0:0.1:10; x2=-5:0.2:15; ids1=find(x1>=2&x1<=4); ids2=find(x2>=2&x2<=4); pass=(size(ids1,"*")>0)&(size(ids2,"*")>0)&(x1(ids1(1))>=2)&(x2(ids2($))<=4); rows($+1)=p4TestRow("SC-PLOT-002","Independent-X range query",["PLT-007"],pass,etime(getdate(),t)*1000,struct("curve1_count",size(ids1,"*"),"curve2_count",size(ids2,"*")));
    // P4.5 direct codec, router, and transfer-closure coverage.
    t=getdate(); original=struct("text","P4.5 unicode - cafe","values",[1 2 3]); decoded=p2DecodeControl(p2EncodeControl(original)); pass=decoded.text==original.text & and(decoded.values==original.values); rows($+1)=p4TestRow("SC-CODEC-001","Control codec round trip",["PRO-002","PRO-005"],pass,etime(getdate(),t)*1000,struct("decoded_text",decoded.text));
    t=getdate(); column=[65;66;67]; row=p2AsRow(column); pass=size(row,1)==1 & ascii(row)=="ABC"; rows($+1)=p4TestRow("SC-CODEC-002","Codec normalizes numeric bytes to row orientation",["TRN-005"],pass,etime(getdate(),t)*1000,struct("rows",size(row,1),"columns",size(row,2)));
    t=getdate(); rejected=%f;try;p2DecodeControl("not-numeric");catch;rejected=%t;end;rows($+1)=p4TestRow("SC-CODEC-003","Codec rejects nonnumeric control payload",["PRO-005","TST-003"],rejected,etime(getdate(),t)*1000,struct("rejected",rejected));
    t=getdate(); unknown=m;unknown.type="test.no.handler";r=p2RouteMessage(unknown);hookInstalled=exists("p45IntentionalHandlerFailure")==1;hookThrows=%f;hook=m;hook.type="test.handler.throw.request";try;p2RouteMessage(hook);catch;hookThrows=strindex(lasterror(),"INTENTIONAL_P45_HANDLER_FAILURE")<>[];end;pass=r.status=="error" & r.error.code=="UNSUPPORTED_TYPE" & hookInstalled & hookThrows;rows($+1)=p4TestRow("SC-ROUTE-001","Router returns structured unknown-type error and test failure hook is installed",["PRO-006","PRO-007"],pass,etime(getdate(),t)*1000,struct("code",r.error.code,"test_hook_installed",hookInstalled,"test_hook_throws",hookThrows));
    t=getdate(); global P2_LIBRARY_ACTIVE;oldActive=P2_LIBRARY_ACTIVE;P2_LIBRARY_ACTIVE=%f;blocked=m;blocked.type="diagnostic.echo.request";r=p2RouteMessage(blocked);P2_LIBRARY_ACTIVE=oldActive;pass=r.status=="error" & r.error.code=="LIBRARY_INACTIVE";rows($+1)=p4TestRow("SC-ROUTE-002","Inactive router rejects ordinary work",["PRO-009","TST-003"],pass,etime(getdate(),t)*1000,struct("code",r.error.code));
    t=getdate();p2GenericReset();start=struct("request_id","sc-xfr-start","payload",struct("transfer_id","sc-gx","chunk_count",2,"total_size",4,"checksum",394,"timeout_ms",5000));r1=p2GenericStart(start);chunk=struct("request_id","sc-xfr-chunk","payload",struct("transfer_id","sc-gx","chunk_index",0,"data","ab","chunk_checksum",195));r2=p2GenericChunk(chunk);complete=struct("request_id","sc-xfr-complete","payload",struct("transfer_id","sc-gx"));r3=p2GenericComplete(complete);pass=r1.status=="success" & r2.status=="success" & r3.error.code=="INCOMPLETE_TRANSFER";rows($+1)=p4TestRow("SC-XFR-003","Missing generic chunk resets transfer",["PRO-010","TST-003"],pass,etime(getdate(),t)*1000,struct("code",r3.error.code));
    t=getdate();p2GenericReset();start.payload.transfer_id="sc-gx-range";r1=p2GenericStart(start);chunk.payload.transfer_id="sc-gx-range";chunk.payload.chunk_index=3;r2=p2GenericChunk(chunk);p2GenericReset();pass=r2.error.code=="CHUNK_INDEX_OUT_OF_RANGE";rows($+1)=p4TestRow("SC-XFR-004","Out-of-range generic chunk is rejected",["PRO-010","TST-003"],pass,etime(getdate(),t)*1000,struct("code",r2.error.code));
    t=getdate();p2GenericReset();start.payload.transfer_id="sc-gx-check";r1=p2GenericStart(start);chunk.payload.transfer_id="sc-gx-check";chunk.payload.chunk_index=0;chunk.payload.chunk_checksum=999;r2=p2GenericChunk(chunk);p2GenericReset();pass=r2.error.code=="CHUNK_CHECKSUM_MISMATCH";rows($+1)=p4TestRow("SC-XFR-005","Per-chunk checksum failure is rejected",["PRO-010","TST-003"],pass,etime(getdate(),t)*1000,struct("code",r2.error.code));
    t=getdate();p2GenericReset();start.payload.transfer_id="sc-gx-cancel";r1=p2GenericStart(start);cancel=struct("request_id","sc-xfr-cancel","payload",struct("transfer_id","sc-gx-cancel","reason","unit cleanup"));r2=p2GenericCancel(cancel);status=p2GenericStatus(struct("request_id","sc-xfr-status","payload",struct()));pass=r2.status=="success" & ~status.payload.active;rows($+1)=p4TestRow("SC-XFR-006","Generic cancellation clears active state",["PRO-010"],pass,etime(getdate(),t)*1000,struct("active",status.payload.active));
    t=getdate();p2GenericReset();start.payload.transfer_id="sc-gx-size";start.payload.chunk_count=1;start.payload.total_size=5;start.payload.checksum=195;r1=p2GenericStart(start);chunk.payload.transfer_id="sc-gx-size";chunk.payload.chunk_index=0;chunk.payload.data="ab";chunk.payload.chunk_checksum=195;r2=p2GenericChunk(chunk);complete.payload.transfer_id="sc-gx-size";r3=p2GenericComplete(complete);pass=r3.error.code=="TOTAL_SIZE_MISMATCH";rows($+1)=p4TestRow("SC-XFR-007","Declared generic size mismatch prevents commit",["PRO-010","TST-003"],pass,etime(getdate(),t)*1000,struct("code",r3.error.code));
    // P5.3.1 architecture qualification. These rows must remain inside p4RunScilabTests.
    t=getdate(); global P2_APP_ROOT; appRoot=fullpath(P2_APP_ROOT); pass=isdir(appRoot) & isfile(fullfile(appRoot,"app","main.sce")); rows($+1)=p4TestRow("SC-ARC-001","Launcher anchors application root",["ARC-001"],pass,etime(getdate(),t)*1000,struct("app_root",appRoot,"canonical_launcher",fullfile(appRoot,"app","main.sce")));
    t=getdate(); global P2_LIBRARY_ACTIVE P2_TX_ACTIVE P2_GX_ACTIVE P2_HOST_LOG_LINES P2_GX_COMMITTED; flagsScalar=size(P2_LIBRARY_ACTIVE,"*")==1 & size(P2_TX_ACTIVE,"*")==1 & size(P2_GX_ACTIVE,"*")==1; lifecycleCorrect=P2_LIBRARY_ACTIVE & ~P2_TX_ACTIVE & ~P2_GX_ACTIVE; hostLogInitialized=typeof(P2_HOST_LOG_LINES)=="constant" | typeof(P2_HOST_LOG_LINES)=="string"; genericCommitInitialized=typeof(P2_GX_COMMITTED)=="constant" | typeof(P2_GX_COMMITTED)=="string"; pass=flagsScalar & lifecycleCorrect & hostLogInitialized & genericCommitInitialized; rows($+1)=p4TestRow("SC-ARC-002","Foundation runtime owns initialized lifecycle state",["ARC-001"],pass,etime(getdate(),t)*1000,struct("flags_scalar",flagsScalar,"lifecycle_correct",lifecycleCorrect,"library_active",P2_LIBRARY_ACTIVE,"numeric_active",P2_TX_ACTIVE,"generic_active",P2_GX_ACTIVE,"host_log_initialized",hostLogInitialized,"generic_commit_initialized",genericCommitInitialized,"host_log_type",typeof(P2_HOST_LOG_LINES),"generic_commit_type",typeof(P2_GX_COMMITTED)));
    t=getdate(); global P55_APP_ROUTE_TYPES; appMessage=m;appMessage.type="application.example.ping.request";r=p2RouteMessage(appMessage);pass=r.status=="success" & r.payload.message=="pong" & or(P55_APP_ROUTE_TYPES==appMessage.type);rows($+1)=p4TestRow("SC-APP-001","Application handler registry resolves declared operation",["ARC-005","ARC-010"],pass,etime(getdate(),t)*1000,struct("registered",or(P55_APP_ROUTE_TYPES==appMessage.type),"source",r.payload.source));
    t=getdate(); duplicateRejected=%f;try;p55RegisterApplicationRoute("application.example.ping.request","p55HandleReferencePing");catch;duplicateRejected=strindex(lasterror(),"DUPLICATE_APPLICATION_ROUTE")<>[];end;rows($+1)=p4TestRow("SC-APP-002","Duplicate application route is rejected",["TST-003","ARC-010"],duplicateRejected,etime(getdate(),t)*1000,struct("duplicate_rejected",duplicateRejected));
    t=getdate(); sumMessage=m;sumMessage.type="application.example.sum.request";sumMessage.payload=struct("values",[1 2 3 4]);r=p2RouteMessage(sumMessage);pass=r.status=="success" & r.payload.sum==10 & r.payload.count==4;rows($+1)=p4TestRow("SC-EXT-001","Application sum handler returns deterministic result",["ARC-005","ARC-010"],pass,etime(getdate(),t)*1000,struct("sum",r.payload.sum,"count",r.payload.count));
    t=getdate(); badSum=m;badSum.type="application.example.sum.request";badSum.payload=struct();r=p2RouteMessage(badSum);pass=r.status=="error" & r.error.code=="INVALID_APPLICATION_PAYLOAD";rows($+1)=p4TestRow("SC-EXT-002","Application sum handler rejects missing values",["PRO-011","TST-003"],pass,etime(getdate(),t)*1000,struct("code",r.error.code));
    t=getdate(); global P55_APP_ROUTE_TYPES;pass=or(P55_APP_ROUTE_TYPES=="application.example.sum.request") & or(P55_APP_ROUTE_TYPES=="application.example.ping.request");rows($+1)=p4TestRow("SC-EXT-003","Application registry contains both declared routes",["ARC-005","ARC-010"],pass,etime(getdate(),t)*1000,struct("route_count",size(P55_APP_ROUTE_TYPES,"*")));
endfunction  
function response=p4HandleScilabTests(message)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    tier="standard"; if isfield(message.payload,"tier") then tier=message.payload.tier; end
    rows=p4RunScilabTests(tier); passed=0; for i=1:length(rows); if rows(i).pass then passed=passed+1; end; end
    payload=struct("tier",tier,"total",length(rows),"passed",passed,"failed",length(rows)-passed,"results",rows);
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","test.scilab.run.response","request_id",message.request_id,"status","success","payload",payload);
endfunction

function response=p411HandleArtifactInspect(message)
    global P2_APP_ROOT P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    prodPath=fullfile(P2_APP_ROOT,"browser_files","dist","bundle.prod.html");
    existsProd=isfile(prodPath); prodText=""; sizeBytes=0;
    if existsProd then
        lines=mgetl(prodPath); if lines<>[] then prodText=strcat(lines,ascii(10)); end
        info=fileinfo(prodPath); if info<>[] then sizeBytes=info(1); end
    end
    tokens=["__JCEF_TEST_API__","P4.register","runAcceptanceButton","featureManifest","MockTransport","components_test","CT-MSG-001","INT-START-001","VIS-BASE-001","P45-CODEC-001"];
    matches=[];
    for i=1:size(tokens,"*")
        if strindex(prodText,tokens(i))<>[] then matches($+1)=tokens(i); end
    end
    moduleText=""; if isfield(message.payload,"module_paths_text") then moduleText=message.payload.module_paths_text; end
    modulePaths=[]; if moduleText<>"" then modulePaths=strsplit(moduleText,"|"); end
    missing=[]; existing=0;
    for i=1:size(modulePaths,"*")
        p=P2_APP_ROOT+filesep()+strsubst(modulePaths(i),"/",filesep());
        if isfile(p) then existing=existing+1; else missing($+1)=modulePaths(i); end
    end
    checks=struct("test_api_absent",strindex(prodText,"__JCEF_TEST_API__")==[], ...
                  "test_registration_absent",strindex(prodText,"P4.register")==[], ...
                  "test_controls_absent",strindex(prodText,"runAcceptanceButton")==[], ...
                  "test_fixtures_absent",strindex(prodText,"featureManifest")==[], ...
                  "mock_transport_absent",strindex(prodText,"MockTransport")==[], ...
                  "contract_fixture_absent",strindex(prodText,"CT-MSG-001")==[], ...
                  "integration_scenario_absent",strindex(prodText,"INT-START-001")==[], ...
                  "visual_baseline_absent",strindex(prodText,"VIS-BASE-001")==[], ...
                  "p45_closure_absent",strindex(prodText,"P45-CODEC-001")==[]);
    payload=struct("artifact","browser_files/dist/bundle.prod.html","exists",existsProd,"size_bytes",sizeBytes, ...
                   "checks",checks,"forbidden_matches",matches,"declared_module_count",size(modulePaths,"*"), ...
                   "existing_module_count",existing,"missing_modules",missing);
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","test.build.artifact.inspect.response", ...
                    "request_id",message.request_id,"status","success","payload",payload);
endfunction

function normalized=p42NormalizeContractFixture(fixture)
    category=fixture.category;
    if category=="message" then
        message=fixture.message; [ok,err]=p2ValidateEnvelope(message); code="";
        if ~ok then code=err.error.code; end
        preserved=%f; if isfield(message,"request_id") then preserved=(typeof(message.request_id)=="string" & message.request_id<>""); end
        normalized=struct("fixture_id",fixture.id,"accepted",ok,"error_code",code,"request_id_preserved",preserved);
    else
        seen=[]; code=""; seq=fixture.sequence;
        for i=1:size(seq,"*")
            idx=seq(i);
            if find(seen==idx)<>[] then code="DUPLICATE_CHUNK"; break; else seen($+1)=idx; end
        end
        if code=="" & fixture.action=="cancel" then code="TRANSFER_CANCELLED"; end
        if code=="" & size(seen,"*")<>fixture.chunk_count then code="INCOMPLETE_TRANSFER"; end
        if code=="" & fixture.checksum_valid==%f then code="TRANSFER_CHECKSUM_MISMATCH"; end
        normalized=struct("fixture_id",fixture.id,"accepted",code=="","error_code",code,"received_count",size(seen,"*"));
    end
endfunction
function response=p42HandleContractFixture(message)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    fixture=fromJSON(message.payload.fixture_json);
    normalized=p42NormalizeContractFixture(fixture);
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","test.contract.evaluate.response","request_id",message.request_id,"status","success","payload",struct("normalized",normalized));
endfunction

function response=p43HandleHostNotification(message)
    global P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    notification=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","test.host.notification", ...
                        "request_id",message.request_id,"status","success","payload",struct("token",message.payload.token));
    p2SendBrowserData(p2EncodeControl(notification));
    response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","test.host.notification.response", ...
                    "request_id",message.request_id,"status","success","payload",struct("sent",%t,"token",message.payload.token));
endfunction

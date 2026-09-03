function checksum=p7DiagnosticChecksum(text)
    values=ascii(text);h=uint32(2166136261);prime=uint32(16777619);
    for i=1:size(values,"*");h=bitxor(h,uint32(values(i)));h=h*prime;end
    checksum=msprintf("%08x",h);
endfunction

function p7WriteText(path,text)
    mputl(strsplit(text,ascii(10)),path);
endfunction

function response=p7HandleDiagnosticPackageExport(message)
    global P2_APP_ROOT P2_PROTOCOL_NAME P2_PROTOCOL_VERSION;
    payload=message.payload;rid=message.request_id;rootDir=fullfile(P2_APP_ROOT,"diagnostic_exports");if ~isdir(rootDir) then mkdir(rootDir);end
    stamp=string(getdate("s"));base="diagnostic_package_"+stamp+"_"+strsubst(rid,"-","_");tempDir=fullfile(rootDir,"."+base+".tmp");finalDir=fullfile(rootDir,base);
    if isdir(tempDir) then rmdir(tempDir,"s");end;mkdir(tempDir);completed=%f;written=0;
    try
        files=payload.files;manifestFiles=list();
        for i=1:size(files,"*")
            item=files(i);target=fullfile(tempDir,item.name);p7WriteText(target,item.content);actual=p7DiagnosticChecksum(item.content);
            if actual<>item.content_hash then error("DIAGNOSTIC_HASH_MISMATCH: "+item.name);end
            manifestFiles($+1)=struct("name",item.name,"size_chars",length(item.content),"hash_algorithm","fnv1a32","content_hash",actual,"collection_status",item.status,"note",item.note);written=written+1;
        end
        manifest=struct("schema_version","1.0","package_kind",payload.package_kind,"created_utc",payload.created_utc,"committed_utc",string(getdate("s")),"correlation_id",rid,"foundation_version","P6.4.0-0.1","pillar7_implementation_version","P7.4.0-0.1","payload_bodies_included",%f,"retention_limit",payload.retention_limit,"archive_format","directory_fallback","files",manifestFiles,"collection",payload.collection);
        manifestText=toJSON(manifest);p7WriteText(fullfile(tempDir,"package_manifest.json"),manifestText);p7WriteText(fullfile(tempDir,"PACKAGE_COMPLETE"),"complete="+string(getdate("s"))+ascii(10)+"correlation_id="+rid);
        [ok,msg]=movefile(tempDir,finalDir);if ~ok then error("DIAGNOSTIC_COMMIT_FAILED: "+msg);end;completed=%t;
        response=struct("protocol",P2_PROTOCOL_NAME,"protocol_version",P2_PROTOCOL_VERSION,"type","diagnostic.package.export.response","request_id",rid,"status","success","payload",struct("path",finalDir,"format","directory_fallback","file_count",written+2,"completed",%t,"manifest","package_manifest.json","completion_marker","PACKAGE_COMPLETE"));
    catch
        if isdir(tempDir) then rmdir(tempDir,"s");end
        response=p2ProtocolError(rid,"DIAGNOSTIC_EXPORT_FAILED",lasterror(),%f);
    end
endfunction

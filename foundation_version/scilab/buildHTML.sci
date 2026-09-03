function text=p4ReadText(path)
    lines=mgetl(path); if lines==[] then text=""; else text=strcat(lines,ascii(10)); end
endfunction
function files=p4Sorted(pattern)
    files=gsort(listfiles(pattern),"g","i");
endfunction
function p4BuildOne(appRoot,mode)
    htmlDir=fullfile(appRoot,"browser_files"); distDir=fullfile(htmlDir,"dist"); if ~isdir(distDir) then mkdir(distDir); end
    html=p4ReadText(fullfile(htmlDir,"index.html")); css=p4ReadText(fullfile(htmlDir,"styles","main.css")); appCss=p4Sorted(fullfile(appRoot,"application","browser","styles","*.css")); for i=1:size(appCss,"*"); css=css+ascii(10)+"/* APPLICATION STYLE: "+appCss(i)+" */"+ascii(10)+p4ReadText(appCss(i)); end; components="";
    if mode=="test" then cdir="components_test"; elseif mode=="dev" then cdir="components_dev"; else cdir="components_prod"; end
    cf=p4Sorted(fullfile(htmlDir,cdir,"*.html")); for i=1:size(cf,"*"); components=components+p4ReadText(cf(i))+ascii(10); end
    observability=p4Sorted(fullfile(htmlDir,"js","observability","*.js"));
    protocol=p4Sorted(fullfile(htmlDir,"js","protocol","*.js")); plotting=p4Sorted(fullfile(htmlDir,"js","plotting","*.js")); app=p4Sorted(fullfile(htmlDir,"js","app","*.js")); vendor=p4Sorted(fullfile(htmlDir,"js","vendor","*.js")); application=p4Sorted(fullfile(htmlDir,"js","application","*.js"));
    // Vendor libraries are application runtime dependencies and must execute before
    // application adapters/views in every mode. The launcher rebuilds bundles at
    // startup, so omitting this directory silently discards prebuilt vendor code.
    if mode=="test" then all=[observability;protocol;plotting;app;vendor;application;p4Sorted(fullfile(htmlDir,"js","testing","*.js"))]; elseif mode=="dev" then all=[observability;protocol;plotting;app;vendor;application;p4Sorted(fullfile(htmlDir,"js","diagnostics","*.js"))]; else all=[observability;protocol;app;vendor;application]; end
    scripts=""; for i=1:size(all,"*"); scripts=scripts+ascii(10)+"// SOURCE: "+all(i)+ascii(10)+p4ReadText(all(i))+ascii(10); end
    html=strsubst(html,"<!-- P4_STYLES -->","<style>"+css+"</style>"); html=strsubst(html,"<!-- P4_COMPONENTS -->",components); html=strsubst(html,"<!-- P4_SCRIPTS -->","<script>"+scripts+"</script>");
    output=fullfile(distDir,"bundle."+mode+".html"); mputl(strsplit(html,ascii(10)),output); mprintf("[P4.5] Built %s\n",output);
endfunction
function buildProtocolStarterHTML(appRoot)
    p4BuildOne(appRoot,"dev"); p4BuildOne(appRoot,"test"); p4BuildOne(appRoot,"prod");
endfunction

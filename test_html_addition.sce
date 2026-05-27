clear;
clc();
close(winsid());
cd(get_absolute_file_path());
exec("buildBrowserHTML.sci");

html = buildBrowserHTML();

f = figure("layout","border");

frame = uicontrol(f,"style","frame","layout","border");

browser = uicontrol(frame, ...
 "style","browser", ...
 "debug","on", ...
 "string", html, ...
 "callback","browserCallback", ...
 "tag","browser");

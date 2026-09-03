function [mainFigure, browserFrame, browserControl] = p52CreateMainWindow(appRoot, config)
    xSize=max(1050,floor(getsystemmetrics("SM_CXFULLSCREEN")*0.90));
    ySize=max(720,floor(getsystemmetrics("SM_CYFULLSCREEN")*0.88));
    mainFigure=figure("infobar_visible","off","toolbar_visible","off","dockable","off","menubar","none","default_axes","off","axes_size",[xSize ySize],"layout","border","resize","on","figure_size",[xSize ySize],"figure_position",[20 20],"figure_name",config.application_name+" "+config.application_version,"tag","p52_main_figure");
    browserFrame=uicontrol(mainFigure,"style","frame","backgroundcolor",[1 1 1],"layout","border","constraints",createConstraints("border","center"),"tag","p52_browser_frame");
    debugValue="off";if config.jcef_debug then debugValue="on";end
    browserControl=uicontrol(browserFrame,"style","browser","debug",debugValue,"string",config.bundle_path,"callback","protocolCallback","tag","p52_primary_browser");
endfunction

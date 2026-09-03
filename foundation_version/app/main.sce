// Scilab-JCEF Foundation P6.4.0 v0.1 + P7.1.2 observability
// Minimum supported version: Scilab 2026.1.0
clear;clc();close(winsid());
APP_ROOT=get_absolute_file_path();APP_ROOT=fullpath(fullfile(APP_ROOT,".."));cd(APP_ROOT);
exec(fullfile(APP_ROOT,"app","app_config.sci"),-1);
exec(fullfile(APP_ROOT,"scilab","bootstrap","module_loader.sci"),-1);
exec(fullfile(APP_ROOT,"scilab","bootstrap","runtime_state.sci"),-1);
exec(fullfile(APP_ROOT,"scilab","bootstrap","window_factory.sci"),-1);
config=p52AppConfig(APP_ROOT);
modules=p521RuntimeModules(config);
for moduleIndex=1:length(modules)
    exec(p521ModulePath(APP_ROOT,modules(moduleIndex)),-1);
end
// buildProtocolStarterHTML is now defined in this top-level scope.
p55RegisterReferenceApplication();
buildProtocolStarterHTML(APP_ROOT);
p52InitializeFoundationState(APP_ROOT);
if config.include_plotting then p52InitializePlottingState();end
global P2_BROWSER;
[f,browserFrame,P2_BROWSER]=p52CreateMainWindow(APP_ROOT,config);
mprintf("[P6.4] Started %s with Scilab %s.\n",config.application_version,getversion());
mprintf("[P6.4] Use Ctrl+Shift+I for JCEF DevTools.\n");

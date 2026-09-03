// Scilab-JCEF reusable starter P6.4.0 v0.1 + P7.1.2 observability
// Minimum supported version: Scilab 2026.1.0
clear;clc();close(winsid());
APP_ROOT=get_absolute_file_path();APP_ROOT=fullpath(fullfile(APP_ROOT,".."));cd(APP_ROOT);
exec(fullfile(APP_ROOT,"app","app_config.sci"),-1);
exec(fullfile(APP_ROOT,"scilab","bootstrap","module_loader.sci"),-1);
exec(fullfile(APP_ROOT,"scilab","bootstrap","runtime_state.sci"),-1);
exec(fullfile(APP_ROOT,"scilab","bootstrap","window_factory.sci"),-1);
exec(fullfile(APP_ROOT,"application","scilab","runtime_bridge.sci"),-1);
config=p54StarterConfig(APP_ROOT);
modules=p521RuntimeModules(config);
for moduleIndex=1:length(modules)
    exec(p521ModulePath(APP_ROOT,modules(moduleIndex)),-1);
end
p55RegisterReferenceApplication();
pAippRuntimeBridgeStart(APP_ROOT);
productionValidation=p63ValidateProductionBundle(APP_ROOT);
mprintf("[P6.3] Production bundle validated without rebuild: %s (%d characters).\n",productionValidation.path,productionValidation.characters);
p52InitializeFoundationState(APP_ROOT);
global P2_BROWSER;
[f,browserFrame,P2_BROWSER]=p52CreateMainWindow(APP_ROOT,config);
mprintf("[P6.4] Started AIPP production workspace %s with Scilab %s.\n",config.application_version,getversion());

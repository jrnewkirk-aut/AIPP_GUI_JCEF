// Compatibility launcher. Canonical launcher: app/main.sce
APP_ROOT=get_absolute_file_path();
exec(fullfile(APP_ROOT,"app","main.sce"),-1);

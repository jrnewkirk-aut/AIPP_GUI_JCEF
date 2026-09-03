function appRoot = p52ResolveAppRoot()
    appRoot = get_absolute_file_path();
    appRoot = fullpath(fullfile(appRoot, "..", ".."));
endfunction

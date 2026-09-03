function modules = p521RuntimeModules(config)
    // Return paths only. app/main.sce executes them at top level so all
    // loaded functions remain available in the application scope.
    modules = list();
    modules($+1)=["scilab" "buildHTML.sci"];
    modules($+1)=["scilab" "build" "production_validation.sci"];
    modules($+1)=["scilab" "observability" "observability_constants.sci"];
    modules($+1)=["scilab" "observability" "payload_summary.sci"];
    modules($+1)=["scilab" "observability" "observability_record.sci"];
    modules($+1)=["scilab" "observability" "observability_log.sci"];
    modules($+1)=["scilab" "observability" "performance_registry.sci"];
    modules($+1)=["scilab" "observability" "diagnostic_package_export.sci"];
    modules($+1)=["scilab" "observability" "file_operation_log.sci"];
    modules($+1)=["scilab" "protocol" "protocol_constants.sci"];
    modules($+1)=["scilab" "protocol" "protocol_codec.sci"];
    modules($+1)=["scilab" "protocol" "protocol_errors.sci"];
    modules($+1)=["scilab" "protocol" "protocol_validation.sci"];
    modules($+1)=["scilab" "protocol" "protocol_handlers.sci"];
    modules($+1)=["scilab" "protocol" "protocol_transfers.sci"];
    modules($+1)=["scilab" "protocol" "protocol_log.sci"];
    modules($+1)=["scilab" "protocol" "protocol_generic_transfer.sci"];
    if config.include_plotting then
        modules($+1)=["scilab" "plotting" "plot_dataset.sci"];
        modules($+1)=["scilab" "plotting" "plot_aift_dataset.sci"];
        modules($+1)=["scilab" "plotting" "plot_reduction.sci"];
    end
    if config.include_testing then
        modules($+1)=["scilab" "testing" "test_runner.sci"];
    end
    if config.include_plotting then
        modules($+1)=["scilab" "plotting" "plot_reduction_p32.sci"];
        modules($+1)=["scilab" "plotting" "plot_pyramid_cache.sci"];
        modules($+1)=["scilab" "plotting" "plot_handlers.sci"];
        modules($+1)=["scilab" "plotting" "native_plot_adapter.sci"];
    end
    modules($+1)=["application" "scilab" "application_registry.sci"];
    modules($+1)=["application" "scilab" "application_state.sci"];
    modules($+1)=["application" "scilab" "application_handlers.sci"];
    if config.include_testing then
        modules($+1)=["scilab" "testing" "extensions" "test_routes.sci"];
    end
    modules($+1)=["scilab" "protocol" "protocol_router.sci"];
    modules($+1)=["scilab" "protocol_callback.sci"];
endfunction

function modulePath = p521ModulePath(appRoot, relativeParts)
    modulePath=appRoot;
    for partIndex=1:size(relativeParts,"*")
        modulePath=fullfile(modulePath,relativeParts(partIndex));
    end
endfunction

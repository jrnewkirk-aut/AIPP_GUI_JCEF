function out = buildHTML(html_dir)
    // Build one self-contained HTML document for the Scilab JCEF browser.
    // Development files are kept modular in:
    //   index.html
    //   styles/main.css
    //   components/*.html
    //   js/*.js
    // Runtime output is written to:
    //   dist/bundle.html

    main_file = fullfile(html_dir, "index.html");
    dist_dir = fullfile(html_dir, "dist");
    bundle_file = fullfile(dist_dir, "bundle.html");

    html = mgetl(main_file);

    // Inline CSS
    css_file = fullfile(html_dir, "styles", "main.css");
    css = mgetl(css_file);
    css_block = cat(1, "<style>", css, "</style>");

    ind_css = grep(html, "styles/main.css");
    if ind_css <> [] then
        html = cat(1, html(1:ind_css-1), css_block, html(ind_css+1:$));
    end

    // Load components in filename order.
    // listfiles may return reverse order, so flipdim is used.
    components = [];
    component_files = listfiles(fullfile(html_dir, "components", "*.html"));
    component_files = flipdim(component_files, 1);

    for i = 1:1:size(component_files, "*")
        components = cat(1, components, mgetl(component_files(i)));
    end

    // Load JavaScript in filename order.
    java = [];
    java_files = listfiles(fullfile(html_dir, "js", "*.js"));
    java_files = flipdim(java_files, 1);

    for i = 1:1:size(java_files, "*")
        java = cat(1, java, mgetl(java_files(i)));
    end

    script_block = cat(1, "<script>", java, "</script>");

    // Replace index body contents with components + scripts.
    ind_start = grep(html, "<body>");
    ind_stop  = grep(html, "</body>");

    if ind_start == [] then
        error("buildHTML: index.html missing <body> line");
    end

    if ind_stop == [] then
        error("buildHTML: index.html missing </body> line");
    end

    html = cat(1, ...
        html(1:ind_start), ...
        components, ...
        script_block, ...
        html(ind_stop:$));

    mputl(html, bundle_file);
    out = html;
endfunction
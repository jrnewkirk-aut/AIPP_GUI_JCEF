clear; clc();
cd(get_absolute_file_path());

html_dir = fullpath("./browser_files");
main = fullfile(html_dir,"index.html");
html = mgetl(main);

//Import style information from CSS
CSS = mgetl(fullfile(html_dir, "styles", "main.css"));

//Find the line that calls out the style file
ind = grep(html, "styles/main.css");
//Replace the line with the style information
html = cat(1, html(1:ind-1), "<style>", CSS, "</style>", html(ind+1:$));

//Find index where the <body> starts in the index file
ind_start = grep(html, "<body>");
//Find the index wher the </body> stops
ind_stop = grep(html, "</body>");

//Load all of the components
components = [];
component_files = listfiles(html_dir + "/components/*.html");
component_files = flipdim(component_files, 1);

for i=1:1:size(component_files,"*")
    components = cat(1, components, mgetl(component_files(i)));
end

//Load all of the Java files
java = []
java_files = listfiles(html_dir + "/js/*.js");
java_files = flipdim(java_files, 1);

for i=1:1:size(java_files,"*")
    java = cat(1, java, mgetl(java_files(i)));
end

html = cat(1, ...
           html(1:ind_start), ...
           components, ...
           "<script>", ...
           java, ...
           "</script>", ...
           html(ind_stop:$));

csvWrite(html, fullfile(html_dir, "dist",  "bundle.html"));

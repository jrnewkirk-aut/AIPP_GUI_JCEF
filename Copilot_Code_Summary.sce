clear; clc(); close(winsid());
cd(get_absolute_file_path());

out(1) = "# AIPP JSON Viewer Code Summary";
out(2) = "This document is used to circumvent the challenges with uploading multiple files to Copilot for code development";
out(3) = "The content will cover the current file structure, scilab codes, dependencies and the browser code structure";
out(4) = "The root folder for this project contains `json_viewer.sce` which is the main program for this GUI interface";
out(5) = "The file structure relative to root is as follows: "
out(6) = "";
//Populate subdirectory structure
[status, tree] = host("tree /F");
out  = cat(1, out, "I will only include files that are relevant to the code development")
out  = cat(1, out, "Please prompt me if you think you need access to a file that is not provided in the markdown summary")
out = cat(1, out, tree);
out = cat(1, out, " ");
out = cat(1, out, "## Main Program: json_viewer.sce")
out = cat(1, out, "```scilab", mgetl("json_viewer.sce"), "```");
out = cat(1, out, " ");

function out = ConcatenateSubfolderContents(folder, level)
    files = listfiles(folder);
    files = flipdim(files, 1);
    disp(files)
    out = [];
    
    for i=1:1:size(files,"*")
       filename = fullfile(folder, files(i));
       ext = fileparts(filename, "extension");
       select ext
       case ".json"
           language = "json"
       case ".html"
           language = "html"
       case ".js"
           language = "java"
       case ".css"
           language = "css"
       case ".sci"
           language = "scilab"
       case ".sce"
           language = "scilab"
       else 
           language = "";
       end
       out = cat(1, out, level + " " + files(i));
       out = cat(1, out, "```" + language);
       out = cat(1, out, mgetl(filename));
       out = cat(1, out, "```");
    end
    
endfunction
//Populate and add aipp_files
out = cat(1, out, "### aipp_files");
folder = fullpath("./aipp_files");
out = cat(1, out, ConcatenateSubfolderContents(folder, "####"));

//Populate and add browser files

out =  cat(1, out, "## dependency map");

out = cat(1, out, "With each code iteration the AI should provide a machine readable dependency map like the one shown below");
out = cat(1, out, "Example dependency map:")
out = cat(1, out, "```json")
out  = cat(1, out, mgetl(fullpath("./browser_files/dependency_map_example.json")))
out = cat(1, out, "When delivering the dependency map it should be located in the file structure under /root/browser_files")
out = cat(1, out, "This script that creates this markdown document is automatically going to paste the last known dependency map below.");
out = cat(1, out, "If the dependency map does not make sense relative to the code snapshot provided throughout this document please warn the user and ask for an update.");
out = cat(1, out, "Current dependency map");
out = cat(1, out, "```json")
out  = cat(1, out, mgetl(fullpath("./browser_files/dependency_map.json")))

out  = cat(1, out, "JSON Message Contract")
out  = cat(1, out, "This section will detail message passing requirements and assumptions between Scilab and the browser")

out = cat(1, out, "### browser_files");

out = cat(1, out, "The full HTML is recreated so it can be read into a single string and passed from Scilab to the JCEF browser");
out  = cat(1, out, "`index.html` is used to create the full structure and `buildHTML.sci` is the function that concatenates the data based on `index.html`")

out = cat(1, out, "`index.html`");
out  = cat(1, out, "```html");
out = cat(1, out, mgetl(fullpath("./browser_files/index.html")));
out  = cat(1, out, "```")
//Populate component files
out = cat(1, out, "#### components");
folder = fullpath("./browser_files/components");
out = cat(1, out, ConcatenateSubfolderContents(folder, "#####"));

//Populate js files
out = cat(1, out, "#### js");
out  = cat(1, out, "Please not that because of how Scilab recreates the full HTML the order of the JS files is critical")
folder = fullpath("./browser_files/js");
out = cat(1, out, ConcatenateSubfolderContents(folder, "#####"));

//Populate style files
out = cat(1, out, "#### styles");
folder = fullpath("./browser_files/styles");
out = cat(1, out, ConcatenateSubfolderContents(folder, "#####"));

//Populate vendor files
out = cat(1, out, "#### vendor");
folder = fullpath("./browser_files/vendor");
out = cat(1, out, ConcatenateSubfolderContents(folder, "#####"));

//Populate dist files (bundle.html)
out = cat(1, out, "#### dist");
folder = fullpath("./browser_files/dist");
out = cat(1, out, ConcatenateSubfolderContents(folder, "#####"));

//Populate scilab functions
out = cat(1, out, "### scilab_functions");
folder = fullpath("./scilab_functions");
out = cat(1, out, ConcatenateSubfolderContents(folder, "####"));


csvWrite(out, fullpath("./working_files/003_CopilotUploadFiles/AIPP_Viewer_Code_Structure.md"));


// ===============================
// Initialization
// ===============================
clear;
clc();
close(winsid());
cd(get_absolute_file_path());
exec("buildHTML.sci", -1);

global browser;
global currentJsonPath;
global currentJsonDir;
currentJsonPath = "";
currentJsonDir = pwd();

// Helper: convert a numeric ASCII vector from browser JSON into a Scilab string.
function txt = aippAsciiToText(a)
    txt = "";
    if size(a, "*") == 0 then
        return;
    end
    // Browser sends row-vector-compatible JSON numeric array.
    for k = 1:size(a, "*")
        txt = txt + ascii(a(k));
    end
endfunction


// Helper: send a struct response to the browser using the existing JSON -> ASCII pattern.
// If your launcher already has a send-to-browser helper, use that instead.
function aippSendBrowserStruct(s, cb)
    msgJson = toJSON(s);
    // The existing GUI fromScilab handler expects JSON text, not ASCII, for simple status messages.
    // If your launcher standardizes Scilab->browser as ASCII, wrap this in your existing helper.
    set(browser, "data", msgJson);
    cb(msgJson);
endfunction


function trackVersions()
    //Read latest bundled version
    new = mgetl(fullpath("./browser_files/dist/bundle.html"));
    //Find the most recent version in saved_bundles
    bundles = listfiles(fullpath("./saved_bundles" + "/*.html"));
    filenames = fileparts(bundles, "fname")
    versions = strtod(strsubst(filenames, "v", ""));
    ind = find(max(versions))
    //Read in the latest version
    old = mgetl(bundles(ind));
    check = string(unique(new == old))
 
    if grep(check, "F") ~= [] then
       new_version = max(versions) + 1;
       copyfile(fullpath("./browser_files/dist/bundle.html"), ...
                fullpath("./saved_bundles/") + ...
                msprintf("v%i.html", new_version));
    end
endfunction

// ===============================
// GUI
// ===============================
x_size = getsystemmetrics("SM_CXFULLSCREEN");
y_size = getsystemmetrics("SM_CYFULLSCREEN") * 0.98;

f = figure("layout", "border", ...
           "figure_size", [x_size y_size], ...
           "figure_position", [0 0], ...
           "menubar", "none", ...
           "toolbar_visible", "off");

frame = uicontrol(f, ...
    "style", "frame", ...
    "layout", "border");

html_dir = fullfile(pwd(), "browser_files");
buildHTML(html_dir);
trackVersions()

browser = uicontrol(frame, ...
    "style", "browser", ...
    "string", fullfile(html_dir, "dist", "bundle.html"), ...
    "callback", "browserCallback", ...
    "debug", "on");


// ===============================
// Callback
// ===============================

function browserCallback(data, cb)
    global browser;

    if isempty(data) then
        return;
    end

    // --------------------------
    // Init
    // --------------------------
    if data == "loaded" then
        disp("Browser ready");
        return;
    end

    // With updated README convention:
    // Browser messages are expected to be valid JSON strings directly.
    JSONstring = data;

    try
        msg = fromJSON(JSONstring);
    catch
        disp("Invalid JSON from browser");
        disp(JSONstring);
        return;
    end

    if ~or(fieldnames(msg) == "type") then
        disp("Missing type field");
        return;
    end

    select msg.type

    // ==========================
    case "select_file" then

        [file, path] = uigetfile("*.json", "Select JSON File");

        if file == "" then
            return;
        end

        fullpath = path + "\" + file;

        // Read file
        lines = mgetl(fullpath);
        jsonText = strcat(lines, ascii(10));
        jsonText = strsubst(jsonText, ascii(13), "");

        // Convert file contents to ASCII array
        asciiData = asciimat(jsonText);

        // Ensure row vector
        if size(asciiData, 1) > 1 then
            asciiData = asciiData';
        end

        // Create browser response
        response = struct();
        response.type = "json_ascii";
        response.data = asciiData;

        jsonOut = toJSON(response);

        set(browser, "data", jsonOut);
        cb(jsonOut);
    case "select_csv" then

        [file, path] = uigetfile("*.csv", "Select CSV File");
    
        if file == "" then
            return;
        end
    
        csvpath = path + "\" + file;
    
        lines = mgetl(csvpath);
        csvText = strcat(lines, ascii(10));
        csvText = strsubst(csvText, ascii(13), "");
    
        asciiData = asciimat(csvText);
        if size(asciiData, 1) > 1 then
            asciiData = asciiData';
        end
    
        response = struct();
        response.type = "csv_ascii";
        response.data = asciiData;
    
        jsonOut = toJSON(response);
        set(browser, "data", jsonOut);
        cb(jsonOut);
    case "request_pyrolist" then
        pyrofile = fullfile(pwd(), "aipp_files", "pyrolist.json");
        response = struct();
        if isfile(pyrofile) then
            lines = mgetl(pyrofile); txt = strcat(lines, ascii(10)); txt = strsubst(txt, ascii(13), "");
            asciiData = asciimat(txt); if size(asciiData, 1) > 1 then asciiData = asciiData'; end
            response.type = "pyrolist_ascii"; response.data = asciiData;
        else
            response.type = "pyrolist_error"; response.message = "Could not find " + pyrofile;
        end
        jsonOut = toJSON(response); set(browser, "data", jsonOut); cb(jsonOut);
    case "save_json_ascii" then
         try
            jsonText = aippAsciiToText(msg.data);
        catch
            r = struct();
            r.type = "save_json_error";
            r.message = "Unable to decode JSON ASCII payload from browser.";
            aippSendBrowserStruct(r, cb);
            return;
        end
    
        startDir = currentJsonDir;
        if startDir == "" then
            startDir = pwd();
        end
    
        // uiputfile starts in the directory passed as the directory argument.
        // Use the same directory as the input JSON file.
        try
            [outName, outDir] = uiputfile(["*.json", "JSON files"], startDir, "Save updated AIPP JSON as");
        catch
            r = struct();
            r.type = "save_json_error";
            r.message = "uiputfile failed while selecting output path.";
            aippSendBrowserStruct(r, cb);
            return;
        end
    
        if outName == "" then
            r = struct();
            r.type = "save_json_cancelled";
            r.message = "User cancelled save dialog.";
            aippSendBrowserStruct(r, cb);
            return;
        end
    
        outPath = outDir + filesep() + outName;
    
        // Ensure .json extension when user omits it.
        [p, n, ext] = fileparts(outPath);
        if ext == "" then
            outPath = outPath + ".json";
        end
    
        try
            // mputl writes a string vector. jsonText may contain line breaks, so split on LF.
            jsonText = strsubst(jsonText, ascii(13), "");
            lines = tokens(jsonText, ascii(10));
            mputl(lines, outPath);
        catch
            r = struct();
            r.type = "save_json_error";
            r.message = "Failed to write selected JSON output file.";
            aippSendBrowserStruct(r, cb);
            return;
        end
    
        // Update current directory so subsequent Save dialogs start from the most recent output location.
        currentJsonPath = outPath;
        currentJsonDir = p;
    
        r = struct();
        r.type = "save_json_success";
        r.path = strsubst(outPath, "\", "/");
        aippSendBrowserStruct(r, cb);

    else
        disp("Unknown type");
        disp(msg.type);
        return;
    end

endfunction



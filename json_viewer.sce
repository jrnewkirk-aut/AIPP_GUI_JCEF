
// ===============================
// Initialization
// ===============================
clear;
clc();
close(winsid());
cd(get_absolute_file_path());
getd(fullpath("./scilab_functions"));

global browser;
global currentJsonPath;
global currentJsonDir;
currentJsonPath = "";
currentJsonDir = pwd();

global aippSaveTransferId;
global aippSaveChunks;
global aippSaveExpectedChunks;
global aippSaveSuggestedName;
aippSaveTransferId = "";
aippSaveChunks = [];
aippSaveExpectedChunks = 0;
aippSaveSuggestedName = "aipp_input_updated.json";


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

// Centralized Scilab -> browser send helper.
function aippSendToBrowser(response, cb)
    global browser;
    jsonOut = toJSON(response);
    jsonOut = sendSafeJSON(jsonOut);
    set(browser, "data", jsonOut);
    cb(jsonOut);
endfunction

// Direct ASCII Scilab -> browser send helper.
function aippSendAsciiToBrowser(response, cb)
    global browser;
    jsonOut = toJSON(response);
    asciiOut = asciimat(jsonOut);
    if size(asciiOut, 1) > 1 then
        asciiOut = asciiOut';
    end
    set(browser, "data", asciiOut);
    cb(asciiOut);
endfunction

// Browser -> Scilab receive helper.
function msg = aippReceiveFromBrowser(data)
    if typeof(data) == "constant" then
        JSONstring = asciimat(data);
    else
        JSONstring = data;
        JSONstring = receiveSafeJSON(JSONstring);
    end
    msg = fromJSON(JSONstring);
endfunction

// Common save routine used by direct and chunked save transports.
function aippSaveJsonTextToLocalFile(jsonText, suggestedName, cb)
    global currentJsonPath;
    global currentJsonDir;

    startDir = currentJsonDir;
    if startDir == "" then
        startDir = pwd();
    end

    try
        [outName, outDir] = uiputfile(["*.json", "JSON files"], startDir, "Save updated AIPP JSON as");
    catch
        r = struct();
        r.type = "save_json_error";
        r.message = "uiputfile failed while selecting output path.";
        aippSendToBrowser(r, cb);
        return;
    end

    if outName == "" then
        r = struct();
        r.type = "save_json_cancelled";
        r.message = "User cancelled save dialog.";
        aippSendAsciiToBrowser(r, cb);
        return;
    end

    outPath = outDir + filesep() + outName;
    [p, n, ext] = fileparts(outPath);
    if ext == "" then
        outPath = outPath + ".json";
    end

    try
        jsonText = strsubst(jsonText, ascii(13), "");
        lines = tokens(jsonText, ascii(10));
        lines = FixJSON(lines)
        mputl(lines, outPath);
    catch
        r = struct();
        r.type = "save_json_error";
        r.message = "Failed to write selected JSON output file.";
        aippSendAsciiToBrowser(r, cb);
        return;
    end

    currentJsonPath = outPath;
    currentJsonDir = p;

    r = struct();
    r.type = "save_json_success";
    r.path = strsubst(outPath, "\\", "/");
    aippSendToBrowser(r, cb);
endfunction

// Transport config helper. Scilab 2025.1.0 uses chunked save by default; newer versions use direct ASCII.
function aippSendTransportConfig(cb)
    try
        v = getversion();
        vstr = strcat(string(v), " ");
    catch
        vstr = "unknown";
    end

    cfg = struct();
    cfg.type = "transport_config";
    cfg.scilab_version = vstr;
    cfg.save_chunk_size = 1200;
    cfg.save_chunk_delay_ms = 5;

    if grep(vstr, "2025.1.0") <> [] then
        cfg.save_transport = "chunked";
    else
        cfg.save_transport = "direct_ascii";
    end

    aippSendToBrowser(cfg, cb);
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
        aippSendTransportConfig(cb);
        return;
    end
    // Browser messages may arrive as either existing JSON strings or ASCII arrays.
    try
        msg = aippReceiveFromBrowser(data);
    catch
        disp("Invalid JSON from browser");
        try
            disp(string(data));
        catch
            disp("Unable to display browser payload.");
        end
        return;
    end

    if ~or(fieldnames(msg) == "type") then
        disp("Missing type field");
        return;
    end

    select msg.type

    // ==========================
    
    case "debug_payload" then
        disp("[AIPP DEBUG] debug_payload received");
        try
            disp("[AIPP DEBUG] requested_size = " + string(msg.requested_size));
        catch
            disp("[AIPP DEBUG] requested_size not provided");
        end
        try
            disp("[AIPP DEBUG] size(msg.data,*) = " + string(size(msg.data, "*")));
        catch
            disp("[AIPP DEBUG] could not read msg.data size");
        end
        return;

    case "save_json_begin" then
        global aippSaveTransferId;
        global aippSaveChunks;
        global aippSaveExpectedChunks;
        global aippSaveSuggestedName;
        aippSaveTransferId = msg.transfer_id;
        aippSaveExpectedChunks = int(msg.total_chunks);
        aippSaveChunks = emptystr(1, aippSaveExpectedChunks);
        if or(fieldnames(msg) == "suggested_name") then
            aippSaveSuggestedName = msg.suggested_name;
        else
            aippSaveSuggestedName = "aipp_input_updated.json";
        end
        disp("[AIPP SAVE] begin chunked save: " + string(aippSaveExpectedChunks) + " chunks");
        return;

    case "save_json_chunk" then
        global aippSaveTransferId;
        global aippSaveChunks;
        global aippSaveExpectedChunks;
        if msg.transfer_id <> aippSaveTransferId then
            disp("[AIPP SAVE] ignoring chunk with mismatched transfer_id");
            return;
        end
        idxChunk = int(msg.chunk_index);
        if idxChunk < 1 | idxChunk > aippSaveExpectedChunks then
            disp("[AIPP SAVE] ignoring chunk with invalid index");
            return;
        end
        try
            aippSaveChunks(idxChunk) = asciimat(msg.data);
        catch
            disp("[AIPP SAVE] failed to decode chunk " + string(idxChunk));
        end
        return;

    case "save_json_end" then
        global aippSaveTransferId;
        global aippSaveChunks;
        global aippSaveExpectedChunks;
        global aippSaveSuggestedName;
        if msg.transfer_id <> aippSaveTransferId then
            disp("[AIPP SAVE] save_json_end transfer_id mismatch");
            r = struct();
            r.type = "save_json_error";
            r.message = "Chunked save transfer_id mismatch.";
            aippSendToBrowser(r, cb);
            return;
        end
        jsonText = "";
        missing = [];
        for ii = 1:aippSaveExpectedChunks
            if aippSaveChunks(ii) == "" then
                missing($+1) = ii;
            else
                jsonText = jsonText + aippSaveChunks(ii);
            end
        end
        if missing <> [] then
            r = struct();
            r.type = "save_json_error";
            r.message = "Chunked save missing one or more chunks.";
            aippSendToBrowser(r, cb);
            return;
        end
        disp("[AIPP SAVE] chunked save assembled successfully");
        aippSaveJsonTextToLocalFile(jsonText, aippSaveSuggestedName, cb);
        aippSaveTransferId = "";
        aippSaveChunks = [];
        aippSaveExpectedChunks = 0;
        return;

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
    aippSendToBrowser(response, cb);
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
    aippSendToBrowser(response, cb);
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
    aippSendToBrowser(response, cb);
    case "save_json_ascii" then
         try
            jsonText = asciimat(msg.data);
            // jsonText = aippAsciiToText(msg.data);
        catch
            r = struct();
            r.type = "save_json_error";
            r.message = "Unable to decode JSON ASCII payload from browser.";
    aippSendToBrowser(r, cb);
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
    aippSendToBrowser(r, cb);
            return;
        end
    
        if outName == "" then
            r = struct();
            r.type = "save_json_cancelled";
            r.message = "User cancelled save dialog.";
    aippSendToBrowser(r, cb);
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
            lines = FixJSON(lines)
            mputl(lines, outPath);
        catch
            r = struct();
            r.type = "save_json_error";
            r.message = "Failed to write selected JSON output file.";
    aippSendToBrowser(r, cb);
            return;
        end
    
        // Update current directory so subsequent Save dialogs start from the most recent output location.
        currentJsonPath = outPath;
        currentJsonDir = p;
    
        r = struct();
        r.type = "save_json_success";
        r.path = strsubst(outPath, "\", "/");
    aippSendToBrowser(r, cb);

    else
        disp("Unknown type");
        disp(msg.type);
        return;
    end

endfunction


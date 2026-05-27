
// ===============================
// Initialization
// ===============================
clear;
clc();
close(winsid());
cd(get_absolute_file_path());
exec("buildHTML.sci", -1);

global browser;

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
    else
        disp("Unknown type");
        disp(msg.type);
        return;
    end

endfunction



// ===============================
// Initialization
// ===============================
clear;
clc();
close(winsid());
cd(get_absolute_file_path());

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

browser = uicontrol(frame, ...
    "style", "browser", ...
    "string", "browser.html", ...
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

    // Restore JSON
    JSONstring = strsubst(data, "<-quote->", """" );

    try
        msg = fromJSON(JSONstring);
    catch
        disp("Invalid JSON from browser");
        return;
    end

    if ~or(fieldnames(msg) == "type") then
        error("Missing type field");
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

        // ✅ Convert to ASCII array
        asciiData = asciimat(jsonText);

        // Ensure row vector
        if size(asciiData, 1) > 1 then
            asciiData = asciiData';
        end

        // Create message
        response = struct();
        response.type = "json_ascii";
        response.data = asciiData;

        jsonOut = toJSON(response);
        jsonOut = strsubst(jsonOut, """", "<-quote->");

        set(browser, "data", jsonOut);
        cb(jsonOut);

    else
        error("Unknown type");
    end

endfunction

function row = p2AsRow(data)
    row = data;
    if typeof(row) == "constant" & size(row, 1) > 1 then row = row'; end
endfunction

function bytes = p2EncodeControl(value)
    bytes = p2AsRow(asciimat(toJSON(value)));
endfunction

function value = p2DecodeControl(data)
    if typeof(data) <> "constant" then error("Control payload must be a numeric byte array."); end
    value = fromJSON(ascii(p2AsRow(data)));
endfunction

function p2SendBrowserData(value)
    global P2_BROWSER;
    set(P2_BROWSER, "data", value);
endfunction

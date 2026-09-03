function out = sendSafeJSON(inp)
    //Check the Scilab version
    if getversion() == "scilab-2025.1.0" then
        out = strsubst(inp, """", "<-quote->");
    else
        out = inp;
    end
endfunction
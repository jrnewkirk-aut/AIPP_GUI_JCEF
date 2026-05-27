function html_lines = buildBrowserHTML()

    base = pwd();

    index = mgetl(base + "/browser_files/index.html");
    css   = mgetl(base + "/browser_files/styles/main.css");

    layout = mgetl(base + "/browser_files/components/layout.html");
    popup  = mgetl(base + "/browser_files/components/popup.html");

    js_files = [
        "state.js"
        "utils.js"
        "scilab.js"
        "tree.js"
        "codeView.js"
        "graph.js"
        "popup.js"
        "app.js"
    ];

    js_all = [];

    for i = 1:size(js_files, "*")
        content = mgetl(base + "/browser_files/js/" + js_files(i));
        content = stripImportLines(content);
        content = strsubst(content, "export ", "");

        js_all = [js_all ; content ; ""];
    end
    disp(index)

    html_lines = strsubst(index, "styles/main.css", "<style>" + css + "</style>");

    html_lines = replaceToken(html_lines, "<div id=""app""></div>", [layout ; popup]);

    js_block = ["<script>"; js_all ; "</script>"];
    html_lines = replaceToken(html_lines, "js/app.js", js_block);

endfunction

function out = replaceToken(lines, token, rep)
    out = [];
    for i=1:size(lines,"*")
        if strindex(lines(i), token) <> [] then
            out = [out ; rep];
        else
            out = [out ; lines(i)];
        end
    end
endfunction

function out = stripImportLines(lines)
    out = [];
    for i=1:size(lines,"*")
        if part(stripblanks(lines(i)),1:6) <> "import" then
            out = [out ; lines(i)];
        end
    end
endfunction

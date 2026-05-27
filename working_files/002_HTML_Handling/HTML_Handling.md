# HTML Handling for Scilab JCEF GUI Programs

---

## 1. Overview

Scilab 2025.0.0 introduced support for GUI development using a JCEF (Java Chromium Embedded Framework) browser.  

This allows developers to build modern UI tools using:
- HTML
- CSS
- JavaScript

However, this environment has strict constraints that influence how HTML applications must be structured.

---

## 2. Core Constraint

Scilab requires that the HTML content provided to the browser must be:

- A **single array of strings**
- Containing a **fully self-contained HTML document**

This creates a conflict with standard web development practices.

---

## 3. The Problem

There are two competing needs:

### ✅ Maintainability Requirement
Modern HTML applications are easier to:
- read
- debug
- extend

when they are split into multiple files:
- HTML layout components
- CSS stylesheets
- JavaScript modules

---

### ⚠️ Scilab Runtime Requirement

Scilab only accepts:
- one HTML file
- passed as a string array

This means:
- file imports are not available at runtime
- modular structure is not directly usable

---

## 4. Solution: Hybrid Build Approach

To resolve this conflict, a **two-phase architecture** is used:

### Development Phase
- Code is written as modular files
- Organized by responsibility (UI, logic, styling)

### Runtime Phase
- Scilab dynamically:
  - reads all files
  - combines them into one HTML document
  - injects styles, components, and scripts

---

## 5. Scilab Build Script

The following Scilab script assembles the modular files into a single HTML document.

```scilab
clear; clc();
cd(get_absolute_file_path());

// Root directory
html_dir = fullpath("./browser_files");

// Load base HTML
html = mgetl(fullfile(html_dir,"index.html"));

// ---- CSS Injection ----
CSS = mgetl(fullfile(html_dir, "styles", "main.css"));
ind = grep(html, "styles/main.css");

html = cat(1, ...
    html(1:ind-1), ...
    "<style>", ...
    CSS, ...
    "</style>", ...
    html(ind+1:$));

// ---- Identify Body ----
ind_start = grep(html, "<body>");
ind_stop  = grep(html, "</body>");

// ---- Load Components ----
components = [];
component_files = listfiles(html_dir + "/components/*.html");
component_files = flipdim(component_files, 1);

for i = 1:size(component_files,"*")
    components = cat(1, components, mgetl(component_files(i)));
end

// ---- Load JavaScript ----
java = [];
java_files = listfiles(html_dir + "/js/*.js");
java_files = flipdim(java_files, 1);

for i = 1:size(java_files,"*")
    java = cat(1, java, mgetl(java_files(i)));
end

// ---- Assemble Final HTML ----
html = cat(1, ...
    html(1:ind_start), ...
    components, ...
    "<script>", ...
    java, ...
    "</script>", ...
    html(ind_stop:$));

// Optional debug output
csvWrite(html, fullfile(html_dir, "dist", "bundle.html"));
```

## 6. Mandatory File Structure

browser_files/
├── index.html
├── styles/
│   └── main.css
├── components/
│   ├── layout.html
│   └── popup.html
├── js/
│   ├── app.js
│   ├── tree.js
│   ├── graph.js
│   └── ...

## 7. Mandatory `index.html` template

```
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Title</title>

styles/main.css
</head>

<body>

</body>
</html>
```

## 12. Runtime Flowchart

The following diagram describes how modular files are assembled and executed within the Scilab JCEF environment.

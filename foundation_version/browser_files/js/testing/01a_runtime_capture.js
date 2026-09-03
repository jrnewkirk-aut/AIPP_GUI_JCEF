"use strict";
P4.runtime={errors:[],notifications:[],startupAt:performance.now()};
window.addEventListener("error",e=>P4.runtime.errors.push({kind:"error",message:e.message,source:e.filename,line:e.lineno}));
window.addEventListener("unhandledrejection",e=>P4.runtime.errors.push({kind:"unhandledrejection",message:String(e.reason?.message||e.reason)}));

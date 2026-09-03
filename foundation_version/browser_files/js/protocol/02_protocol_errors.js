"use strict";
P2.ProtocolError = class ProtocolError extends Error { constructor(code,message,details=null){super(message);this.name="ProtocolError";this.code=code;this.details=details;} };
P2.TimeoutError = class TimeoutError extends P2.ProtocolError { constructor(requestId,timeoutMs){super("REQUEST_TIMEOUT",`Request ${requestId} timed out after ${timeoutMs} ms`,{requestId,timeoutMs});} };

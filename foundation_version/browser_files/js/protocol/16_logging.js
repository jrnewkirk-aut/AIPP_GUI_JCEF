"use strict";
// Pillar 7 compatibility facade. New code should use P7.logger with an explicit
// category, event name, correlation context, and structured details.
P2.logging={
  levels:{silent:0,error:1,warn:2,info:3,debug:4},
  get level(){return P7.logger.level;},
  set level(value){P7.logger.setLevel(value);},
  get entries(){return P7.logger.entries;},
  setLevel(level){return P7.logger.setLevel(level);},
  write(level,message,details=null){const data=details&&typeof details==="object"&&!Array.isArray(details)?details:{value:details};const category=P7.categories.includes(data.category)?data.category:"protocol";const event=typeof data.event==="string"&&data.event?data.event:"protocol.legacy_log";const context={request_id:data.request_id??null,transfer_id:data.transfer_id??null};const record=P7.logger.write(level,category,event,context,{message,...data});if(record&&P2.ui)P2.ui.log(`[${level.toUpperCase()}] ${message}`);return record;},
  error(message,details){return this.write("error",message,details);},warn(message,details){return this.write("warn",message,details);},info(message,details){return this.write("info",message,details);},debug(message,details){return this.write("debug",message,details);}
};

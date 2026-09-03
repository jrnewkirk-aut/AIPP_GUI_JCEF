"use strict";
(function(root){
  const P7=root.P7,rank={debug:10,info:20,warn:30,error:40};
  const logger={level:"info",entries:[],listeners:new Set(),setLevel(level){if(level!=="silent"&&!P7.levels.includes(level))throw new Error(`Invalid log level: ${level}`);this.level=level;return level;},enabled(level){return this.level!=="silent"&&rank[level]>=rank[this.level];},write(level,category,event,context={},details={}){if(!this.enabled(level))return null;const record=P7.record.create(level,category,event,context,details);this.entries.push(record);while(this.entries.length>P7.limits.browserLogEntries)this.entries.shift();for(const listener of [...this.listeners]){try{listener(record);}catch(_){}}return record;},debug(c,e,x,d){return this.write("debug",c,e,x,d);},info(c,e,x,d){return this.write("info",c,e,x,d);},warn(c,e,x,d){return this.write("warn",c,e,x,d);},error(c,e,x,d){return this.write("error",c,e,x,d);},subscribe(listener){this.listeners.add(listener);return ()=>this.listeners.delete(listener);},clear(){this.entries.length=0;},snapshot(){return this.entries.map(entry=>JSON.parse(JSON.stringify(entry)));}};
  P7.logger=logger;
})(window);

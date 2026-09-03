"use strict";
(function(root){
  const P7=root.P7,MAX=200;
  const required={
    "control.encode.duration_ms":"ms","transport.callback.duration_ms":"ms","control.decode.duration_ms":"ms",
    "calculation.duration_ms":"ms","plot.reduction.duration_ms":"ms","plot.render.duration_ms":"ms","plot.pipeline.duration_ms":"ms",
    "transport.queue.depth":"count","request.pending.count":"count","transfer.active.count":"count",
    "plot.source_points.visible":"count","plot.display_points.delivered":"count","browser.dataset.estimated_bytes":"bytes",
    "request.failed.count":"count","request.cancelled.count":"count","request.timed_out.count":"count"
  };
  function contextIds(context={}){return{request_id:context.requestId??context.request_id??null,transfer_id:context.transferId??context.transfer_id??null};}
  function finite(value){return typeof value==="number"&&Number.isFinite(value)&&value>=0;}
  const registry={records:[],gauges:new Map(),counters:new Map(),timers:new Map(),required,
    record(name,value,unit=required[name]||"count",context={},details={}){if(typeof name!=="string"||!name)throw new Error("Metric name is required");if(!finite(value))throw new Error(`Metric value must be finite and nonnegative: ${name}`);const metric={schema_version:"1.0",timestamp:new Date().toISOString(),runtime:"browser",name,value,unit,status:details.status||"success",...contextIds(context),details:{...details}};delete metric.details.status;this.records.push(metric);while(this.records.length>MAX)this.records.shift();P7.logger?.debug("performance","performance.metric_recorded",context,{name,value,unit});return metric;},
    gauge(name,value,unit=required[name]||"count",context={},details={}){this.gauges.set(name,value);return this.record(name,value,unit,context,{kind:"gauge",...details});},
    increment(name,amount=1,context={},details={}){if(!finite(amount))throw new Error("Counter increment must be nonnegative");const value=(this.counters.get(name)||0)+amount;this.counters.set(name,value);return this.record(name,value,required[name]||"count",context,{kind:"counter",delta:amount,...details});},
    start(operation,context={}){const id=`metric-${Date.now()}-${Math.random().toString(16).slice(2)}`,startedAt=performance.now();this.timers.set(id,{id,operation,context,startedAt});return id;},
    stop(id,name,details={}){const timer=this.timers.get(id);if(!timer)throw new Error(`Unknown metric timer: ${id}`);this.timers.delete(id);return this.record(name,performance.now()-timer.startedAt,"ms",timer.context,{operation:timer.operation,...details});},
    recordProtocol(timing,context={}){if(!timing)return[];const rows=[];for(const [field,name] of [["request_encode_ms","control.encode.duration_ms"],["transport_callback_ms","transport.callback.duration_ms"],["response_decode_ms","control.decode.duration_ms"]])if(finite(timing[field]))rows.push(this.record(name,timing[field],"ms",context,{stage:field}));return rows;},
    recordPlot(payload={},context={}){const rows=[],host=payload.host_timing||{};const pairs=[[payload.calculation_ms??payload.source_generation_ms??host.source_total_ms,"calculation.duration_ms"],[payload.reduction_ms??host.minmax_reduction_ms,"plot.reduction.duration_ms"],[payload.render_ms??payload.renderer_ms,"plot.render.duration_ms"],[payload.pipeline_ms??payload.total_pipeline_ms??payload.host_ms,"plot.pipeline.duration_ms"],[payload.source_point_count??payload.visible_source_points,"plot.source_points.visible"],[payload.point_count??payload.delivered_point_count,"plot.display_points.delivered"],[payload.estimated_numeric_payload_bytes,"browser.dataset.estimated_bytes"]];for(const [value,name] of pairs)if(finite(value))rows.push(this.record(name,value,required[name],context,{source:"plot_payload"}));return rows;},
    syncRuntime(){const requests=P2?.requests?.size??0,transfers=P2?.diagnostics?.snapshot?.().activeTransfers??0;this.gauge("request.pending.count",requests);this.gauge("transfer.active.count",transfers);return{requests,transfers};},
    snapshot(){return{schema_version:"1.0",record_count:this.records.length,active_timers:this.timers.size,gauges:Object.fromEntries(this.gauges),counters:Object.fromEntries(this.counters),records:this.records.map(x=>JSON.parse(JSON.stringify(x)))};},
    clear(){this.records.length=0;this.gauges.clear();this.counters.clear();this.timers.clear();}
  };
  P7.performance=registry;
})(window);

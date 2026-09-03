function response = p2RouteMessage(message)
    global P2_REQUEST_COUNT;
    global P2_LIBRARY_ACTIVE;
    P2_REQUEST_COUNT = P2_REQUEST_COUNT + 1;
    if ~P2_LIBRARY_ACTIVE & message.type <> "protocol.initialize.request" & message.type <> "protocol.lifecycle.status.request" & message.type <> "protocol.handshake.request" then
        response = p2ProtocolError(message.request_id, "LIBRARY_INACTIVE", "Host protocol library is inactive; initialize before sending this message.", %t);
        return;
    end
    // Test routes are registered only when the test extension is loaded.
    if exists("p52RouteTestMessage") == 1 then
        [testHandled,testResponse]=p52RouteTestMessage(message);
        if testHandled then response=testResponse;return;end
    end
    if exists("p55RouteApplicationMessage") == 1 then
        [appHandled,appResponse]=p55RouteApplicationMessage(message);
        if appHandled then response=appResponse;return;end
    end
    select message.type
    case "protocol.handshake.request" then
        response = p2HandleHandshake(message);
    case "diagnostic.echo.request" then
        response = p2HandleEcho(message);
    case "diagnostic.delay.request" then
        response = p2HandleDelay(message);
    case "diagnostic.results.export" then
        response = p2HandleResultsExport(message);
    case "protocol.initialize.request" then
        response = p2HandleInitialize(message);
    case "protocol.lifecycle.status.request" then
        response = p2HandleLifecycleStatus(message);
    case "protocol.capabilities.request" then
        response = p2HandleCapabilities(message);
    case "protocol.shutdown.request" then
        response = p2HandleShutdown(message);
    case "plot.dataset.create.request" then
        response = p3HandleDatasetCreate(message);
    case "plot.dataset.metadata.request" then
        response = p3HandleMetadata(message);
    case "plot.viewport.request" then
        response = p3HandleViewport(message);
    case "plot.point.query.request" then
        response = p3HandlePointQuery(message);
    case "plot.cache.status.request" then
        response = p3HandleCacheStatus(message);
    case "plot.cache.clear" then
        response = p3HandleCacheClear(message);
    case "plot.pyramid.status.request" then
        response = p358HandlePyramidStatus(message);
    case "plot.pyramid.clear" then
        response = p358HandlePyramidClear(message);
    case "plot.pyramid.prepare.start" then
        response = p359HandlePrepareStart(message);
    case "plot.pyramid.prepare.step" then
        response = p359HandlePrepareStep(message);
    case "plot.pyramid.prepare.status.request" then
        response = p359HandlePrepareStatus(message);
    case "plot.pyramid.prepare.cancel" then
        response = p359HandlePrepareCancel(message);
    case "plot.native.render.request" then
        response = p34HandleNativeRender(message);
    case "plot.native.visibility.request" then
        response = p34HandleNativeVisibility(message);
    case "plot.native.status.request" then
        response = p34HandleNativeStatus(message);
    case "plot.native.destroy.request" then
        response = p34HandleNativeDestroy(message);
    case "plot.experience.memory.request" then
        response = p35HandleMemoryCheckpoint(message);
    case "plot.compare.prepare.request" then
        response = p342HandlePrepareComparison(message);
    case "plot.native.prepared.request" then
        response = p342HandleNativePrepared(message);
    case "transfer.generic.start" then
        response = p2GenericStart(message);
    case "transfer.generic.chunk" then
        response = p2GenericChunk(message);
    case "transfer.generic.complete" then
        response = p2GenericComplete(message);
    case "transfer.generic.cancel" then
        response = p2GenericCancel(message);
    case "transfer.generic.status.request" then
        response = p2GenericStatus(message);
    case "diagnostic.encoding_metric.request" then
        response = p35113HandleEncodingMetric(message);
    case "diagnostic.package.export.request" then
        response = p7HandleDiagnosticPackageExport(message);
    case "diagnostic.host_log.request" then
        response = p2HandleHostLogRequest(message);
    case "diagnostic.host_log.clear" then
        response = p2HandleHostLogClear(message);
    case "transfer.numeric.start" then
        response = p2StartNumericTransfer(message);
    case "transfer.numeric.ack" then
        response = p2AcknowledgeNumericBatch(message);
    case "transfer.cancel.request" then
        response = p2CancelNumericTransfer(message);
    case "transfer.status.request" then
        response = p2TransferStatus(message);
    case "protocol.cancel.request" then
        response = p2ProtocolError(message.request_id, "NOT_ACTIVE", "No cancellable control operation is active.", %f);
    else
        response = p2ProtocolError(message.request_id, "UNSUPPORTED_TYPE", "No handler is registered for message type: " + message.type, %f);
    end
endfunction

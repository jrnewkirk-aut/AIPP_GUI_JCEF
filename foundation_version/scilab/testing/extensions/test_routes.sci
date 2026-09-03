function [handled,response]=p52RouteTestMessage(message)
    handled=%t;
    select message.type
    case "test.scilab.run.request" then response=p4HandleScilabTests(message);
    case "test.build.artifact.inspect.request" then response=p411HandleArtifactInspect(message);
    case "test.contract.evaluate.request" then response=p42HandleContractFixture(message);
    case "test.host.notification.request" then response=p43HandleHostNotification(message);
    case "test.handler.throw.request" then response=p45IntentionalHandlerFailure(message);
    else handled=%f;response=[];
    end
endfunction

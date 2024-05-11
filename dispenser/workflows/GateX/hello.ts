import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import { debugLog } from "../../../utils/debugLog";

export class HelloWorld extends StepBody {
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog('HelloWorld', "Hello World");
        return ExecutionResult.next();
    }
}
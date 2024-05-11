import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import { debugLog } from "../../../utils/debugLog";

export class GoodbyeWorld extends StepBody {
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog('GoodbyeWorld', "Goodbye World");
        return ExecutionResult.next();
    }
}
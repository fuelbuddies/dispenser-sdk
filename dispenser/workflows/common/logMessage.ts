import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import { debugLog } from "../../../utils/debugLog";

export class LogMessage extends StepBody {
    public message: string | undefined;    
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog('LogMessage', this.message || "Please give Tintin samosa and ask for error!!!");
        return ExecutionResult.next();
    }
}
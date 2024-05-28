import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import debug from 'debug';
const debugLog = debug('dispenser:logMessage');

export class LogMessage extends StepBody {
    public message: string | undefined;    
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog('LogMessage: %s', this.message || "Please give Tintin samosa and ask for error!!!");
        return ExecutionResult.next();
    }
}
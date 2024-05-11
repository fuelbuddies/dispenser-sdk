import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";

export class LogMessage extends StepBody {
    public message: string | undefined;    

    public debugLog(fnName: string, message: string) {
        console.log(`[${fnName}] - ${message}`);
    }

    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        this.debugLog('LogMessage -', this.message || "Blank message!!!");
        return ExecutionResult.next();
    }
}
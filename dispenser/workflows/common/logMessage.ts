import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";

export class LogMessage extends StepBody {
    public message: string | undefined;    
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        console.log(this.message);
        return ExecutionResult.next();
    }
}
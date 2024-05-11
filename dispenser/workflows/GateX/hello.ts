import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";

export class HelloWorld extends StepBody {
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        // console.log("Hello World");
        return ExecutionResult.next();
    }
}
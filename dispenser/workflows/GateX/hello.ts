import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import debug from 'debug';

const debugLog = debug('dispenser:hello-world');

export class HelloWorld extends StepBody {
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog('HelloWorld: %s', "Hello World");
        return ExecutionResult.next();
    }
}
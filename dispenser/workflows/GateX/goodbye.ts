import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import debug from 'debug';

const debugLog = debug('dispenser:goodbye-world');

export class GoodbyeWorld extends StepBody {
    public run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog('GoodbyeWorld: %s', "Goodbye World");
        return ExecutionResult.next();
    }
}
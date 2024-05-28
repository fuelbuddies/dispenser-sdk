import ModbusRTU from "modbus-serial";
import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import debug from 'debug';

const debugLog = debug('dispenser:increment-overflow-register');

export class IncrementOverflowRegister extends StepBody {
    public client: ModbusRTU = new ModbusRTU();
    public overflowRegister: number = 8;
    public overflowCount: number = 0;
    public overflowOffset: number = 0;

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog("IncrementOverflowRegister: %s", "Increment Overflow");
        debugLog("Overflow Register: %s", JSON.stringify(this.overflowCount));

        const response = await this.client.writeRegister(this.overflowRegister, ++this.overflowCount);
        this.overflowOffset = 4294967296 * this.overflowCount;
        debugLog("Incremented Overflow Register: %s", JSON.stringify(response));
        return ExecutionResult.next();
    }
}
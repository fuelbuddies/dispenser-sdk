import ModbusRTU from "modbus-serial";
import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import debug from 'debug';

const debugLog = debug('dispenser:increment-overflow-register');

export class ReadOverflowRegister extends StepBody {
    public client: ModbusRTU = new ModbusRTU();
    public overflowRegister: number = 8;
    public overflowCount: number = 0;
    public overflowOffset: number = 0;

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog("Read Overflow Register: %s", JSON.stringify(this.overflowRegister));
        const overflowCounter = await this.client.readHoldingRegisters(this.overflowRegister, 1);
        debugLog("overflowCounter: %s", JSON.stringify(overflowCounter));
        this.overflowCount = overflowCounter.buffer.readUint16BE(0);
        this.overflowOffset = 4294967296 * this.overflowCount;
        debugLog('Overflow Count: %s', `${this.overflowCount}`);
        return ExecutionResult.next();
    }
}
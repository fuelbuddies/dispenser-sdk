import ModbusRTU from "modbus-serial";
import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import { debugLog } from "../../../utils/debugLog";

export class ReadOverflowRegister extends StepBody {
    public client: ModbusRTU = new ModbusRTU();
    public overflowRegister: number = 8;
    public overflowCount: number = 0;

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog("Read Overflow Register: ", JSON.stringify(this.overflowRegister));
        const overflowCounter = await this.client.readHoldingRegisters(this.overflowRegister, 1);
        debugLog("overflowCounter", JSON.stringify(overflowCounter));
        this.overflowCount = overflowCounter.buffer.readUint16BE(0);
        debugLog('Overflow Count', `${this.overflowCount}`);
        return ExecutionResult.next();
    }
}
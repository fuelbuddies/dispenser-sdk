import ModbusRTU from "modbus-serial";
import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";

export class ReadPulseCounter extends StepBody {
    public client: ModbusRTU = new ModbusRTU();
    public pulseRegister: number = 10;
    public pulseCount: number = 0;
    public previousPulseCount: number = 0;

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        console.log("Read Pulse Counter");
        const pulseCounter = await this.client.readHoldingRegisters(this.pulseRegister, 2);
        this.previousPulseCount = this.pulseCount;
        this.pulseCount = pulseCounter.buffer.readUInt32BE(0);
        console.log(`Pulse Count: ${this.pulseCount}`);
        return ExecutionResult.next();
    }
}
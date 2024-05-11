import ModbusRTU from "modbus-serial";
import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";

export class IncrementOverflowRegister extends StepBody {
    public client: ModbusRTU = new ModbusRTU();
    public overflowRegister: number = 8;
    public overflowCount: number = 0;

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        console.log("Increment Overflow");
        console.log("Overflow Register: ", this.overflowCount);

        const response = await this.client.writeRegister(this.overflowRegister, ++this.overflowCount);
        console.log("Incremented Overflow Register", response);
        return ExecutionResult.next();
    }
}
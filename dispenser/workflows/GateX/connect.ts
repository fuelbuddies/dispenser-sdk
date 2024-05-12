import ModbusRTU from "modbus-serial";
import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import { debugLog } from "../../../utils/debugLog";

export class InitializeSeleca extends StepBody {
    public deviceId: number = 1;
    public timeout: number = 1000;
    public address: string = '';
    public baudRate: number = 9600;
    public client: ModbusRTU = new ModbusRTU();

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog("InitializeSeleca","Connecting to Seneca");
        this.client.setID(this.deviceId);
        this.client.setTimeout(this.timeout);
        await this.client.connectRTU(this.address, { baudRate: this.baudRate });
        debugLog("InitializeSeleca", "Connected to Seneca");
        return ExecutionResult.next();
    }
}

import ModbusRTU from "modbus-serial";
import { ExecutionResult, StepBody, StepExecutionContext } from "workflow-es";
import debug from 'debug';

const debugLog = debug('dispenser:initialize-seleca');

export class InitializeSeleca extends StepBody {
    public deviceId: number = 1;
    public timeout: number = 1000;
    public address: string = '';
    public baudRate: number = 9600;
    public client: ModbusRTU = new ModbusRTU();

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        debugLog("InitializeSeleca: %s","Connecting to Seneca");
        this.client.setID(this.deviceId);
        this.client.setTimeout(this.timeout);
        await this.client.connectRTU(this.address, { baudRate: this.baudRate });
        debugLog("InitializeSeleca: %s", "Connected to Seneca");
        return ExecutionResult.next();
    }
}

export class ReInitializeSeleca extends StepBody {
    public deviceId: number = 1;
    public timeout: number = 1000;
    public address: string = '';
    public baudRate: number = 9600;
    public client: ModbusRTU = new ModbusRTU();

    public async run(context: StepExecutionContext): Promise<ExecutionResult> {
        await new Promise((resolve) => this.client.close(resolve));
        debugLog("ReInitializeSeleca: %s","Connecting to Seneca");
        var client = new ModbusRTU();
        client.setID(this.deviceId);
        client.setTimeout(this.timeout);
        await client.connectRTU(this.address, { baudRate: this.baudRate });
        this.client = client;
        debugLog("ReInitializeSeleca: %s", "Connected to Seneca");
        return ExecutionResult.next();
    }
}
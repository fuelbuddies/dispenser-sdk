import { WorkflowBase, WorkflowBuilder, WorkflowErrorHandling } from "workflow-es";
import { GoodbyeWorld } from "./GateX/goodbye";
import { HelloWorld } from "./GateX/hello";
import { InitializeSeleca, ReInitializeSeleca } from "./GateX/connect";
import ModbusRTU from "modbus-serial";
import { ReadOverflowRegister } from "./GateX/readOverflow";
import { ReadPulseCounter } from "./GateX/countPulse";
import { IncrementOverflowRegister } from "./GateX/incrementOverflow";
import { DispenserOptions } from "../interface/IDispenser";
import { LogMessage } from "./common/logMessage";
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { debugLog } from "../../utils/debugLog";

export class Seneca {
    public client: ModbusRTU;
    public timeout: number;
    public address: string = "COM9";
    public baudRate: number;
    public deviceId: number;
    private _overflowCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _overflowOffset: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _pulseCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _previousPulseCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    public workId: string | undefined;

    public overflowRegister: number = 8; // 16-bit register that increments every time the pulse counter overflows
    public pulseRegister: number = 10; // 16-bit register that increments every time the pulse counter overflows

    constructor(options: DispenserOptions) {
      const modbusOptions = options.modbus;
      this.baudRate = options.baudRate || 9600;
      this.client = new ModbusRTU();
      this.timeout = modbusOptions?.timeout || 1000;
      this.deviceId = modbusOptions?.deviceId || 1;
      this.overflowRegister = modbusOptions?.overflowRegister || 8;
      this.pulseRegister = modbusOptions?.pulseRegister || 10;
    }

    // Observable getters
    get overflowCount$() {
        return this._overflowCount.asObservable();
    }

    get overflowOffset$() {
        return this._overflowOffset.asObservable();
    }

    get pulseCount$() {
        return this._pulseCount.asObservable();
    }

    get previousPulseCount$() {
        return this._previousPulseCount.asObservable();
    }

    // Synchronous setters and getters
    set overflowCount(val: number) {
        this._overflowCount.next(val);
    }

    get overflowCount() {
        return this._overflowCount.getValue();
    }

    set overflowOffset(val: number) {
        this._overflowOffset.next(val);
    }

    get overflowOffset() {
        return this._overflowOffset.getValue();
    }

    set pulseCount(val: number) {
        this._pulseCount.next(val);
    }

    get pulseCount() {
        return this._pulseCount.getValue();
    }

    set previousPulseCount(val: number) {
        this._previousPulseCount.next(val);
    }

    get previousPulseCount() {
        return this._previousPulseCount.getValue();
    }

    // Asynchronous getters using async/await
    async getOverflowCountAsync(): Promise<number> {
        return await lastValueFrom(this._overflowCount.asObservable());
    }

    async getOverflowOffsetAsync(): Promise<number> {
        return await lastValueFrom(this._overflowOffset.asObservable());
    }

    async getPulseCountAsync(): Promise<number> {
        return await lastValueFrom(this._pulseCount.asObservable());
    }

    async getPreviousPulseCountAsync(): Promise<number> {
        return await lastValueFrom(this._previousPulseCount.asObservable());
    }

    async readPulse() {
      const overflowCountOffset = await this.getOverflowOffsetAsync();
      const pulseCount = await this.getPulseCountAsync();
      debugLog('ReadPulse', `Overflow Count: ${overflowCountOffset} : Pulse Count: ${pulseCount}`);
      return overflowCountOffset + pulseCount;
    }
}

export class Z10DIN_Workflow implements WorkflowBase<Seneca> {
    public id: string = "z10d1n-world";
    public version: number = 1;

    public build(builder: WorkflowBuilder<Seneca>) {
        builder
        .startWith(HelloWorld)
        .saga((sequence) => sequence
        .startWith(InitializeSeleca)
            .input((step, data) => step.deviceId = data.deviceId)
            .input((step, data) => step.timeout = data.timeout)
            .input((step, data) => step.address = data.address)
            .input((step) => step.client = new ModbusRTU())
            .output((step, data) => data.client = step.client)
        .then(ReadOverflowRegister)
            .input((step, data) => step.client = data.client)
            .input((step, data) => step.overflowRegister = data.overflowRegister)
            .output((step, data) => data.overflowOffset = step.overflowOffset)
            .output((step, data) => data.overflowCount = step.overflowCount))
        .onError(WorkflowErrorHandling.Retry, 1000)
        .then(LogMessage)
            .input((step, data) => step.message = `Overflow count initalized with: ${data.overflowCount}`)
        // Overflow register is a 32-bit register that increments every time the pulse counter overflows
        .while((data) => data.overflowCount < 65536).do((sequence) => sequence
        .startWith(LogMessage)
            .input((step) => step.message = "Reading Pulse Loop")
            .saga((sequence) => sequence
                .startWith(LogMessage)
                    .input((step) => step.message = "Reading Pulse Counter")
                .then(ReadPulseCounter)
                    .input((step, data) => step.client = data.client)
                    .input((step, data) => step.pulseCount = data.pulseCount)
                    .input((step, data) => step.pulseRegister = data.pulseRegister)
                    .output((step, data) => data.pulseCount = step.pulseCount)
                    .output((step, data) => data.previousPulseCount = step.previousPulseCount)
                .compensateWithSequence(comp => comp
                    .startWith(LogMessage)
                        .input((step) => step.message = "Reinitializing Pulse Counter")    
                    .then(ReInitializeSeleca)
                        .input((step, data) => step.deviceId = data.deviceId)
                        .input((step, data) => step.timeout = data.timeout)
                        .input((step, data) => step.address = data.address)
                        .input((step, data) => step.client = data.client)
                        .output((step, data) => data.client = step.client))
                .then(LogMessage)
                    .input((step, data) => step.message = `Pulse Count: ${data.previousPulseCount} : ${data.pulseCount}`)
                .if((data) => data.pulseCount < data.previousPulseCount).do((then) => then
                    .startWith(LogMessage)
                        .input((step, data) => step.message = `Running Overflow Sequence with Overflow Count: ${data.overflowCount}`)
                    .then(IncrementOverflowRegister)
                    .input((step, data) => step.client = data.client)
                    .input((step, data) => step.overflowRegister = data.overflowRegister)
                    .input((step, data) => step.overflowOffset = data.overflowOffset)
                    .input((step, data) => step.overflowCount = data.overflowCount)
                    .output((step, data) => data.overflowOffset = step.overflowOffset)
                    .output((step, data) => data.overflowCount = step.overflowCount))
                .then(LogMessage)
                    .input((step, data) => step.message = `Overflow Count: ${data.overflowCount}`)))
        .then(GoodbyeWorld);
    }
}
import ModbusRTU from "modbus-serial";
import { DispenserOptions } from "../interface/IDispenser";
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import debug from 'debug';

const debugLog = debug('dispenser:seneca');
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

    readPulse() {
      debugLog('ReadPulse: %s', `Overflow Count: ${this.overflowOffset} : Pulse Count: ${this.pulseCount}`);
      return this.overflowOffset + this.pulseCount;
    }
}
import { DispenserOptions, IDispenser } from "../interface/IDispenser";
import ModbusRTU from "modbus-serial";
import { QueueObject, queue } from 'async';

export class ModBusDispenser implements IDispenser {
    connection: ModbusRTU;
    queue: QueueObject<any>;

    constructor(socket: ModbusRTU, options?: DispenserOptions) {
        this.connection = socket;
        this.queue = queue(this.processTask.bind(this), 1);
    }

    hexToDecLittleEndian(hexString: string): number {
        const bytes = hexString.trim().split(" "); // Split on spaces, remove leading/trailing spaces
        let decimalValue = 0;

        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            const decimalByte = parseInt(byte, 16); // Parse hex byte to decimal
            decimalValue += decimalByte * Math.pow(256, bytes.length - 1 - i); // Add considering position
        }

        return decimalValue;
    }

    async processTask(task: any) {
        const {bindFunction, callee, calleeArgs} = task;
        const data = await callee.call(this, calleeArgs || undefined);
        if (bindFunction instanceof Function) {
            const result = bindFunction.call(this, data, calleeArgs || undefined, callee.name);
            console.log("bindFunction", result);
            return result;
        } else {
            return data;
        }
    }

    execute(callee: any, bindFunction?: (...args: any[]) => unknown, calleeArgs: any = undefined): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({ callee, bindFunction, calleeArgs }, (err, result) => {
                console.log("result", arguments);
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    executeInPriority(callee: any, bindFunction: any = undefined, calleeArgs: any = undefined): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.unshift({ callee, bindFunction, calleeArgs }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
    * reset queue
    */
    resetQueue(): void {
        this.queue.kill();
        this.queue = queue(this.processTask.bind(this), 1);
    }

    disconnect(callback: any): void {
        throw new Error("Method not implemented.");
    }

    toFixedNumber(num: number, digits: number, base?: number) {
        const pow = Math.pow(base || 10, digits);
        return Math.round(num * pow) / pow;
    }

    debugLog(fnName: string, message: string) {
        console.log(`[${fnName}] - ${message}`);
    }
}
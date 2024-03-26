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

    hexToDecLittleEndian(buffer: Buffer): number {
        if (buffer.length % 4 !== 0) {
            throw new Error("Buffer length must be a multiple of 4 (4 bytes per uint32)");
        }

        const byteView = new DataView(buffer.buffer as ArrayBuffer);
        let decimalValue = 0;

        for (let i = 0; i < buffer.length; i += 4) { // Process 4 bytes at a time (uint32 size)
            decimalValue += byteView.getUint32(i, true); // Read as little-endian
        }

        return decimalValue;
    }

    async processTask(task: any) {
        const {bindFunction, callee, calleeArgs} = task;
        const data = await callee.call(this, calleeArgs || undefined);
        if (bindFunction instanceof Function) {
            return bindFunction.call(this, data, calleeArgs, callee.name);
        } else {
            return data;
        }
    }

    execute(callee: any, bindFunction?: (...args: any[]) => unknown, calleeArgs: any = undefined): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({ callee, bindFunction, calleeArgs }, (err, result) => {
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
}
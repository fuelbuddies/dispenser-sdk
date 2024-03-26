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

    parseResponseToUint32(buffer: Buffer, isBigEndian: boolean): number {
        // Check for invalid buffer size
        if (buffer.length % 4 !== 0) {
            throw new Error("Buffer length must be a multiple of 4 (4 bytes per uint32)");
        }

        const valueBytes = new Uint8Array(buffer);

        // Combine bytes based on endianness
        let unsignedInt32: number;
        if (isBigEndian) {
            unsignedInt32 = 0;
            for (let i = 0; i < 2; i++) {
                unsignedInt32 = (unsignedInt32 << 8) | valueBytes[i * 2];
            }
        } else {
            unsignedInt32 = 0;
            for (let i = 1; i >= 0; i--) {
                unsignedInt32 |= valueBytes[i * 2];
                unsignedInt32 = (unsignedInt32 >>> 8);
            }
        }

        return unsignedInt32;
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
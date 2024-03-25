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
    
    async processTask(task: any, callback: any) {
        const {bindFunction, callee, calleeArgs} = task;
        const data = await callee.call(this, calleeArgs || undefined);
        try {
            if (bindFunction instanceof Function) {
                callback(null, bindFunction.call(this, data, calleeArgs, callee.name));
            } else {
                callback(null, data);
            }
        } catch (e) {
            console.log("error in try catch fn");
            callback(e);
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
import { DispenserOptions, IDispenser, PrinterOptions } from "../interface/IDispenser";
import ModbusRTU from "modbus-serial";
// import { QueueObject, queue } from 'async';
import { SerialPort } from 'serialport';
import { AutoDetectTypes } from '@serialport/bindings-cpp';
import { execFile } from 'child_process';
import * as path from 'path';
import { Seneca, Z10DIN_Workflow } from "../workflows/GateX";
import { ConsoleLogger, IWorkflowHost, WorkflowConfig, configureWorkflow } from "workflow-es";

export class ModBusDispenser implements IDispenser {
    connection: Promise<Seneca>;
    printer?: SerialPort<AutoDetectTypes>;
    config: WorkflowConfig;
    host: IWorkflowHost;

    constructor(socket: Seneca, printer?: SerialPort, options?: DispenserOptions) {
        this.printer = printer;
        this.config = configureWorkflow();
        // config.useLogger(new ConsoleLogger());
        const host = this.config.getHost();
        this.host = host;
        this.host.registerWorkflow(Z10DIN_Workflow);
        this.connection = new Promise<Seneca>((resolve) => {
            host.start().then(() => {
                host.startWorkflow("z10d1n-world", 1, socket).then((workId) => {
                    socket.workId = workId
                    console.log("Workflow started with id: " + workId);
                    resolve(socket);
                });
            });
        });
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

    async processTaskMTU(task: any) {
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
            Promise.resolve(callee.call(this, calleeArgs || undefined)).then(async (data: any) => {
                if (bindFunction instanceof Function) {
                    const result = await bindFunction.call(this, data, calleeArgs || undefined, callee.name);
                    console.log("bindFunction", result);
                    resolve(result);
                } else {
                    resolve(data);
                }
            }).catch((err: any) => {
                reject(err);
            });
        });
    }

    executeInPriority(callee: any, bindFunction: any = undefined, calleeArgs: any = undefined): Promise<any> {
        return this.execute(callee, bindFunction, calleeArgs);
    }

    async disconnect(callback: any) {
        const connection = await this.connection;
        connection.client.close(async () => {
            if (connection.workId) {
                await this.host.terminateWorkflow(connection.workId);
            }

            if (!this.printer) {
                return callback();
            }

            this.printer.close(() => {
                callback();
            });
        });
    }

    toFixedNumber(num: number, digits: number, base?: number) {
        const pow = Math.pow(base || 10, digits);
        return Math.round(num * pow) / pow;
    }

    debugLog(fnName: string, message: string) {
        console.log(`[${fnName}] - ${message}`);
    }

    /**
    * Convert String to HEX
    * @param num
    * @returns
    */
    str2hex(num: string) {
        let str = '';
        for (let i = 0; i < num.length; i++) {
            str += num.charCodeAt(i).toString(16);
        }
        return str;
    }

    /**
    * right align value in a string.
    * @param label
    * @param value
    * @param totalWidth
    * @returns
    */
    rightAlignValue = (label: string, valueStr: string, totalWidth: number) => {
        console.log('[rightAlignValue]', label, valueStr, totalWidth);
        const value = valueStr ? valueStr + "" : 'N/A';
        const labelWidth = label.length;
        const valueWidth = value.length;
        const spacesToAdd = totalWidth - labelWidth - valueWidth;

        const alignedString = label + ' '.repeat(spacesToAdd) + value;
        return alignedString;
    }

    /**
    * Center Align Value in a string
    * @param value
    * @param totalWidth
    */
    centerAlignValue = (value: string, totalWidth: number) => {
        const valueWidth = value.length;
        const spacesToAdd = totalWidth - valueWidth;
        const leftSpaces = Math.floor(spacesToAdd / 2);
        const rightSpaces = spacesToAdd - leftSpaces;

        const alignedString = ' '.repeat(leftSpaces) + value + ' '.repeat(rightSpaces);
        return alignedString;
    }

    hexStringToByte(printText: string, needle: number): number {
        const hexPair: string = printText.substring(needle, needle + 2); // More concise way to extract substring
        return parseInt(hexPair, 16); // Use parseInt for hex conversion
    }

    // Function to execute a shell script and check if the result is "true"
    async executeShellScriptAndCheck(scriptPath: string): Promise<boolean> {
        const absoluteScriptPath = path.join(__dirname, scriptPath);
        console.log('Executing script: ', absoluteScriptPath);

        return new Promise((resolve, reject) => {
            execFile(absoluteScriptPath, (error, stdout, stderr) => {
                if (error) {
                    // If there's an error, consider the script execution unsuccessful
                    console.error('Console:', stderr);
                    console.error('Error:', error);
                    resolve(false);
                } else {
                    // If the script output is "true", consider the script execution successful
                    resolve(stdout.trim() === 'true');
                }
            });
        });
    }
}
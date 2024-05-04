import { DispenserOptions, IDispenser, PrinterOptions } from "../interface/IDispenser";
import ModbusRTU from "modbus-serial";
// import { QueueObject, queue } from 'async';
import { SerialPort } from 'serialport';
import { AutoDetectTypes } from '@serialport/bindings-cpp';

export class ModBusDispenser implements IDispenser {
    connection: ModbusRTU;
    printer?: SerialPort<AutoDetectTypes>;


    constructor(socket: ModbusRTU, printer?: SerialPort, options?: DispenserOptions) {
        this.connection = socket;
        this.printer = printer;
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
            callee.call(this, calleeArgs || undefined).then((data: any) => {
                if (bindFunction instanceof Function) {
                    const result = bindFunction.call(this, data, calleeArgs || undefined, callee.name);
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

    disconnect(callback: any): void {
        this.connection.close(callback);
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
}
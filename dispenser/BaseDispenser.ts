import { IDispenser } from "../IDispenser";
import { QueueObject, queue } from 'async';
import { SerialPort } from 'serialport';
import { AutoDetectTypes } from '@serialport/bindings-cpp';
import { InterByteTimeoutParser } from '@serialport/parser-inter-byte-timeout'

export class BaseDispenser implements IDispenser {
  connection: SerialPort<AutoDetectTypes>;
  queue: QueueObject<any>;
  innerByteTimeoutParser: InterByteTimeoutParser;
  // logger: Logger;

  constructor(socket: SerialPort) {
    this.connection = socket;
    this.queue = queue(this.processTask.bind(this), 1); 
    this.innerByteTimeoutParser = this.connection.pipe(new InterByteTimeoutParser({ interval: 200 }));
    // Adjust concurrency as needed
    // this.logger = new Logger({id: 'dispenser', useConsole: false});
  }

  processTask(task: any, callback: any) {
    const {bindFunction, callee, calleeArgs} = task;
    this.innerByteTimeoutParser.once('data', (data: any): void => {
      try {
        if (bindFunction instanceof Function) {
          callback(null, bindFunction.call(this, data.toString('hex'), calleeArgs, callee.name));
        } else {
          callback(null, data.toString('hex'));
        }
      } catch (e) {
        console.log("error in try catch fn");
        callback(e);
      }
    });
    callee.call(this, calleeArgs || undefined);
  }

  // bind(fn: (...args: any[]) => void) {
  //   return this.connection.pipe(new InterByteTimeoutParser({ interval: 200 })).addListener('data', fn);
  // }

  // unbind(fn: (...args: any[]) => void) {
  //   return this.connection.removeListener('data', fn);
  // }

  execute(callee: any, bindFunction?: (...args: any[]) => unknown, calleeArgs: any = undefined): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ callee, bindFunction, calleeArgs }, (err, result) => {
        // this.connection.listeners('data').forEach((listener: any) => {
        //   console.log('listener found!!');
        //   this.connection.removeListener('data', listener);
        // });

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

  processExternalPump(res: string) {
    return JSON.parse(res);
  }

  /**
  * Splitter for string from last
  * @param str
  * @param cutLength
  * @returns
  */
  cutStringFromLast(str: string, cutLength: number, cutFromLast: boolean) {
    if (cutFromLast) {
      return str.substring(str.length - cutLength);
    }

    return str.substring(0, cutLength);
  }

  /**
  * hex to ascii
  *
  * @param hex string
  * @returns
  */
  hex2a(hex: string) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const v = parseInt(hex.substr(i, 2), 16);
      if (v) str += String.fromCharCode(v);
    }
    return str;
  }

  /**
  * hex to binary string
  * @param data
  * @returns
  */
  hex2bin(data: string) {
    return data.split('').map(i =>
      parseInt(i, 16).toString(2).padStart(4, '0')).join('');
    }

    hexToFloat(hexString: string) { //bigindian hex to float
      const hex = parseInt(hexString, 16);
      const sign = hex >> 31 ? -1 : 1;
      const exponent = (hex >> 23) & 0xFF;
      return sign * (hex & 0x7fffff | 0x800000) * 1.0 / Math.pow(2, 23) * Math.pow(2, (exponent - 127));
    }

    hexToNumber(str: string) {
      // Pad the string with zeroes to 16 characters.
      // You can omit this if you control your inputs.
      // str = (str + "0000000000000000").slice(0,16);
      if(str.length < 16) {
        throw new Error('Invalid Hex for number conversion');
      }

      // Split into bits: sign (1), exponent (11), significand (52).
      const sign_and_exponent_bits = parseInt(str.slice(0,3), 16);
      const sign = sign_and_exponent_bits >= 0x800 ? -1 : +1;
      const exponent_bits = sign_and_exponent_bits & ((1<<11) - 1);
      const significand_bits = parseInt(str.slice(3,16), 16);

      // Classify the floating-point value.
      if (exponent_bits == 0x7FF)  // infinity | not a number
      return significand_bits == 0 ? sign * Number.POSITIVE_INFINITY : Number.NaN;
      else if (exponent_bits == 0)  // zero | subnormal number
      return sign * Math.pow(2, 1-1023-52) * significand_bits;
      else  // normal number
      return sign * Math.pow(2, exponent_bits-1023-52) * (Math.pow(2, 52) + significand_bits);
    }

    toFixedNumber(num: number, digits: number, base?: number) {
      const pow = Math.pow(base || 10, digits);
      return Math.round(num * pow) / pow;
    }

    debugLog(fnName: string, message: string) {
      console.log(`[${fnName}] - ${message}`);
    }

    decimalToBinaryTwosComplement(decimal: number, bitWidth: number) {
      const absValue = Math.abs(decimal);
      const binary = absValue.toString(2).padStart(bitWidth - 1, '0');
      return decimal >= 0
      ? binary.padStart(bitWidth, '0')
      : ('1' + binary).replace(/[01]/g, (bit: string) => (parseInt(bit, 10) ^ 1).toString(2));
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
  }

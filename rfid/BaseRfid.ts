import { IRfid } from "./interface/IRfid";
import { SerialPort } from 'serialport';
import { QueueObject, queue } from 'async';
import { InterByteTimeoutParser } from '@serialport/parser-inter-byte-timeout';

export class BaseRfid implements IRfid {
  connection: SerialPort;
  queue: QueueObject<any>;
  innerByteTimeoutParser: InterByteTimeoutParser;

  constructor(socket: SerialPort) {
    this.connection = socket;
    this.queue = queue(this.processRfidTask.bind(this), 1); 
    this.innerByteTimeoutParser = this.connection.pipe(new InterByteTimeoutParser({ interval: 200 }));
  }

  processRfidTask(task: any, callback: any) {
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
    this.queue = queue(this.processRfidTask.bind(this), 1);
  }

  /**
   * Splitter for string from last
   * @param str
   * @param cutLength 
   * @returns 
   */
  cutStringFromLast(str: string, cutLength: number, cutFromLast: boolean) {
    if (cutFromLast)
      return str.substring(str.length - cutLength);
    else
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

  toFixedNumber(num: number, digits: number, base?: number) {
    const pow = Math.pow(base || 10, digits);
    return Math.round(num * pow) / pow;
  }

  debugLog(message: string, data: any) {
    console.log(`[${new Date().toISOString()}] ${message}: ${JSON.stringify(data)}`);
  }
}

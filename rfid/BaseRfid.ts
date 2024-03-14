import { IRfid } from "../IRfid";
import Logger from 'idb-logger';

export class BaseRfid implements IRfid {
  connection: WebSocket;
  logger: Logger;

  constructor(socket: WebSocket) {
    this.connection = socket;
    this.logger = new Logger({id: 'rfid', useConsole: false});
  }

  bind(fn: EventListenerOrEventListenerObject) {
    return this.connection.addEventListener('message', fn);
  }

  unbind(fn: EventListenerOrEventListenerObject) {
    return this.connection.removeEventListener('message', fn);
  }

  execute(callee: any, bindFunction: any = undefined, calleeArgs: any = undefined): Promise<any> {
    return new Promise((resolve, reject) => {
      const totalizerHandler = (event: any) => {
        try {
          if (bindFunction instanceof Function) {
            resolve(bindFunction.call(this, event.data, calleeArgs));
          } else {
            resolve(event.data);
          }
        } catch (e) {
          reject(e);
        } finally {
          this.unbind(totalizerHandler);
        }
      };
      this.bind(totalizerHandler)
      if (calleeArgs) return callee.call(this, calleeArgs);
      callee.call(this);
    });
  }

  checkType() {
    this.connection.send("Dispenser");
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

  debugLog(fnName: string, message: string) {
    this.logger.log(`[${fnName}] - ${message}`);
  }

  /** export logs */
  async exportLogs(): Promise<any> {
    return await this.logger.getAll() ;
  }

  downloadLogs(): void {
    this.logger.download({name: "rfid-log-"+Date.now()});
  }
}

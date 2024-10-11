import { DispenserOptions, IDispenser, TotalizerResponse } from "../interface/IDispenser";
// import { QueueObject, queue } from 'async';
import { SerialPort } from 'serialport';
import { AutoDetectTypes } from '@serialport/bindings-cpp';
import { execFile } from 'child_process';
import * as path from 'path';
import { Seneca } from "../workflows/GateX";
import debug from 'debug';
import sqlite, { open } from 'sqlite';

import ModbusRTU from "modbus-serial";

const debugLog = debug('dispenser:modbus-dispenser');
export class ModBusDispenser implements IDispenser {
    connection: Promise<Seneca>;
    printer?: SerialPort<AutoDetectTypes>;
    pulseInterval?: NodeJS.Timeout;
    // config: WorkflowConfig;
    // host: IWorkflowHost;

    [key: string]: any;

    constructor(socket: Seneca, printer?: SerialPort, options?: DispenserOptions) {
        const _that = this;
        this.printer = printer;
        this.connection = new Promise<Seneca>((resolve) => {
            const client = new ModbusRTU();
            client.setID(socket.deviceId);
            client.setTimeout(socket.timeout);
            client.connectRTU(socket.address, { baudRate: socket.baudRate }).then(async () => {
                socket.client = client;
                const overflowCounterBuffer = await client.readHoldingRegisters(socket.overflowRegister, 1);
                const overCount =  overflowCounterBuffer.buffer.readUInt16BE(0);
                socket.overflowCount = overCount;
                socket.overflowOffset = 4294967296 * overCount;

                await this.initializeDatabase();

                _that.pulseInterval = setInterval(async function() {
                    const pulseCounter = await client.readHoldingRegisters(socket.pulseRegister,2);
                    const currentPulse = pulseCounter.buffer.readUInt32BE(0);
                    if(currentPulse < socket.pulseCount) {
                        debugLog('ReadPulseCounter: %s', "<< ===== Overflow Detected ===== >>");
                        const response = await client.writeRegister(socket.overflowRegister, ++socket.overflowCount);
                        socket.overflowOffset = 4294967296 * socket.overflowCount;
                    }
                    socket.previousPulseCount = socket.pulseCount;
                    socket.pulseCount = currentPulse;
                }, 500);

                resolve(socket);
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
            debugLog("bindFunction: %s", JSON.stringify(result));
            return result;
        } else {
            return data;
        }
    }

    async initializeDatabase(): Promise<void> {
        this.db = await open({
            filename: path.join(__dirname, 'dispenser.db'),
            driver: sqlite.Database
        });

        try {
            await this.db.run(`
                CREATE TABLE IF NOT EXISTS totalizer (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_code INTEGER,
                    customer_asset_id TEXT,
                    session_id TEXT,
                    totalizer_start REAL,
                    totalizer_end REAL,
                    batchNumber TEXT,
                    timestamp INTEGER
                )
            `);

            debugLog('Totalizer table initialized successfully');
        } catch (error) {
            console.error('Error initializing the database:', error);
            throw error;
        }
    }
    
    execute(callee: any, bindFunction?: (...args: any[]) => unknown, calleeArgs: any = undefined): Promise<any> {
        return new Promise((resolve, reject) => {
            Promise.resolve(callee.call(this, calleeArgs || undefined)).then(async (data: any) => {
                if (bindFunction instanceof Function) {
                    const result = await bindFunction.call(this, data, calleeArgs || undefined, callee.name);
                    debugLog("bindFunction: %s", JSON.stringify(result));
                    resolve(result);
                } else {
                    resolve(data);
                }
            }).catch((err: any) => {
                reject(err);
            });
        });
    }

    executeWork(strCallee: string, strBindFunction?: string, calleeArgs: any = undefined): Promise<any> {
        const callee = this[strCallee] as (...args: [any]) => any;
        const bindFunction = strBindFunction ? this[strBindFunction] : undefined;
        if(!callee) throw new Error("Invalid callee function");
        if(bindFunction && !(bindFunction instanceof Function)) throw new Error("Invalid Bind function");
        return this.execute(callee, bindFunction, calleeArgs);
    }

    executeInPriority(callee: any, bindFunction: any = undefined, calleeArgs: any = undefined): Promise<any> {
        return this.execute(callee, bindFunction, calleeArgs);
    }

    async disconnect(callback: any) {
        debugLog("disconnect: %s", "Requesting disconnection from Seneca")
        const connection = await this.connection;
        if(this.pulseInterval) clearInterval(this.pulseInterval);

        connection.client.close(async () => {
            if (!this.printer) {
                debugLog("disconnect: %s", "No printer connection found");
                return callback();
            }

            this.printer.close(() => {
                debugLog("disconnect: %s", "Printer connection closed");
                callback();
            });
        });
    }

    toFixedNumber(num: number, digits: number, base?: number) {
        const pow = Math.pow(base || 10, digits);
        return Math.round(num * pow) / pow;
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
        debugLog('rightAlignValue: %s',`${label}, ${valueStr}, ${totalWidth}`);
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

    async saveTotalizerRecordToDB(datObj: TotalizerResponse, orderCode: number, customerAssetId: string | undefined, sessionId: string | null, isStart: boolean): Promise<void> {
        if (!this.db) throw new Error("Database not initialized");
    
        try {
            if (isStart) {
                await this.db.run(
                    `INSERT INTO totalizer (order_code, customer_asset_id, session_id, totalizer_start, batchNumber, timestamp) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    orderCode, 
                    customerAssetId, 
                    sessionId,
                    datObj.totalizer,
                    datObj.batchNumber?.toString(), 
                    datObj.timestamp
                );
            } else {
                await this.db.run(
                    `UPDATE totalizer SET totalizer_end = ? WHERE order_code = ? AND customer_asset_id = ? AND session_id = ?`,
                    datObj.totalizer, 
                    orderCode, 
                    customerAssetId, 
                    sessionId
                );
            }
    
            debugLog(`Successfully wrote ${isStart ? 'start' : 'end'} totalizer to database: %o`, datObj);
        } catch (error) {
            console.error('Error writing totalizer to database:', error);
            throw error;
        }
    }

    async readTotalizerRecordFromDB(): Promise<{ orderCode: number, customerAssetId: string, sessionId: string, totalizerResponse: TotalizerResponse }> {
        if (!this.db) throw new Error("Database not initialized");
    
        try {
            const row = await this.db.get(
                `SELECT order_code, customer_asset_id, session_id, totalizer_start, batchNumber, timestamp 
                 FROM totalizer 
                 ORDER BY id DESC LIMIT 1`
            );
    
            if (row) {
                const totalizerResponse: TotalizerResponse = {
                    totalizer: Number(row.totalizer_start),
                    batchNumber: row.batchNumber,
                    timestamp: row.timestamp
                };
    
                debugLog('Successfully read object from database: %o', { orderCode: row.order_code, customerAssetId: row.customer_asset_id, totalizerResponse });
                
                return {
                    orderCode: row.order_code,
                    customerAssetId: row.customer_asset_id,
                    sessionId: row.session_id,
                    totalizerResponse
                };
            } else {
                throw new Error('No totalizer record found in the database');
            }
        } catch (error) {
            console.error('Error reading totalizer from database:', error);
            throw error;
        }
    }
    

    // Function to execute a shell script and check if the result is "true"
    async executeShellScriptAndCheck(scriptPath: string): Promise<boolean> {
        const absoluteScriptPath = path.join(__dirname, scriptPath);
        debugLog('Executing script: %s', absoluteScriptPath);

        return new Promise((resolve, reject) => {
            execFile(absoluteScriptPath, (error, stdout, stderr) => {
                if (error) {
                    // If there's an error, consider the script execution unsuccessful
                    debugLog('Console: %s', stderr);
                    debugLog('Error: %s', error);
                    resolve(false);
                } else {
                    // If the script output is "true", consider the script execution successful
                    resolve(stdout.trim() === 'true');
                }
            });
        });
    }
}
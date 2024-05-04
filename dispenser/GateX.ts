import { Chip, Line } from 'node-libgpiod';
import { ModBusDispenser } from "./base/ModBusDispenser";
import ModbusRTU from "modbus-serial";
import { DispenserOptions, TotalizerResponse, VolumeResponse } from './interface/IDispenser';
import { SerialPort } from 'serialport';

export class GateX extends ModBusDispenser {
    private AuthorizeValveGPIO: number = 26;
    private chip: Chip = new Chip(0);
    private AuthorizeValveLine: Line;
    private kFactor: number | undefined;
    private startTotalizer: TotalizerResponse | undefined;

    private slaveAddress = 1;
    private startingRegister = 10;
    private numRegisters = 2;
    private preset: number;

    constructor(socket: ModbusRTU, printer: SerialPort, options: DispenserOptions) {
        super(socket, printer, options);
        let { kFactor } = options;
        this.kFactor = kFactor;
        this.preset = 0;
        this.AuthorizeValveLine = new Line(this.chip, this.AuthorizeValveGPIO);
        this.AuthorizeValveLine.requestOutputMode();
    }

    async totalizer() {
        await this.connection.setID(this.slaveAddress);
        return await this.connection.readHoldingRegisters(this.startingRegister, this.numRegisters);
    }

    async readSale() {
        return await this.totalizer();
    }

    processTotalizerRes(data: any): TotalizerResponse {
        const pulse = this.hexToDecLittleEndian(data.buffer.toString('hex'));
        console.log("pulse", pulse);
        if(!this.kFactor || this.kFactor < 0) {
            console.warn('K-Factor not set for this dispenser, you might get wrong totalizer value');
        }

        var totalizer = {
            totalizer: pulse,
            timestamp: Date.now()
        };

        if(!this.startTotalizer) {
            this.startTotalizer = totalizer;
        }
        console.log("totalizer", totalizer);
        return totalizer;
    }

    processTotalizer(data: any) {
        console.log(arguments);
        return this.processTotalizerRes(data).totalizer;
    }

    isOrderComplete(res: any, quantity: number) {
        const currentTotalizer = this.processTotalizerRes(res);
        const readsale = this.calculateVolume(this.startTotalizer, currentTotalizer);
        if (readsale.volume > quantity - 1) {
            const response = {
                status: true,
                percentage: this.toFixedNumber((readsale.volume / quantity) * 100.00, 2),
                currentFlowRate: readsale.litersPerMinute,
                averageFlowRate: readsale.litersPerMinute,
                batchNumber: this.startTotalizer?.totalizer || 0,
                totalizer: currentTotalizer.totalizer,
                dispensedQty: this.toFixedNumber(readsale.volume, 2)
            };

            this.debugLog("isOrderComplete", JSON.stringify(response));
            return response;
        }

        const response = {
            status: false,
            percentage: this.toFixedNumber((readsale.volume / quantity) * 100.00, 2),
            currentFlowRate: readsale.litersPerMinute,
            averageFlowRate: readsale.litersPerMinute,
            batchNumber: this.startTotalizer?.totalizer || 0,
            totalizer: currentTotalizer.totalizer,
            dispensedQty: this.toFixedNumber(readsale.volume, 2)
        };

        this.debugLog("isOrderComplete", JSON.stringify(response));
        return response;
    }

    checkType() {
        return 'GATEX';
    }

    getExternalPump() {
        return "false";
    }

    async authorizeSale() {
        try {
            await this.AuthorizeValveLine.setValue(1);
            return "true";
        } catch (error) {
            console.error(error);
            return "false";
        }
    }

    async pumpStop() {
        try {
            await this.AuthorizeValveLine.setValue(0);
            return "true";
        } catch (error) {
            console.error(error);
            return "false";
        }
    }

    processCommand(res: string) {
        if(res === "true") {
            return true;
        }

        return false;
    }

    processReadPreset(res: string) {
        return parseInt(res);
    }

    pumpStart() {
        // Not implemented
        return "true";
    }

    readAuth() {
        // Not implemented
        return "true";
    }

    cancelPreset() {
        // Not implemented
        this.preset = 0;
        return "true";
    }

    resumeDispencer() {
        // Not implemented
        return "true";
    }

    setPreset(quantity: number) {
        // Not implemented
        this.preset = quantity
        return "true";
    }

    readPreset() {
        // Not implemented
        return this.preset;
    }

    clearSale() {
        // Not implemented
        this.preset = 0;
        this.startTotalizer = undefined;
        return "true";
    }

    calculateVolume(previousTotalizer: TotalizerResponse | undefined, currentTotalizer: TotalizerResponse): VolumeResponse {
        if(!this.kFactor || this.kFactor < 0) {
            alert('K-Factor not set for this dispenser, you might get wrong volume!');
        }

        // Check if timestamps are valid and current timestamp is greater than previous
        if (!previousTotalizer || !currentTotalizer.timestamp || !previousTotalizer.timestamp || currentTotalizer.timestamp <= previousTotalizer.timestamp) {
            throw new Error('Invalud data or timestamps not in order'); // Invalid data or timestamps not in order
        }

        // Calculate the time difference in minutes
        const timeDifferenceInMinutes = (currentTotalizer.timestamp - previousTotalizer.timestamp) / (1000 * 60);

        // Calculate the volume difference (assuming totalizer represents volume)
        const volumeDifference = currentTotalizer.totalizer - previousTotalizer.totalizer;
        return {
            volume: Number((volumeDifference / (this.kFactor || 1)).toFixed(2)),
            litersPerMinute: volumeDifference / timeDifferenceInMinutes
        };
    }


    printReceipt(printObj: any) {
        const printWidth = 40;
        const printArr = [];

        this.debugLog("printReceipt", JSON.stringify(printObj));

        if (printObj?.isReceiptRequired) {
            printArr.push(this.str2hex(this.centerAlignValue("****  CUSTOMER COPY  ****", printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.centerAlignValue("FUELBUDDY FUEL SUPPLY LLC", printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("BOWSER No", printObj?.vehicleRegistrationNumber, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("ASSET No", printObj?.registrationNumber, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("DATE", (new Date(printObj?.orderDate)).toLocaleDateString(), printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("DRIVER", printObj?.driverCode, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("CUSTOMER", printObj?.customerCode, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("ORDER No", printObj?.orderCode, printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("Batch No", printObj?.batchCode, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("START TIME", (new Date(printObj?.startTime)).toLocaleTimeString(), printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("END TIME", (new Date(printObj?.endTime)).toLocaleTimeString(), printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("PRODUCT", printObj?.productName, printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("DELIVERED", printObj?.quantity, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("START TOT.", printObj?.startTotalizer, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("END TOT.", printObj?.endTotalizer, printWidth)));
            if (printObj?.odometerReading) {
                printArr.push(this.str2hex(this.rightAlignValue("ODOMETER", printObj?.odometerReading, printWidth)));
            }
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("GROSS VOLUME", printObj?.unitOfMeasure, printWidth)));
            printArr.push('0A0A1D564100');
        }

        printArr.push(this.str2hex(this.centerAlignValue("****  PRINT COPY  ****", printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.centerAlignValue("FUELBUDDY FUEL SUPPLY LLC", printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("BOWSER No", printObj?.vehicleRegistrationNumber, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("ASSET No", printObj?.registrationNumber, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("DATE", (new Date(printObj?.orderDate)).toLocaleDateString(), printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("DRIVER ID", printObj?.driverCode, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("CUSTOMER ID", printObj?.customerCode, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("ORDER No", printObj?.orderCode, printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("Batch No", printObj?.batchCode, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("START TIME", (new Date(printObj?.startTime)).toLocaleTimeString(), printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("END TIME", (new Date(printObj?.endTime)).toLocaleTimeString(), printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("PRODUCT", printObj?.productName, printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("DELIVERED", printObj?.quantity, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("START TOT.", printObj?.startTotalizer, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("END TOT.", printObj?.endTotalizer, printWidth)));
        if (printObj?.odometerReading) {
            printArr.push(this.str2hex(this.rightAlignValue("ODOMETER", printObj?.odometerReading, printWidth)));
        }
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("GROSS VOLUME", printObj?.unitOfMeasure, printWidth)));

        this.debugLog("printReceipt", `${printArr.join('0A')}0A0A1D564200`);
        return this.printOrder(`${printArr.join('0A')}0A0A1D564200`);
    }

    printOrder(printText: string): boolean {
        if(!this.printer) {
            throw new Error('Printer is required for GateX dispenser');
        }

        const buffer = Buffer.from(printText, 'hex');
        return this.printer.write(buffer);
      }


    // ...
}
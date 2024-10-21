import { ModBusDispenser } from "./base/ModBusDispenser";
import { DispenserOptions, TotalizerResponse, VolumeResponse } from './interface/IDispenser';
import { SerialPort } from 'serialport';
import { Seneca } from "./workflows/GateX";
import debug from 'debug';
const debugLog = debug('dispenser:GateX');
export class GateX extends ModBusDispenser {
    private AuthorizeValveGPIO: number = 26;
    private kFactor: number;
    private startTotalizer: TotalizerResponse | undefined;

    private preset: number;

    constructor(socket: Seneca, printer: SerialPort, options: DispenserOptions) {
        super(socket, printer, options);
        let { kFactor } = options;
        if(!kFactor || kFactor < 0) {
            debugLog('K-Factor not set for this dispenser, you might get wrong totalizer value: %o', kFactor);
        }
        this.kFactor = kFactor || 1;
        this.preset = 0;
    }

    async totalizer() {
        debugLog('totalizer: %s', 'awaiting connection');
        const seneca = await this.connection;
        debugLog('totalizer: %s', 'awaiting readPulse');
        return seneca.readPulse();
    }

    async readSale(orderCode: number, customerAssetId: string, sessionId: string) {
        if(!this.startTotalizer) {
            this.startTotalizer = (await this.readTotalizerRecordFromDB(orderCode, customerAssetId, sessionId)).totalizerResponse;
        }
        return await this.totalizer();
    }

    async readStatus() {
        return (await this.executeShellScriptAndCheck('scripts/GateX/status.sh')) ? "true" : "false";
    }

    processTotalizerRes(pulse: any): TotalizerResponse {
        debugLog("pulse: %o", pulse);

        var totalizer = {
            totalizer: this.toFixedNumber(pulse / this.kFactor, 2),
            batchNumber: pulse,
            timestamp: (new Date()).getTime()
        } as TotalizerResponse;

        // if(!this.startTotalizer) {
        //     this.startTotalizer = totalizer;
        // }
        debugLog("totalizer: %o", totalizer);
        return totalizer;
    }

    processTotalizer(data: any) {
        debugLog("processTotalizer: %o", arguments);
        return this.processTotalizerRes(data).totalizer;
    }

    processTotalizerWithBatch(data: any): TotalizerResponse {
        debugLog("processTotalizerWithBatch: %o", arguments);
        return this.processTotalizerRes(data);
    }

    isIdle(res: string) {
        debugLog("isSaleCloseable: %s", "true");
        return res.trim() === 'false';
    }

    isSaleCloseable() {
        debugLog("isSaleCloseable: %s", "true");
        return true;
    }

    isDispensing(res: string) {
        debugLog("isDispensing: %s", res);
        return res.trim() === 'true';
    }

    isPumpStopped(res: string) {
        debugLog("isPumpStopped: %s", res);
        return res.trim() === 'false';
    }

    isOnline() {
        return true;
    }

    isOrderComplete(res: any, quantity: number) {
        const currentTotalizer = this.processTotalizerRes(res);
        const readsale = this.calculateVolume(this.startTotalizer, currentTotalizer);
        if (readsale.volume > quantity - 1) {
            const response = {
                status: true,
                percentage: this.toFixedNumber(readsale.volume / quantity * 100, 2),
                currentFlowRate: readsale.litersPerMinute,
                averageFlowRate: readsale.litersPerMinute,
                batchNumber: this.startTotalizer?.batchNumber || 0,
                totalizer: currentTotalizer.totalizer,
                dispensedQty: this.toFixedNumber(readsale.volume, 2)
            };

            debugLog("isOrderComplete: %o", response);
            return response;
        }

        const response = {
            status: false,
            currentFlowRate: readsale.litersPerMinute,
            averageFlowRate: readsale.litersPerMinute,
            batchNumber: this.startTotalizer?.batchNumber || 0,
            totalizer: currentTotalizer.totalizer,
            dispensedQty: this.toFixedNumber(readsale.volume, 2)
        };

        debugLog("isOrderComplete: %o", response);
        return response;
    }

    checkType() {
        return 'GATEX';
    }

    getExternalPump() {
        return "false";
    }

    async authorizeSale(orderCode: number, customerAssetId: string, sessionId: string) {
        try {
            if(!this.startTotalizer) {
                const totalizer = this.processTotalizerRes(await this.totalizer());
                // changed by repo owner.
                if(!totalizer) throw new Error('Totalizer not initialized');
                this.startTotalizer = totalizer;
            }

            await this.saveTotalizerRecordToDB(this.startTotalizer, orderCode, customerAssetId, sessionId, true);
            return (await this.executeShellScriptAndCheck('scripts/GateX/authorize.sh')) ? "true" : "false";
        } catch (error) {
            console.error(error);
            return "false";
        }
    }

    async pumpStop() {
        try {
            return (await this.executeShellScriptAndCheck('scripts/GateX/unauthorize.sh')) ? "true" : "false";
        } catch (error) {
            console.error(error);
            return "false";
        }
    }

    async suspendSale() {
        debugLog("suspendSale: %s", "Stop");
        return await this.pumpStop();
    }

    isSaleSuspended(res: string) {
        return res === "false"; // GPIO pin is low now if solinoid is closed.
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
        return "true";
    }

    readAuth() {
        return "true";
    }

    cancelPreset() {
        this.preset = 0;
        return "true";
    }

    resumeDispencer() {
        return "true";
    }

    setPreset(quantity: number) {
        this.preset = quantity
        return "true";
    }

    isPrinterAvailable(res: string): boolean {
        return this.printer?.isOpen || false;
    }


    readPreset() {
        return this.preset;
    }

    async clearSale(orderCode: number, customerAssetId: string, sessionId: string) {
        const totalizer = this.processTotalizerRes(await this.totalizer());
        await this.saveTotalizerRecordToDB(totalizer, orderCode, customerAssetId, sessionId, false);

        this.preset = 0;
        this.startTotalizer = undefined;

        return "true";
    }

    calculateVolume(previousTotalizer: TotalizerResponse | undefined, currentTotalizer: TotalizerResponse): VolumeResponse {
        // Check if timestamps are valid and current timestamp is greater than previous
        if (!previousTotalizer || !currentTotalizer.timestamp || !previousTotalizer.timestamp || currentTotalizer.timestamp <= previousTotalizer.timestamp) {
            debugLog("calculateVolume: %o", { previousTotalizer, currentTotalizer });
            throw new Error('Invalid data or timestamps not in order'); // Invalid data or timestamps not in order
        }

        // Calculate the time difference in minutes
        const timeDifferenceInMinutes = (currentTotalizer.timestamp - previousTotalizer.timestamp) / 60000;

        // Calculate the volume difference (assuming totalizer represents volume)
        const volumeDifference = currentTotalizer.totalizer - previousTotalizer.totalizer;
        return {
            volume: volumeDifference,
            litersPerMinute: this.toFixedNumber((volumeDifference / timeDifferenceInMinutes), 2)
        };
    }


    printReceipt(printObj: any) {
        const printWidth = 40;
        const printArr = [];

        debugLog("printReceipt: %o", printObj);

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

        debugLog("printReceipt: %s", `${printArr.join('0A')}0A0A1D564200`);
        return this.printOrder(`${printArr.join('0A')}0A0A1D564200`);
    }

    printOrder(printText: string): boolean {
        if(!this.printer) {
            throw new Error('Printer is required for GateX dispenser');
        }

        const buffer = Buffer.from(printText, 'hex');
        this.printer.write(buffer);
        return true;
    }

    // ...
}
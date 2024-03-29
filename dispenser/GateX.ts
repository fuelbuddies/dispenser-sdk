import { Chip, Line } from 'node-libgpiod';
import { ModBusDispenser } from "./base/ModBusDispenser";
import ModbusRTU from "modbus-serial";
import { DispenserOptions, TotalizerResponse, VolumeResponse } from './interface/IDispenser';

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

    constructor(socket: ModbusRTU, options: DispenserOptions) {
        super(socket, options);
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

    processTotalizerResponse(data: any): TotalizerResponse {
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

        return totalizer;
    }

    processTotalizer(data: any) {
        return this.processTotalizerResponse(data).totalizer;
    }

    isOrderComplete(res: any, quantity: number) {
        const currentTotalizer = this.processTotalizerResponse(res);
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


    // ...
}
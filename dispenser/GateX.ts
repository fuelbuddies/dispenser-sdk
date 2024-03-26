import { Chip, Line } from 'node-libgpiod';
import { ModBusDispenser } from "./base/ModBusDispenser";
import ModbusRTU from "modbus-serial";
import { DispenserOptions } from './interface/IDispenser';

export class GateX extends ModBusDispenser {
    private AuthorizeValveGPIO: number = 26;
    private chip: Chip = new Chip(0);
    private AuthorizeValveLine: Line;
    private kFactor: number | undefined;

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

    processTotalizer(data: any) {
        const pulse = this.hexToDecLittleEndian(data.buffer.toString('hex'));
        if(!this.kFactor || this.kFactor < 0) {
            console.warn('K-Factor not set for this dispenser, you might get wrong totalizer value');
        }
        return Number((pulse / (this.kFactor || 1)).toFixed(2));
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
        return "true";
    }
    // ...
}
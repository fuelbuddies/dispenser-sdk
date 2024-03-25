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
    private startingRegister = 561;
    private numRegisters = 3;

    constructor(socket: ModbusRTU, options: DispenserOptions) {
        super(socket, options);
        let { kFactor } = options;
        this.kFactor = kFactor;
        this.AuthorizeValveLine = new Line(this.chip, this.AuthorizeValveGPIO);
        this.AuthorizeValveLine.requestOutputMode();
    }

    async totalizer() {
        await this.connection.setID(this.slaveAddress);
        return await this.connection.readHoldingRegisters(this.startingRegister, this.numRegisters);
    }

    processTotalizer(data: any) {
        console.log(data);
        return 0;
    }

    checkType() {
        return 'GATEX';
    }

    getExternalPump() {
        return "false";
    }

    authorizeSale() {
        this.AuthorizeValveLine.setValue(1);
    }

    pumpStop() {
        this.AuthorizeValveLine.setValue(0);
    }

    processCommand(res: string) {
        return true;
    }

    pumpStart() {
        // Not implemented
    }

    async readAuth() {
        // Not implemented
    }

    async cancelPreset() {
        // Not implemented
    }

    async resumeDispencer() {
        // Not implemented
    }
    // ...
}
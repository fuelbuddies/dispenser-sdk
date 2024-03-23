import { Chip, Line } from 'node-libgpiod';
import { ModBusDispenser } from "./base/ModBusDispenser";
import ModbusRTU from "modbus-serial";

export class GateX extends ModBusDispenser {
    private AuthorizeValveGPIO: number = 26;
    private chip: Chip = new Chip(0);
    private AuthorizeValveLine: Line;

    constructor(socket: ModbusRTU) {
        super(socket);
        this.AuthorizeValveLine = new Line(this.chip, this.AuthorizeValveGPIO);
        this.AuthorizeValveLine.requestOutputMode();
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
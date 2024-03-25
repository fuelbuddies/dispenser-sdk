import { Chip, Line } from 'node-libgpiod';
import { ModBusDispenser } from "./base/ModBusDispenser";
import ModbusRTU from "modbus-serial";
import { DispenserOptions } from './interface/IDispenser';

export class GateX extends ModBusDispenser {
    private AuthorizeValveGPIO: number = 26;
    private chip: Chip = new Chip(0);
    private AuthorizeValveLine: Line;

    constructor(socket: ModbusRTU, options?: DispenserOptions) {
        super(socket, options);
        this.AuthorizeValveLine = new Line(this.chip, this.AuthorizeValveGPIO);
    }

    checkType() {
        return 'GATEX';
    }
    
    getExternalPump() {
        return "false";
    }

    authorizeSale() {
        this.AuthorizeValveLine.requestOutputMode();
        this.AuthorizeValveLine.setValue(1);
    }

    pumpStop() {
        this.AuthorizeValveLine.requestOutputMode();
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
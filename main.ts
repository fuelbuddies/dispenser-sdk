import { Tokhiem } from "./dispenser/Tokhiem";
import { IsoilVegaTVersion10 } from "./dispenser/IsoilVegaTVersion10";
import { GateX } from "./dispenser/GateX";
import { RfidPetropoint } from "./rfid/RfidPetropoint";
import { findDispenserPort } from "./utils/findDispenserPort";
import { findRfidPort } from "./utils/findRfidPort";
import { DispenserOptions, IDispenser } from "./dispenser/interface/IDispenser";
import { SerialPort } from "serialport";
import { IRfid, RfidOptions } from "./rfid/interface/IRfid";
import ModbusRTU from "modbus-serial";

export { IDispenser, IRfid, RfidOptions, DispenserOptions };

/* Factory for creating dispenser objects */
export async function createDispenser(options: DispenserOptions): Promise<IDispenser> {
    const { dispenserType, hardwareId, attributeId, baudRate = 9600 } = options;
    switch (dispenserType) {
        case 'Tokhiem':
            return new Tokhiem(new SerialPort({path: await findDispenserPort(hardwareId, attributeId), baudRate: baudRate }), options);
        case 'IsoilVegaTVersion10':
            return new IsoilVegaTVersion10(new SerialPort({path: await findDispenserPort(hardwareId, attributeId), baudRate: baudRate }), options);
        case 'GateX':
            const serialPort = new ModbusRTU();
            await serialPort.connectRTUBuffered(await findDispenserPort(hardwareId, attributeId), { baudRate: baudRate });
            return new GateX(serialPort, options);
        default:
            throw new Error('Invalid dispenser type');
    }
}

/* Factory for creating dispenser objects */
export async function createRfid(options: RfidOptions): Promise<IRfid> {
    const { rfidType, hardwareId, attributeId, baudRate = 19200 } = options;
    const serialPort = new SerialPort({path: await findRfidPort(hardwareId, attributeId), baudRate: baudRate });
    switch (rfidType) {
        case 'PETROPOINTHECTRONICS':
            return new RfidPetropoint(serialPort);
        default:
            throw new Error('Invalid dispenser type');
    }
}

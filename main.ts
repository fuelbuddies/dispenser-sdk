import { Tokhiem } from "./dispenser/Tokhiem";
import { IsoilVegaTVersion10 } from "./dispenser/IsoilVegaTVersion10";
import { RfidPetropoint } from "./rfid/RfidPetropoint";
import { findDispenserPort } from "./utils/findDispenserPort";
import { findRfidPort } from "./utils/findRfidPort";
import { IDispenser } from "./dispenser/interface/IDispenser";
import { SerialPort } from "serialport";
import { IRfid } from "./rfid/interface/IRfid";

export { IDispenser, IRfid };

/* Factory for creating dispenser objects */
export async function createDispenser(dispenserType: string, hardwareId: string, attributeId: string, baudRate: number = 9600): Promise<IDispenser> {
    const serialPort = new SerialPort({path: await findDispenserPort(hardwareId, attributeId), baudRate: baudRate });
    switch (dispenserType) {
        case 'Tokhiem':
            return new Tokhiem(serialPort);
        case 'IsoilVegaTVersion10':
            return new IsoilVegaTVersion10(serialPort);
        default:
            throw new Error('Invalid dispenser type');
    }
}

/* Factory for creating dispenser objects */
export async function createRfid(dispenserType: string, hardwareId: string, attributeId: string, baudRate: number = 19200): Promise<IRfid> {
    const serialPort = new SerialPort({path: await findRfidPort(hardwareId, attributeId), baudRate: baudRate });
    switch (dispenserType) {
        case 'PETROPOINTHECTRONICS':
            return new RfidPetropoint(serialPort);
        default:
            throw new Error('Invalid dispenser type');
    }
}

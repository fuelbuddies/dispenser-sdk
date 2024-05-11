import { findDispenserPort } from "./utils/findDispenserPort";
import { findRfidPort } from "./utils/findRfidPort";
import { DispenserOptions, IDispenser } from "./dispenser/interface/IDispenser";
import { SerialPort } from "serialport";
import { IRfid, RfidOptions } from "./rfid/interface/IRfid";
import { getConfigFromEnv, getRFIDConfigFromEnv } from './utils/envParser';
import { Seneca } from "./dispenser/workflows/GateX";
import { delay } from "./utils/delay";

export { IDispenser, IRfid, RfidOptions, DispenserOptions, getConfigFromEnv, getRFIDConfigFromEnv};

/* Factory for creating dispenser objects */
export async function createDispenser(options: DispenserOptions): Promise<IDispenser> {
    const { dispenserType, hardwareId, attributeId, baudRate = 9600, printer } = options;
    switch (dispenserType) {
        case 'Tokhiem':
            const DispenserType = await import('./dispenser/Tokhiem');
            return new DispenserType.Tokhiem(new SerialPort({path: await findDispenserPort(hardwareId, attributeId), baudRate: baudRate }), options);
        case 'IsoilVegaTVersion10':
            const IsoilVegaTVersion10 = await import('./dispenser/IsoilVegaTVersion10');
            return new IsoilVegaTVersion10.IsoilVegaTVersion10(new SerialPort({path: await findDispenserPort(hardwareId, attributeId), baudRate: baudRate }), options);
        case 'GateX':
            const GateX = await import('./dispenser/GateX');
            const serialPort = new Seneca(options);
            serialPort.address = await findDispenserPort(hardwareId, attributeId);
            if(!printer) throw new Error('Printer is required for GateX dispenser');
            const printerPort = new SerialPort({path: await findDispenserPort(printer.hardwareId, printer.attributeId), baudRate: printer.baudRate || 9600});
            const gatex = new GateX.GateX(serialPort, printerPort, options);
            await delay(5000);
            return gatex;
        default:
            throw new Error('Invalid dispenser type');
    }
}

/* Factory for creating dispenser objects */
export async function createRfid(options: RfidOptions): Promise<IRfid> {
    const { rfidType, hardwareId, attributeId, baudRate = 19200 } = options;
    switch (rfidType) {
        case 'PETROPOINTHECTRONICS':
            const serialPort = new SerialPort({path: await findRfidPort(hardwareId, attributeId), baudRate: baudRate });
            const RfidPetropoint = await import('./rfid/RfidPetropoint');
            return new RfidPetropoint.RfidPetropoint(serialPort);
        default:
            throw new Error('Invalid rfid type');
    }
}

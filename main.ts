import { findDispenserPort } from "./utils/findDispenserPort";
import { findRfidPort } from "./utils/findRfidPort";
import { DispenserOptions, IDispenser } from "./dispenser/interface/IDispenser";
import { SerialPort } from "serialport";
import { IRfid, RfidOptions } from "./rfid/interface/IRfid";
import { getConfigFromEnv, getRFIDConfigFromEnv } from './utils/envParser';

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
            const ModbusRTU = await import('modbus-serial');
            const serialPort = new ModbusRTU.default();
            await serialPort.connectRTUBuffered(await findDispenserPort(hardwareId, attributeId), { baudRate: baudRate });
            if(!printer) throw new Error('Printer is required for GateX dispenser');
            const printerPort = new SerialPort({path: await findDispenserPort(printer.hardwareId, printer.attributeId), baudRate: printer.baudRate || 9600});
            return new GateX.GateX(serialPort, printerPort, options);
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
            throw new Error('Invalid dispenser type');
    }
}

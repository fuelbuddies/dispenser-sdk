import { findDispenserPort } from './utils/findDispenserPort';
import { findRfidPort } from './utils/findRfidPort';
import { DispenserOptions, IDispenser } from './dispenser/interface/IDispenser';
import { SerialPort } from 'serialport';
import { IRfid, RfidOptions } from './rfid/interface/IRfid';
import { getConfigFromEnv, getRFIDConfigFromEnv } from './utils/envParser';
import { Seneca } from './dispenser/workflows/GateX';
import { delay } from './utils/delay';
import debug from 'debug';
import { findPrinterPort } from './utils/findPrinterPort';
import { TCS3000 } from './dispenser/TCS3000';

const debugLog = debug('dispenser:main');
export { IDispenser, IRfid, RfidOptions, DispenserOptions, getConfigFromEnv, getRFIDConfigFromEnv };
export { PubSubConfig, getPubSubLogger, shutdownPubSubLogger } from './utils/PubSubLogger';

/* Factory for creating dispenser objects */
export async function createDispenser(options: DispenserOptions): Promise<IDispenser> {
	const { dispenserType, hardwareId, attributeId, baudRate = 9600, printer } = options;
	switch (dispenserType) {
		case 'Tokhiem':
			const DispenserType = await import('./dispenser/Tokhiem');
			const tokhiemUsbPath = await findDispenserPort(hardwareId, attributeId);
			debugLog('Dispenser found at: %o', tokhiemUsbPath);
			return new DispenserType.Tokhiem(new SerialPort({ path: tokhiemUsbPath, baudRate: baudRate }), options);
		case 'VeederEmr4':
			const VeederEmr4 = await import('./dispenser/VeederEmr4');
			const veederUsbPath = await findDispenserPort(hardwareId, attributeId);
			debugLog('Dispenser found at: %o', veederUsbPath);
			return new VeederEmr4.VeederEmr4(new SerialPort({ path: veederUsbPath, baudRate: baudRate }), options);
		case 'IsoilVegaTVersion10':
			const IsoilVegaTVersion10 = await import('./dispenser/IsoilVegaTVersion10');
			const ISoilUsbPath = await findDispenserPort(hardwareId, attributeId);
			debugLog('Dispenser found at: %o', ISoilUsbPath);
			return new IsoilVegaTVersion10.IsoilVegaTVersion10(new SerialPort({ path: ISoilUsbPath, baudRate: baudRate }), options);
		case 'TCS3000':
			const TCSUsbPath = await findDispenserPort(hardwareId, attributeId);
			debugLog('Dispenser found at: %o', TCSUsbPath);
			if (!printer) throw new Error('Printer is required for TCS dispenser');
			const TCS3000PrinterPath = await findPrinterPort(printer.hardwareId, printer.attributeId);
			debugLog('Printer found at: %o', TCS3000PrinterPath);
			const TCS3000printerPort = new SerialPort({ path: TCS3000PrinterPath, baudRate: printer.baudRate || 9600 });
			return new TCS3000(new SerialPort({ path: TCSUsbPath, baudRate: baudRate }), TCS3000printerPort, options);
		case 'GateX':
			const GateX = await import('./dispenser/GateX');
			const serialPort = new Seneca(options);
			serialPort.address = await findDispenserPort(hardwareId, attributeId);
			debugLog('Dispenser found at: %o', serialPort.address);
			if (!printer) throw new Error('Printer is required for GateX dispenser');
			const GateXPrinterPath = await findPrinterPort(printer.hardwareId, printer.attributeId);
			debugLog('Printer found at: %o', GateXPrinterPath);
			const printerPort = new SerialPort({ path: GateXPrinterPath, baudRate: printer.baudRate || 9600 });
			const gatex = new GateX.GateX(serialPort, printerPort, options);
			await delay(5000);
			return gatex;
		case 'Neogi':
			const Neogi = await import('./dispenser/Neogi');
			const neogiUsbPath = await findDispenserPort(hardwareId, attributeId);
			debugLog('Dispenser found at: %o', neogiUsbPath);
			return new Neogi.Neogi(new SerialPort({ path: neogiUsbPath, baudRate: baudRate }), options);
		default:
			throw new Error('Invalid dispenser type');
	}
}

/* Factory for creating dispenser objects */
export async function createRfid(options: RfidOptions): Promise<IRfid> {
	const { rfidType, hardwareId, attributeId, baudRate = 19200 } = options;
	switch (rfidType) {
		case 'PETROPOINTHECTRONICS':
			const serialPort = new SerialPort({ path: await findRfidPort(hardwareId, attributeId), baudRate: baudRate });
			const RfidPetropoint = await import('./rfid/RfidPetropoint');
			return new RfidPetropoint.RfidPetropoint(serialPort);
		default:
			throw new Error('Invalid rfid type');
	}
}

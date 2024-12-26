import { SerialPort } from 'serialport';
import { IsoilVegaTVersion10 } from '../dispenser/IsoilVegaTVersion10';
import { findDispenserPort, attributeId, hardwareId } from '../utils/findDispenserPort';
import { delay } from '../utils/delay';

describe('IsoilVegaTVersion10', () => {
	let dispenser: IsoilVegaTVersion10;
	let serialPort: SerialPort;

	beforeEach(async () => {
		if (!serialPort) {
			serialPort = new SerialPort({ path: await findDispenserPort(hardwareId, attributeId), baudRate: 9600 });
			dispenser = new IsoilVegaTVersion10(serialPort);
		}
	});

	it('should return IsoilVegaTVersion10 on checkType', () => {
		const kind = dispenser.checkType();
		expect(kind).toBe('ISOILVEGATV10');
	});

	it('should return greater than 0 on checkTotalizer', async () => {
		const totalizer = await dispenser.execute(dispenser.totalizer, dispenser.processTotalizer);
		expect(totalizer).toBeGreaterThan(0);
	});

	it('should return status on readStatus', async () => {
		const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
		console.log(status);
		expect(status.requestOfStartDelivery).toBe('Not present');
	});

	// it('should return true on pumpStop', async () => {
	//     const status = await dispenser.execute(dispenser.pumpStop, dispenser.processCommand);
	//     expect(status).toBe(true);
	// });

	// // // it('should return true on clearSale', async () => {
	// // //     const status = await dispenser.execute(dispenser.clearSale, dispenser.processCommand);
	// // //     expect(status).toBe(true);
	// // // });

	// // // // it('should return status on readStatus', async () => {
	// // // //     const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
	// // // //     console.log(status);
	// // // //     expect(status.state).toBe('Stopped');
	// // // // });

	it('should return true on pumpStart', async () => {
		const status = await dispenser.execute(dispenser.pumpStart, dispenser.processCommand);
		expect(status).toBe(true);
	});

	it('should return true on sendPreset', async () => {
		const status = await dispenser.execute(dispenser.setPreset, dispenser.processCommand, 69);
		expect(status).toBe(true);
	});

	it('should return true on readPreset', async () => {
		const status = await dispenser.execute(dispenser.readPreset, dispenser.processReadPreset);
		console.log(status);
		expect(status).toBe(69);
	});

	it('should return true on cancelPreset', async () => {
		const status = await dispenser.execute(dispenser.cancelPreset, dispenser.processCommand);
		expect(status).toBe(true);
	});

	it('should return true on Authorize', async () => {
		const status = await dispenser.execute(dispenser.authorizeSale, dispenser.processCommand);
		await delay(4000);
		expect(status).toBe(true);
	});

	it('should return true on suspendSale', async () => {
		await delay(4000);
		const status = await dispenser.execute(dispenser.suspendSale, dispenser.processCommand);
		expect(status).toBe(true);
	});

	it('should return true on pumpStop', async () => {
		const status = await dispenser.execute(dispenser.pumpStop, dispenser.processCommand);
		await delay(4000);
		expect(status).toBe(true);
	});

	it('should return true on clearSale', async () => {
		await delay(4000);
		const status = await dispenser.execute(dispenser.clearSale, dispenser.processCommand);
		expect(status).toBe(true);
	});

	// it('should return status on readStatus after pumpStart', async () => {
	//     const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
	//     console.log(status);
	//     expect(status.state).toBe('Idle');
	// });

	// it('should return true on sendPreset', async () => {
	//     const status = await dispenser.execute(dispenser.setPreset, dispenser.processCommand, 69);
	//     expect(status).toBe(true);
	// });

	// it('should return true on readPreset', async () => {
	//     const status = await dispenser.execute(dispenser.readPreset, dispenser.processReadPreset);
	//     console.log(status);
	//     expect(status).toBe(69);
	// });

	// it('should return true on cancelPreset', async () => {
	//     const status = await dispenser.execute(dispenser.cancelPreset, dispenser.processCommand);
	//     expect(status).toBe(true);
	// });

	// it('should return status on readStatus', async () => {
	//     const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
	//     console.log(status);
	//     expect(status.state).toBe('Idle');
	// });

	// it('should return true on sendPreset', async () => {
	//     const status = await dispenser.execute(dispenser.setPreset, dispenser.processCommand, 69);
	//     expect(status).toBe(true);
	// });

	// it('should return true on readPreset', async () => {
	//     const status = await dispenser.execute(dispenser.readPreset, dispenser.processReadPreset);
	//     console.log(status);
	//     expect(status).toBe(69);
	// });

	// it('should return true on cancelPreset', async () => {
	//     const status = await dispenser.execute(dispenser.cancelPreset, dispenser.processCommand);
	//     expect(status).toBe(true);
	// });
});

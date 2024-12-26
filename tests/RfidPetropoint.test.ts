import { SerialPort } from 'serialport';
import { RfidPetropoint } from '../rfid/RfidPetropoint';
import { findRfidPort, attributeId, hardwareId } from '../utils/findRfidPort';
import { delay } from '../utils/delay';

describe('RfidPetropoint', () => {
	let rfid: RfidPetropoint;
	let serialPort: SerialPort;

	beforeEach(async () => {
		if (!serialPort) {
			serialPort = new SerialPort({ path: await findRfidPort(hardwareId, attributeId), baudRate: 19200 });
			rfid = new RfidPetropoint(serialPort);
		}
	});

	it('should return RfidPetropoint on checkType', (done) => {
		const kind = rfid.checkType();
		expect(kind).toBe('RFIDPETROPOINT');
		done();
	});

	it('should call when rfid tag is in range', async () => {
		const mockCallback = jest.fn();
		rfid.bind(mockCallback);
		await delay(4500);
		expect(mockCallback).toHaveBeenCalled();
	});
});

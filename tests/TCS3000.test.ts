import { SerialPort } from "serialport";
import { TCS3000 } from "../dispenser/TCS3000";
import { findDispenserPort } from "../utils/findDispenserPort";

const hardwareId = '10c4';
const attributeId = 'ea60';

const printerHardwareId = '067b';
const printerAttributeId = '2303';

describe('TCS3000', () => {
    let dispenser: TCS3000;
    let serialPort: SerialPort;
    let printerPort: SerialPort;

    beforeEach(async () => {
        if (!serialPort) {
            serialPort = new SerialPort({
                path: await findDispenserPort(hardwareId, attributeId),
                baudRate: 9600,
            });
            printerPort = new SerialPort({ path: await findDispenserPort(printerHardwareId, printerAttributeId), baudRate: 9600 });
            dispenser = new TCS3000(serialPort, printerPort, {
				dispenserType: 'TCS3000',
				hardwareId,
				attributeId,
				baudRate: 9600,
				kFactor: 3692953.6,
				tcsProductId: 1015,
			});
        }
    });

    it("Should return TCS3000 on checkType", () => {
        const kind = dispenser.checkType();
        expect(kind).toBe('TCS3000');
    });

    it("Should return valid totalizer reading on checkTotalizer", async () => {
        const totalizer = await dispenser.execute(dispenser.totalzer, dispenser.processTotalizer);
        expect(totalizer).toBeGreaterThan(0);
    })

    it("Should set preset with custom productId", async () => {
        const result = await dispenser.execute(dispenser.setPreset, dispenser.processCommand, [10, 1020]);
        expect(result).toBeDefined();
    })

    it("Should set preset with default productId from options", async () => {
        const result = await dispenser.execute(dispenser.setPreset, dispenser.processCommand, [10]);
        expect(result).toBeDefined();
    })
})
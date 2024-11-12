import { SerialPort } from "serialport";
import { TCS3000 } from "../dispenser/TCS3000";
import { findDispenserPort } from "../utils/findDispenserPort";

const hardwareId = '10c4';
const attributeId = 'ea60';

describe('TCS3000', () => {
    let dispenser: TCS3000;
    let serialPort: SerialPort;

    beforeEach(async () => {
        if (!serialPort) {
            serialPort = new SerialPort({
                path: await findDispenserPort(hardwareId, attributeId),
                baudRate: 9600,
            });
            dispenser = new TCS3000(serialPort);
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
})
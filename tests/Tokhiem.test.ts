import { SerialPort } from "serialport";
import { Tokhiem } from "../main";
import { findDispenserPort, attributeId, hardwareId } from '../utils/findDispenserPort';

describe('Tokhiem', () => {
    let dispenser: Tokhiem;
    let serialPort: SerialPort;

    beforeEach(async () => {
        if(!serialPort) {
            serialPort = new SerialPort({path: await findDispenserPort(hardwareId, attributeId), baudRate: 9600 });
            dispenser = new Tokhiem(serialPort);
        }
    });

    it('should return TOKHIEM on checkType', () => {
        const kind = dispenser.checkType();
        expect(kind).toBe('TOKHIEM');
    });

    it('should return greater than 0 on checkTotalizer', async () => {
        const totalizer = await dispenser.execute(dispenser.totalizer, dispenser.processTotalizer);
        expect(totalizer).toBeGreaterThan(0);
    });

    it('should return status on readStatus', async () => {
        const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
        console.log(status);
        expect(status.state).toBe('Idle');
    });
    
    it('should return true on pumpStop', async () => {
        const status = await dispenser.execute(dispenser.pumpStop, dispenser.processCommand);
        expect(status).toBe(true);
    });

    // it('should return true on clearSale', async () => {
    //     const status = await dispenser.execute(dispenser.clearSale, dispenser.processCommand);
    //     expect(status).toBe(true);
    // });

    // it('should return status on readStatus', async () => {
    //     const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
    //     console.log(status);
    //     expect(status.state).toBe('Stopped');
    // });

    it('should return true on pumpStart', async () => {
        const status = await dispenser.execute(dispenser.pumpStart, dispenser.processCommand);
        expect(status).toBe(true);
    });

    it('should return status on readStatus after pumpStart', async () => {
        const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
        console.log(status);
        expect(status.state).toBe('Idle');
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

    it('should return status on readStatus', async () => {
        const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
        console.log(status);
        expect(status.state).toBe('Idle');
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

});
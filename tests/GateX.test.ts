import { GateX } from "../dispenser/GateX";
import { findDispenserPort } from '../utils/findDispenserPort';
import { delay } from "../utils/delay";
import ModbusRTU from "modbus-serial";

const hardwareId = '0403';
const attributeId = '6001';

describe('GateX', () => {
    let dispenser: GateX;
    let serialPort: ModbusRTU;

    beforeEach(async () => {
        if(!serialPort) {
            serialPort = new ModbusRTU();
            const path = await findDispenserPort(hardwareId, attributeId);
            await serialPort.connectRTUBuffered(path, { baudRate: 9600 });
            dispenser = new GateX(serialPort, { dispenserType: 'GateX', hardwareId, attributeId, baudRate: 9600, kFactor: 53.92859163 });
        }
    });

    it('should return GateX on checkType', () => {
        const kind = dispenser.checkType();
        expect(kind).toBe('GATEX');
    });

    it('should return greater than 0 on checkTotalizer', async () => {
        const totalizer = await dispenser.execute(dispenser.totalizer, dispenser.processTotalizer);
        expect(totalizer).toBeGreaterThan(0);
    });

    // it('should return status on readStatus', async () => {
    //     const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
    //     console.log(status);
    //     expect(status.requestOfStartDelivery).toBe('Not present');
    // });
    
    // // it('should return true on pumpStop', async () => {
    // //     const status = await dispenser.execute(dispenser.pumpStop, dispenser.processCommand);
    // //     expect(status).toBe(true);
    // // });

    // // // // it('should return true on clearSale', async () => {
    // // // //     const status = await dispenser.execute(dispenser.clearSale, dispenser.processCommand);
    // // // //     expect(status).toBe(true);
    // // // // });

    // // // // // it('should return status on readStatus', async () => {
    // // // // //     const status = await dispenser.execute(dispenser.readStatus, dispenser.processStatus);
    // // // // //     console.log(status);
    // // // // //     expect(status.state).toBe('Stopped');
    // // // // // });

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

    // it('should return true on suspendSale', async () => {
    //     await delay(4000);
    //     const status = await dispenser.execute(dispenser.suspendSale, dispenser.processCommand);
    //     expect(status).toBe(true);
    // });

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
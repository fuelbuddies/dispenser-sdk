import {SerialPort} from 'serialport';
import debug from 'debug';

const debugLog = debug('dispenser:find-rfid-port');
// Define the hardware ID and attribute ID you want to search for
export const hardwareId = '0403';
export const attributeId = '6001';

// Function to find port based on hardware ID and attribute ID
export async function findRfidPort(hardwareId: string, attributeId: string) {
    try {
        debugLog(`Finding RFID port with hardware ID: ${hardwareId}, and attribute ID: ${attributeId}: %o`, arguments);
        const foundPort = (await SerialPort.list()).find(port => {
            return port.vendorId === hardwareId && port.productId === attributeId;
        });

        if (foundPort) {
            return foundPort.path;
        } else {
            throw new Error('RFID Port not found');
        }
    } catch (error) {
        throw error;
    }
}
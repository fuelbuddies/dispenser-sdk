import {SerialPort} from 'serialport';

// Define the hardware ID and attribute ID you want to search for
export const hardwareId = '0403';
export const attributeId = '6001';

// Function to find port based on hardware ID and attribute ID
export async function findRfidPort(hardwareId: string, attributeId: string) {
    try {
        const foundPort = (await SerialPort.list()).find(port => {
            return port.vendorId === hardwareId && port.productId === attributeId;
        });

        if (foundPort) {
            return foundPort.path;
        } else {
            throw new Error('Port not found');
        }
    } catch (error) {
        throw error;
    }
}
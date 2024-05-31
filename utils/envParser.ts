import { DispenserOptions, RfidOptions } from "../main";

export function getConfigFromEnv() {
    const dispenserConfig: DispenserOptions = {
        dispenserType: process.env.VITE_MAIN_DISPENSER_TYPE || '',
        hardwareId: process.env.VITE_MAIN_DISPENSER_HARDWARE_ID || '',
        attributeId: process.env.VITE_MAIN_DISPENSER_ATTRIBUTE_ID || '',
        baudRate: parseInt(process.env.VITE_MAIN_DISPENSER_BAUD_RATE || '0'), // Parse as integer
        totalizerFile: process.env.VITE_MAIN_DISPENSER_TOTALIZER_FILE || 'totalizer.json',
    };

    // Optionally, you can add more properties to the object if they exist in the environment variables
    if (process.env.VITE_MAIN_DISPENSER_K_FACTOR) {
        dispenserConfig.kFactor = Number(process.env.VITE_MAIN_DISPENSER_K_FACTOR);
    }

    if(process.env.VITE_MAIN_PRINTER_TYPE) {
        dispenserConfig.printer = {
            printerType: process.env.VITE_MAIN_PRINTER_TYPE,
            hardwareId: process.env.VITE_MAIN_PRINTER_HARDWARE_ID || '',
            attributeId: process.env.VITE_MAIN_PRINTER_ATTRIBUTE_ID || '',
            baudRate: parseInt(process.env.VITE_MAIN_PRINTER_BAUD_RATE || '9600')
        };
    }


    if(process.env.VITE_MAIN_MODBUS_TYPE) {
        dispenserConfig.modbus = {
            timeout: parseInt(process.env.VITE_MAIN_MODBUS_TIMEOUT || '1000'),
            deviceId: parseInt(process.env.VITE_MAIN_MODBUS_DEVICE_ID || '1'),
            overflowRegister: parseInt(process.env.VITE_MAIN_MODBUS_OVERFLOW_REGISTER || '8'),
            pulseRegister: parseInt(process.env.VITE_MAIN_MODBUS_PULSE_REGISTER || '10'),
            debug: process.env.VITE_MAIN_MODBUS_DEBUG === 'true'
        };
    }

    return dispenserConfig;
}

export function getRFIDConfigFromEnv(): RfidOptions {
    return {
        rfidType: process.env.VITE_MAIN_RFID_TYPE || "",
        attributeId: process.env.VITE_MAIN_RFID_ATTRIBUTE_ID || "",
        hardwareId: process.env.VITE_MAIN_RFID_HARDWARE_ID || "",
        baudRate: parseInt(process.env.VITE_MAIN_RFID_BAUD_RATE || "9600"),
    } as RfidOptions;
}
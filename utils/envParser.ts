import { DispenserOptions } from "../main";

export function getConfigFromEnv() {
    const dispenserConfig: DispenserOptions = {
        dispenserType: process.env.VITE_MAIN_DISPENSER_TYPE || '',
        hardwareId: process.env.VITE_MAIN_DISPENSER_HARDWARE_ID || '',
        attributeId: process.env.VITE_MAIN_DISPENSER_ATTRIBUTE_ID || '',
        baudRate: parseInt(process.env.VITE_MAIN_DISPENSER_BAUD_RATE || '0'), // Parse as integer
    };
    
    // Optionally, you can add more properties to the object if they exist in the environment variables
    if (process.env.VITE_MAIN_DISPENSER_K_FACTOR) {
        dispenserConfig.kFactor = parseInt(process.env.VITE_MAIN_DISPENSER_K_FACTOR);
    }
    return dispenserConfig;
}
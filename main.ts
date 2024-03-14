import { SerialPort } from "serialport";
import { Tokhiem } from "./dispenser/Tokhiem";

const serialPort = new SerialPort({path: '/dev/ttyUSB0', baudRate: 9600 });
const dispenser = new Tokhiem(serialPort);
async function main() {
    const kind = await dispenser.execute(dispenser.checkType);
    console.log(kind);
}

main();
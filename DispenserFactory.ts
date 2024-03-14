import { IDispenser } from "./IDispenser";
import { IsoilVegaTVersion10 } from "./dispenser/IsoilVegaTVersion10";
import { TCS3000 } from "./dispenser/TCS3000";
import { Tokhiem } from "./dispenser/Tokhiem";
import { VeederEmr4 } from "./dispenser/VeederEmr4";
import { SerialPort } from 'serialport';

export class DispenserFactory {
    static initialize(kind: string, socket: SerialPort): IDispenser {
      switch(kind) {
        case 'TOKHIEM':
          return new Tokhiem(socket);
        case 'ISOILVEGATV10':
        case 'PETROPOINTHECTRONICS':
          return new IsoilVegaTVersion10(socket);
        case 'VeederEmr4':
          return new VeederEmr4(socket);
        case 'TCS3000':
          return new TCS3000(socket);
        default:
          throw new Error('Dispenser not supported!');
      }
    }
  }
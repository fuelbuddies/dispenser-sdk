import { BaseRfid } from "./rfid/BaseRfid";
import { RfidPetropoint } from "./rfid/RfidPetropoint";
import { IRfid } from "./IRfid";

export class RfidFactory {
    static async initialize(socket: WebSocket): Promise<IRfid> {
      const rfid = new BaseRfid(socket);
      const kind = await rfid.execute(rfid.checkType);
      return RfidFactory.createObject(kind, socket);
    }
  
    static createObject(kind: string, socket: WebSocket): IRfid {
      switch(kind) {
        case 'PETROPOINTHECTRONICS':
          return new RfidPetropoint(socket);
        default:
          throw new Error('RFID not supported!');
      }
    }
  }
//npm run esbuild-browser:watch

import { debugLog } from "../utils/debugLog";
import { BaseRfid } from "./BaseRfid";
import { RfidResponse } from "./interface/IRfid";

export class RfidPetropoint extends BaseRfid {

    checkType() {
        debugLog('rfidType', 'RFID')
        return 'PETROPOINTHECTRONICS';
    }

    /** callback when there is data and process that data through processRFIDResonse before calling back */
    bind(callback: (status: unknown, data: RfidResponse | "idle") => void): void {
        this.listen((data: any) => {
            try {
                callback(null, this.processRFIDresponse(data.toString('hex')));
            } catch (e) {
                callback(e, "idle");
            }
        });
    }

    processRawRfidStatus(res: string) {
        debugLog('processRawRfidStatus', res);
        const response = this.hex2a(res).split(",");
        debugLog('processRawRfidStatus', JSON.stringify(response));
        return response;
    }

    processTagstatus(res: string) {
        debugLog('processTagstatus', res);

        if (res.endsWith("002")) {
            debugLog('processTagstatus', "TagInRange");
            return "TagInRange";
        }
        if (res.endsWith("005")) {
            debugLog('processTagstatus', "TagNotInRange");
            return "TagNotInRange";
        }

        debugLog('processTagstatus', "Idle");
        return "Idle";
    }

    processTagId(res: string) {
        debugLog('processTagId', res);
        if (res.length > 10) {
            const tagId = BigInt(res);
            debugLog('processTagId', JSON.stringify(tagId, function (key, value) {
                if (typeof value === 'bigint') {
                  return value.toString();
                } else {
                  return value;
                }
            }));
            return tagId;
        }

        debugLog('processTagId', "Invalid TagId");
        return -1;
    }

    processRFIDresponse(res: string): RfidResponse | "idle" {
        debugLog('processRFIDresponse', res);
        const regex = /^02.*?0a/;
        const match = res.match(regex);
        if (match) {
            const rfidresponse = this.processRawRfidStatus(match[0]);
            debugLog('processRFIDresponse', JSON.stringify(rfidresponse));

            const response = {
                tagStatus: ((this.processTagstatus(rfidresponse[0]))),
                nozzleId: parseFloat(rfidresponse[1]),
                tagId: (this.processTagId(rfidresponse[2]))
            }
    
            debugLog('processRFIDresponse', JSON.stringify(response, function (key, value) {
                if (typeof value === 'bigint') {
                  return value.toString();
                } else {
                  return value;
                }
            }));
            return response;
        }

        debugLog('processRFIDresponse', "idle");
        return "idle";
    }
}
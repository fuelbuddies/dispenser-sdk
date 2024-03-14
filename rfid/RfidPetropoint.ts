//npm run esbuild-browser:watch

import { BaseRfid } from "./BaseRfid";

export class RfidPetropoint extends BaseRfid {

    rfidType() {
        this.debugLog('rfidType', 'RFID')
        this.connection.send('RFID');
    }

    rfidStatus() {
        this.debugLog('rfidStatus', 'Status_RFID')
        this.connection.send('Status_RFID');
    }

    processRawRfidStatus(res: string) {
        this.debugLog('processRawRfidStatus', res);
        const response = this.hex2a(res).split(",");
        this.debugLog('processRawRfidStatus', JSON.stringify(response));
        return response;
    }

    processTagstatus(res: string) {
        this.debugLog('processTagstatus', res);

        if (res.endsWith("002")) {
            this.debugLog('processTagstatus', "TagInRange");
            return "TagInRange";
        }
        if (res.endsWith("005")) {
            this.debugLog('processTagstatus', "TagNotInRange");
            return "TagNotInRange";
        }

        this.debugLog('processTagstatus', "Idle");
        return "Idle";
    }

    processTagId(res: string) {
        this.debugLog('processTagId', res);
        if (res.length > 10) {
            const tagId = BigInt(res);
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
            this.debugLog('processTagId', JSON.stringify(tagId, function (key, value) {
                if (typeof value === 'bigint') {
                  return value.toString();
                } else {
                  return value;
                }
            }));
            return tagId;
        }

        this.debugLog('processTagId', "Invalid TagId");
        return -1;
    }

    processRFIDresponse(res: string) {
        this.debugLog('processRFIDresponse', res);
        const regex = /^02.*?0a/;
        const match = res.match(regex);
        if (match) {
            const rfidresponse = this.processRawRfidStatus(match[0]);
            this.debugLog('processRFIDresponse', JSON.stringify(rfidresponse));

            const response = {
                tagStatus: ((this.processTagstatus(rfidresponse[0]))),
                nozzleId: parseFloat(rfidresponse[1]),
                tagId: (this.processTagId(rfidresponse[2]))
            }
    
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
            this.debugLog('processRFIDresponse', JSON.stringify(response, function (key, value) {
                if (typeof value === 'bigint') {
                  return value.toString();
                } else {
                  return value;
                }
            }));
            return response;
        }

        this.debugLog('processRFIDresponse', "idle");
        return "idle";
    }

    isOnline(res: string): boolean {
        this.debugLog('isOnline', res); 
        const rfidresponse = this.processRawRfidStatus(res);
        this.debugLog('isOnline', JSON.stringify(rfidresponse));
        if(rfidresponse.length > 0) {
            this.debugLog('isOnline', "true");
            return true;
        }
        this.debugLog('isOnline', "false");
        return false;
    }
}
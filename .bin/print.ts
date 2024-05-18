#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import { debugLog } from '../utils/debugLog';
import {getConfigFromEnv} from '../utils/envParser';

const configuration = getConfigFromEnv();
debugLog('Configuration: ', configuration);

createDispenser(configuration).then((dispenser) => {
    // console.log(dispenser);
    const printObj = {
        "customerCode": null,
        "driverCode": 7777,
        "endBatchCode": null,
        "endTime": "2024-05-04T08:16:00.194462",
        "endTotalizer": "246",
        "orderCode": 113175,
        "productName": "Diesel",
        "orderDate": "2024-04-26T01:00:00",
        "quantity": 123,
        "startBatchCode": null,
        "startTime": "2024-05-04T08:15:53.215324",
        "registrationNumber": "TUAbu Dhabi98676",
        "vehicleRegistrationNumber": "9818",
        "startTotalizer": "123",
        "odometerReading": "123456789123",
        "unitOfMeasure": "litre",
        "isReceiptRequired": true
    };

    dispenser.execute(dispenser.printReceipt, dispenser.processCommand, printObj).then((totalizer) => {
        dispenser.disconnect(() => {
            console.log("Disconnected");
        });
        console.log(totalizer);
    });
});
#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import { debugLog } from '../utils/debugLog';
import {getConfigFromEnv} from '../utils/envParser';

const configuration = getConfigFromEnv();
debugLog('Configuration: ', configuration);

createDispenser(configuration).then((dispenser) => {
    // console.log(dispenser);
    dispenser.execute(dispenser.pumpStop, dispenser.processCommand).then((totalizer) => {
        dispenser.disconnect(() => {
            console.log("Disconnected");
        });
        console.log(totalizer);
    });
});
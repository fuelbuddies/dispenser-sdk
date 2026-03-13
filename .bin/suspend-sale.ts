#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import { getConfigFromEnv } from '../utils/envParser';

const debugLog = debug('dispenser:main');
const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);

createDispenser(configuration).then((dispenser) => {
    // console.log(dispenser);
    dispenser.execute(dispenser.suspendSale, dispenser.processCommand).then((res) => {
        console.log("THE ANSWER FOR THIS SUSPEND SALE IS ", res);
        dispenser.disconnect(() => {
            console.log('Disconnected');
        });
        
    });
});
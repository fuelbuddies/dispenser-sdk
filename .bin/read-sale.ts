#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import {getConfigFromEnv} from '../utils/envParser';

const debugLog = debug('dispenser:main');
const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);
createDispenser(configuration).then((dispenser) => {
    dispenser.execute(dispenser.readSale, dispenser.isOrderComplete).then((response) => {
        dispenser.disconnect(() => {
            console.log("Disconnected");
        });
        console.log(response);
    });
});
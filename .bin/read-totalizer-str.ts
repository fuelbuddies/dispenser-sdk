#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import {getConfigFromEnv} from '../utils/envParser';

const debugLog = debug('dispenser:main');
const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);
createDispenser(configuration).then((dispenser) => {
    // console.log(dispenser);
    dispenser.executeWork('totalizer', 'processTotalizer').then((totalizer) => {
        dispenser.disconnect(() => {
            console.log("Disconnected");
        });
        console.log(totalizer);
    });
});
#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import {getConfigFromEnv} from '../utils/envParser';

console.log(getConfigFromEnv());

createDispenser(getConfigFromEnv()).then((dispenser) => {
    // console.log(dispenser);
    dispenser.execute(dispenser.totalizer, dispenser.processTotalizer).then((totalizer) => {
        console.log(totalizer);
        process.exit(0);
    });
});
#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import {getConfigFromEnv} from '../utils/envParser';

console.log(getConfigFromEnv());

createDispenser(getConfigFromEnv()).then((dispenser) => {
    // console.log(dispenser);
    dispenser.execute(dispenser.authorizeSale, dispenser.processCommand).then((totalizer) => {
        dispenser.disconnect(() => {
            console.log("Disconnected");
        });
        console.log(totalizer);
    });
});
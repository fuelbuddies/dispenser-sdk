#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import {getConfigFromEnv} from '../utils/envParser';
import { findDispenserPort } from '../utils/findDispenserPort';

const configuration = getConfigFromEnv();
console.log(configuration);
const dispenserPath = await findDispenserPort(configuration.hardwareId, configuration.attributeId);
console.log("Dispenser found at: ", dispenserPath);
createDispenser(getConfigFromEnv()).then((dispenser) => {
    // console.log(dispenser);
    dispenser.execute(dispenser.totalizer, dispenser.processTotalizer).then((totalizer) => {
        dispenser.disconnect(() => {
            console.log("Disconnected");
        });
        console.log(totalizer);
    });
});
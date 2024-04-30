#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import {getConfigFromEnv} from '../utils/envParser';

async function main() {
    const dispenser = await createDispenser(getConfigFromEnv());
    const totalizer = await dispenser.execute(dispenser.totalizer, dispenser.processTotalizer)
    console.log(totalizer);
}

main();
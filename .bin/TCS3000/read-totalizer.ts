import debug from 'debug';
import { createDispenser, getConfigFromEnv } from '../../main';

const debugLog = debug('dispenser:main');
const configuration = getConfigFromEnv();

debugLog('Configuration: %o', configuration);
createDispenser(configuration).then((dispenser) => {
    dispenser.executeWork('totalizer', 'processTotalizer').then(totalizer => {
        dispenser.disconnect(() => {
            debugLog("Disconnected");
        });
        debugLog(totalizer);
    })
})
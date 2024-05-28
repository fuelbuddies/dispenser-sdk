import { IDistributedLockProvider } from "workflow-es";
import { debugLog } from "../../../utils/debugLog";

const wfc_locks: Set<string> = new Set();

// Single node in-memory implementation of IDistributedLockProvider (not really distributed)
export class SingleNodeLockProvider implements IDistributedLockProvider {

    public async aquireLock(id: string): Promise<boolean> {
        // debugLog('LockProvider', `Aquiring lock for ${id}`);
        if (wfc_locks.has(id)) {
            // debugLog('LockProvider', `Lock for ${id} already exists`);
            return false;
        }
        wfc_locks.add(id);
        // debugLog('LockProvider', `Lock for ${id} aquired`);
        return true;
    }

    public async releaseLock(id: string): Promise<void> {
        // debugLog('LockProvider', `Releasing lock for ${id}`);
        wfc_locks.delete(id);
    }
}
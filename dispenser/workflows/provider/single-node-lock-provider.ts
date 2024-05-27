import { IDistributedLockProvider } from "workflow-es";

const wfc_locks: Set<string> = new Set();

// Single node in-memory implementation of IDistributedLockProvider (not really distributed)
export class SingleNodeLockProvider implements IDistributedLockProvider {
    
    public async aquireLock(id: string): Promise<boolean> {
        if (wfc_locks.has(id)) {
            return false;
        }
        wfc_locks.add(id);
        return true;       
    }

    public async releaseLock(id: string): Promise<void> {        
        wfc_locks.delete(id);
    }
}
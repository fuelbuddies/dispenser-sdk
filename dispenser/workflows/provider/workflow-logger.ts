import { ILogger } from "workflow-es";
import debug from 'debug';

const debugLog = debug('dispenser:workflow-logger');

export class WorkflowLogger implements ILogger {
    public error(message?: any, ...optionalParams: any[]): void {
        debugLog(`${message}: %o`, ...optionalParams);
    }
    
    public info(message?: any, ...optionalParams: any[]): void {
        debugLog(`${message}: %o`, ...optionalParams);
    }
    
    public log(message?: any, ...optionalParams: any[]): void {
        debugLog(`${message}: %o`, ...optionalParams);
    }
}
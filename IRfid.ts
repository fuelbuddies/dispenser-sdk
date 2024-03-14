
export interface IRfid {
    connection: WebSocket;
    bind(fn: EventListenerOrEventListenerObject): any;
    unbind(fn: EventListenerOrEventListenerObject): any;
    execute(callee: any, bindFunction?: any, calleeArgs?: any): Promise<any>;
    checkType(): any;
    rfidType?(res: string): any;
    rfidStatus?(res: string): any;
    processRFIDresponse?(res: string): any;
    processCommand?(res: string): any;
    isOnline?(res: string): boolean;
    cutStringFromLast?(str: string, cutLength: number, cutFromLast: boolean): any;
    hex2a?(hex: string): string;
    hex2bin?(data: string): string;
    exportLogs(): Promise<any>;
    downloadLogs(): void;
  }
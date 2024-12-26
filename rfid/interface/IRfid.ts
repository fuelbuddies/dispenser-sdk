import { SerialPort } from 'serialport';

export interface IRfid {
	connection: SerialPort;
	disconnect(callback: any): void;
	execute?(callee: any, bindFunction?: any, calleeArgs?: any): Promise<any>;
	checkType?(): any;
	bind?(callback: (status: unknown, data: RfidResponse | 'idle') => void): void;
	rfidType?(res: string): any;
	rfidStatus?(res: string): any;
	processRFIDresponse?(res: string): any;
	processCommand?(res: string): any;
	isOnline?(res: string): boolean;
	cutStringFromLast?(str: string, cutLength: number, cutFromLast: boolean): any;
	hex2a?(hex: string): string;
	hex2bin?(data: string): string;
}

export interface RfidResponse {
	tagStatus: string;
	nozzleId: number;
	tagId: number | bigint;
}

export type RfidOptions = {
	rfidType: string;
	hardwareId: string;
	attributeId: string;
	baudRate?: number;
};

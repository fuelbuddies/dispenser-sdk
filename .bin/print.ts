#!/usr/bin/env ts-node

import { createDispenser } from '../main';
import debug from 'debug';
import { getConfigFromEnv } from '../utils/envParser';

const debugLog = debug('dispenser:main');
const configuration = getConfigFromEnv();
debugLog('Configuration: %O', configuration);

createDispenser(configuration).then((dispenser) => {
	// console.log(dispenser);
	const printObj = {
		customerCode: 212,
		driverCode: 9,
		endBatchCode: null,
		endTime: '2025-04-08T13:49:48.870182Z',
		endTotalizer: '987395.13',
		orderCode: 178703,
		productName: 'Diesel',
		orderDate: '2025-04-08T13:49:49.674Z',
		quantity: 9.68,
		startBatchCode: '3478124501720',
		startTime: '2025-04-08T13:49:32.370707Z',
		registrationNumber: '0189247',
		vehicleRegistrationNumber: 'DXB AA 88342',
		startTotalizer: '987385.45',
		odometerReading: null,
		unitOfMeasure: 'litre',
		isReceiptRequired: true,
		invoiceDate: '2025-04-08T13:49:27.574184',
		customerName: 'Shreesh Katyayan dgsgfgdhf dfbhfh eryeryeqqtw b bc bdfgfdg',
		slipNumber: '1744120167768',
	};

	dispenser.execute(dispenser.printReceipt, dispenser.processCommand, printObj).then((totalizer) => {
		dispenser.disconnect(() => {
			console.log('Disconnected');
		});
		console.log(totalizer);
	});
});

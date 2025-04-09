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
		customerName: 'Shreesh Katyayan',
		slipNumber: '1744120167768',
	};


	// const printObj = {
	// 	customerCode: 212,
	// 	driverCode: 777,
	// 	endBatchCode: null,
	// 	endTime: '2025-03-21T11:22:56.566959Z',
	// 	endTotalizer: '503144.73',
	// 	orderCode: 173529,
	// 	productName: 'Diesel',
	// 	orderDate: '2025-03-21T11:22:57.137Z',
	// 	quantity: 22.18,
	// 	startBatchCode: null,
	// 	startTime: '2025-03-21T11:22:08.582716Z',
	// 	registrationNumber: '482393',
	// 	vehicleRegistrationNumber: 'ccDubai61465',
	// 	startTotalizer: '503122.55',
	// 	odometerReading: null,
	// 	unitOfMeasure: 'litre',
	// 	isReceiptRequired: true,
	// 	invoiceDate: '2025-03-21T11:13:32.018356',
	// 	slipNumber: '3xdfksjnvirbh',
	// 	customerName: 'Sdajifhwie ogmjeribbeoij oertjemboibejior mveorjt'
	// };

	dispenser.execute(dispenser.printReceipt, dispenser.processCommand, printObj).then((totalizer) => {
		dispenser.disconnect(() => {
			console.log('Disconnected');
		});
		console.log(totalizer);
	});
});

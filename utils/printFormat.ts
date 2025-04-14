import { BaseDispenser } from '../dispenser/base/BaseDispenser';
import { ModBusDispenser } from '../dispenser/base/ModBusDispenser';

const wrapText = (text: string, maxWidth: number): string[] => {
	const words = text.split(' ');
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxWidth) {
			currentLine += (currentLine ? ' ' : '') + word;
		} else {
			if (currentLine) lines.push(currentLine);
			currentLine = word;
		}
	}
	if (currentLine) lines.push(currentLine);
	return lines;
};

export const printFormat = (printObj: any, type: string = 'PRINT COPY', dispenser: ModBusDispenser | BaseDispenser) => {
	const printWidth = 40;
	const printArr = [];

	printArr.push(dispenser.str2hex(dispenser.centerAlignValue(`****  ${type}  ****`, printWidth)));
	printArr.push('0A');
	printArr.push(dispenser.str2hex(dispenser.centerAlignValue('FUELBUDDY FUEL SUPPLY LLC', printWidth)));
	printArr.push('0A');
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('BOWSER No', printObj?.vehicleRegistrationNumber, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('DRIVER No', printObj?.driverCode, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('Slip No', printObj?.slipNumber, printWidth)));
	printArr.push('0A');
	if (printObj?.customerName) {
		const wrappedName = wrapText(printObj.customerName, printWidth);
		wrappedName.forEach((line) => {
			printArr.push(dispenser.str2hex(dispenser.centerAlignValue(line, printWidth)));
		});
	}
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('ORDER No', printObj?.orderCode, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('ASSET No', printObj?.registrationNumber, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('PRODUCT', printObj?.productName, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('DATE', new Date(printObj?.orderDate).toLocaleDateString(), printWidth)));
	printArr.push(
		dispenser.str2hex(dispenser.rightAlignValue('START TIME', new Date(printObj?.startTime).toLocaleTimeString(), printWidth))
	);
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('END TIME', new Date(printObj?.endTime).toLocaleTimeString(), printWidth)));
	printArr.push('0A');
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('GROSS VOLUME', printObj?.unitOfMeasure, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('QUANTITY', printObj?.quantity, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('START TOT.', printObj?.startTotalizer, printWidth)));
	printArr.push(dispenser.str2hex(dispenser.rightAlignValue('END TOT.', printObj?.endTotalizer, printWidth)));
	if (printObj?.odometerReading) {
		printArr.push(dispenser.str2hex(dispenser.rightAlignValue('ODOMETER', printObj?.odometerReading, printWidth)));
	}
	printArr.push('OA0A0A1D564100');

	return printArr;
};

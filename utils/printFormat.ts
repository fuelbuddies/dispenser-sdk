import type { BaseDispenser } from '../dispenser/base/BaseDispenser';
import type { ModBusDispenser } from '../dispenser/base/ModBusDispenser';

/**
 * Convert String to HEX
 * @param num
 * @returns
 */
const str2hex = (num: string) => {
	let str = '';
	for (let i = 0; i < num.length; i++) {
		str += num.charCodeAt(i).toString(16);
	}
	return str;
};

/**
 * right align value in a string.
 * @param label
 * @param value
 * @param totalWidth
 * @returns
 */
const rightAlignValue = (label: string, valueStr: string, totalWidth: number) => {
	const value = valueStr ? valueStr + '' : 'N/A';
	const labelWidth = label.length;
	const valueWidth = value.length;
	const spacesToAdd = totalWidth - labelWidth - valueWidth;

	const alignedString = label + ' '.repeat(spacesToAdd) + value;
	return alignedString;
};

/**
 * Center Align Value in a string
 * @param value
 * @param totalWidth
 */
const centerAlignValue = (value: string, totalWidth: number) => {
	const valueWidth = value.length;
	const spacesToAdd = totalWidth - valueWidth;
	const leftSpaces = Math.floor(spacesToAdd / 2);
	const rightSpaces = spacesToAdd - leftSpaces;

	const alignedString = ' '.repeat(leftSpaces) + value + ' '.repeat(rightSpaces);
	return alignedString;
};

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

	printArr.push(str2hex(centerAlignValue(`****  ${type}  ****`, printWidth)));
	printArr.push('0A');
	printArr.push(str2hex(centerAlignValue('FUELBUDDY FUEL SUPPLY LLC', printWidth)));
	printArr.push('0A');
	printArr.push(str2hex(rightAlignValue('BOWSER No', printObj?.vehicleRegistrationNumber, printWidth)));
	printArr.push(str2hex(rightAlignValue('DRIVER No', printObj?.driverCode, printWidth)));
	printArr.push(str2hex(rightAlignValue('Slip No', printObj?.slipNumber, printWidth)));
	printArr.push('0A');
	if (printObj?.customerName) {
		const wrappedName = wrapText(printObj.customerName, printWidth);
		wrappedName.forEach((line) => {
			printArr.push(str2hex(centerAlignValue(line, printWidth)));
		});
	}
	printArr.push(str2hex(rightAlignValue('ORDER No', printObj?.orderCode, printWidth)));
	printArr.push(str2hex(rightAlignValue('ASSET No', printObj?.registrationNumber, printWidth)));
	printArr.push(str2hex(rightAlignValue('PRODUCT', printObj?.productName, printWidth)));
	printArr.push(str2hex(rightAlignValue('DATE', new Date(printObj?.orderDate).toLocaleDateString(), printWidth)));
	printArr.push(str2hex(rightAlignValue('START TIME', new Date(printObj?.startTime).toLocaleTimeString(), printWidth)));
	printArr.push(str2hex(rightAlignValue('END TIME', new Date(printObj?.endTime).toLocaleTimeString(), printWidth)));
	printArr.push('0A');
	printArr.push(str2hex(rightAlignValue('GROSS VOLUME', printObj?.unitOfMeasure, printWidth)));
	printArr.push(str2hex(rightAlignValue('QUANTITY', printObj?.quantity, printWidth)));
	printArr.push(str2hex(rightAlignValue('START TOT.', printObj?.startTotalizer, printWidth)));
	printArr.push(str2hex(rightAlignValue('END TOT.', printObj?.endTotalizer, printWidth)));
	if (printObj?.odometerReading) {
		printArr.push(str2hex(rightAlignValue('ODOMETER', printObj?.odometerReading, printWidth)));
	}
	printArr.push('OA0A0A1D564100');

	return printArr;
};

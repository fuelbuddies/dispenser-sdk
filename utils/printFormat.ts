/** Line feed. */
export const LF = '0A';
/** ESC/POS GS V A 0 — feed and partial cut, to tear the copies apart. */
export const PARTIAL_CUT = '0A1D564100';
/** ESC/POS GS V B 0 — feed and full cut, ends a slip. */
export const FULL_CUT = '0A1D564200';

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
	// Asset descriptions and organisation names can be wider than the slip. Keep a
	// single separating space and let the printer wrap, rather than throwing on a
	// negative repeat count — and never truncate, slips settle billing disputes.
	const spacesToAdd = Math.max(totalWidth - label.length - value.length, 1);

	return label + ' '.repeat(spacesToAdd) + value;
};

/**
 * Center Align Value in a string
 * @param value
 * @param totalWidth
 */
const centerAlignValue = (value: string, totalWidth: number) => {
	const spacesToAdd = Math.max(totalWidth - value.length, 0);
	const leftSpaces = Math.floor(spacesToAdd / 2);
	return ' '.repeat(leftSpaces) + value + ' '.repeat(spacesToAdd - leftSpaces);
};

const signatureBox = (label: string, printArr: string[], printWidth: number, signatureBoxLines: number) => {
	printArr.push(str2hex(label));
	printArr.push(str2hex('+' + '-'.repeat(printWidth - 2) + '+'));
	for (let i = 0; i < signatureBoxLines; i++) {
		printArr.push(str2hex('|' + ' '.repeat(printWidth - 2) + '|'));
	}
	printArr.push(str2hex('+' + '-'.repeat(printWidth - 2) + '+'));
};

const signatureBoxes = (printArr: string[], printWidth: number, signatureBoxLines: number) => {
	signatureBox('CUSTOMER SIGN:', printArr, printWidth, signatureBoxLines);
	signatureBox('DRIVER SIGN:', printArr, printWidth, signatureBoxLines);
};

/**
 * Break text into slip-width lines at the last space that fits. A word wider than
 * the slip (an unbroken organisation name) has no space to break on, so it is cut
 * mid-word — the aligners must never receive a line wider than the slip.
 */
const wrapText = (text: string, maxWidth: number): string[] => {
	// Not trimStart(): only spaces separate words on a slip, so a tab or newline is
	// content. Dropping them here also swallows the run of spaces a cut landed in.
	const remaining = text.replace(/^ +/, '');
	if (remaining.length <= maxWidth) return remaining ? [remaining] : [];

	const lastSpaceThatFits = remaining.lastIndexOf(' ', maxWidth);
	const cutAt = lastSpaceThatFits > 0 ? lastSpaceThatFits : maxWidth;

	return [remaining.slice(0, cutAt), ...wrapText(remaining.slice(cutAt), maxWidth)];
};

export const printFormat = (printObj: any, type: string, printWidth: number) => {
	const printArr = [];

	printArr.push(str2hex(centerAlignValue(`****  ${type}  ****`, printWidth)));
	printArr.push(LF);
	printArr.push(str2hex(centerAlignValue('FUELBUDDY FUEL SUPPLY LLC', printWidth)));
	printArr.push(LF);
	printArr.push(str2hex(rightAlignValue('BOWSER No', printObj?.vehicleRegistrationNumber, printWidth)));
	printArr.push(str2hex(rightAlignValue('DRIVER No', printObj?.driverCode, printWidth)));
	printArr.push(str2hex(rightAlignValue('Slip No', printObj?.slipNumber, printWidth)));
	printArr.push(LF);
	if (printObj?.customerName) {
		wrapText(printObj.customerName, printWidth).forEach((line) => {
			printArr.push(str2hex(centerAlignValue(line, printWidth)));
		});
	}
	printArr.push(LF);
	printArr.push(str2hex(rightAlignValue('ORDER No', printObj?.orderCode, printWidth)));
	printArr.push(str2hex(rightAlignValue('ASSET No', printObj?.registrationNumber, printWidth)));
	printArr.push(str2hex(rightAlignValue('PRODUCT', printObj?.productName, printWidth)));
	printArr.push(str2hex(rightAlignValue('DATE', new Date(printObj?.orderDate).toLocaleDateString(), printWidth)));
	printArr.push(str2hex(rightAlignValue('START TIME', new Date(printObj?.startTime).toLocaleTimeString(), printWidth)));
	printArr.push(str2hex(rightAlignValue('END TIME', new Date(printObj?.endTime).toLocaleTimeString(), printWidth)));
	printArr.push(LF);
	printArr.push(str2hex(rightAlignValue('GROSS VOLUME', printObj?.unitOfMeasure, printWidth)));
	printArr.push(str2hex(rightAlignValue('QUANTITY', printObj?.quantity, printWidth)));
	printArr.push(str2hex(rightAlignValue('START TOT.', printObj?.startTotalizer, printWidth)));
	printArr.push(str2hex(rightAlignValue('END TOT.', printObj?.endTotalizer, printWidth)));
	if (printObj?.odometerReading) {
		printArr.push(str2hex(rightAlignValue('ODOMETER', printObj?.odometerReading, printWidth)));
	}

	return printArr;
};

export const orderSummaryFormat = (printObj: any, printWidth: number, signatureBoxLines: number) => {
	const printArr = [];

	// Header
	printArr.push(str2hex(centerAlignValue('****  ORDER SUMMARY  ****', printWidth)));
	printArr.push(str2hex(centerAlignValue('FUELBUDDY FUEL SUPPLY LLC', printWidth)));

	// Truck, driver, date
	printArr.push(str2hex(rightAlignValue('ORDER No', printObj?.orderCode, printWidth)));
	printArr.push(str2hex(rightAlignValue('TRUCK No', printObj?.bowserNumber, printWidth)));
	printArr.push(str2hex(rightAlignValue('DRIVER', printObj?.driverName, printWidth)));
	printArr.push(str2hex(rightAlignValue('DATE', printObj?.orderDate ? new Date(printObj.orderDate).toLocaleDateString() : 'N/A', printWidth)));
	printArr.push(LF);

	// Customer info
	if (printObj?.customerName) {
		wrapText(printObj.customerName, printWidth).forEach((line) => {
			printArr.push(str2hex(centerAlignValue(line, printWidth)));
		});
	}

	if (printObj?.customerLocation) {
		wrapText('LOCATION: ' + printObj.customerLocation, printWidth).forEach((line) => {
			printArr.push(str2hex(line));
		});
	}

	// Product & quantities
	printArr.push(str2hex(rightAlignValue('PRODUCT', printObj?.productName, printWidth)));
	printArr.push(str2hex(rightAlignValue('TIME', printObj?.closeTime ? new Date(printObj.closeTime).toLocaleTimeString() : 'N/A', printWidth)));
	printArr.push(str2hex(rightAlignValue('ASSETS', String(printObj?.assetsCount ?? 0), printWidth)));
	printArr.push(str2hex(rightAlignValue('VOLUME', Number(printObj?.deliveredQtyLiters || 0).toFixed(2) + 'L', printWidth)));

	signatureBoxes(printArr, printWidth, signatureBoxLines);
	return printArr;
}

export const deliverySlipDetailedFormat = (printObj: any, printWidth: number, signatureBoxLines: number): string[] => {
	const printArr: string[] = [];

	// Header
	printArr.push(str2hex(centerAlignValue('****  Dispensing SLIP  ****', printWidth)));
	printArr.push(LF);
	printArr.push(str2hex(centerAlignValue('FUELBUDDY FUEL SUPPLY LLC', printWidth)));
	printArr.push(LF);

	// Truck / driver / slip
	printArr.push(str2hex(rightAlignValue('BOWSER No', printObj?.vehicleRegistrationNumber || 'N/A', printWidth)));
	printArr.push(str2hex(rightAlignValue('DRIVER', printObj?.driverName || 'N/A', printWidth)));
	// Ops asked for the code alongside the name only where there is one, so an
	// unassigned driver does not print a bare 'N/A' row.
	if (printObj?.driverCode) {
		printArr.push(str2hex(rightAlignValue('DRIVER No', printObj.driverCode, printWidth)));
	}
	printArr.push(LF);

	// Customer name (centered, wrapped)
	wrapText(printObj?.customerName || 'N/A', printWidth).forEach((line) => {
		printArr.push(str2hex(centerAlignValue(line, printWidth)));
	});

	// Delivery location, left-aligned and wrapped: it is prose, not a field, and is
	// usually wider than the slip.
	if (printObj?.customerLocation) {
		wrapText('LOCATION: ' + printObj.customerLocation, printWidth).forEach((line) => {
			printArr.push(str2hex(line));
		});
	}
	printArr.push(LF);

	// Order number
	printArr.push(str2hex(rightAlignValue('ORDER No', printObj?.orderCode || 'N/A', printWidth)));
	printArr.push(LF);

	// Assets
	const assets = printObj?.assets || [];

	let totalQty = 0;
	for (const asset of assets) {
		printArr.push(str2hex(rightAlignValue('ASSET No', asset.registrationNumber || 'N/A', printWidth)));
		// Same labels as the legacy per-asset slip, so ops read the two the same way.
		printArr.push(str2hex(rightAlignValue('START TOT.', asset.startTotalizer ?? 'N/A', printWidth)));
		printArr.push(str2hex(rightAlignValue('END TOT.', asset.endTotalizer ?? 'N/A', printWidth)));
		printArr.push(str2hex(rightAlignValue('VOLUME', asset.quantity != null ? String(asset.quantity) + 'L' : 'N/A', printWidth)));
		const at = asset.endTime ? new Date(asset.endTime) : null;
		printArr.push(str2hex(rightAlignValue('TIME', at ? at.toLocaleTimeString() : 'N/A', printWidth)));
		printArr.push(str2hex(rightAlignValue('DATE', at ? at.toLocaleDateString() : 'N/A', printWidth)));
		if (asset.odometerReading) {
			printArr.push(str2hex(rightAlignValue('ODOMETER', asset.odometerReading, printWidth)));
		}
		printArr.push(str2hex('-'.repeat(printWidth)));
		totalQty += Number(asset.quantity) || 0;
	}

	printArr.push(str2hex(rightAlignValue('TOTAL QTY DISPENSED', totalQty.toFixed(2) + 'L', printWidth)));
	printArr.push(str2hex(rightAlignValue('TOTAL ASSETS', String(assets.length), printWidth)));
	printArr.push(LF);

	signatureBoxes(printArr, printWidth, signatureBoxLines);

	return printArr;
};

/**
 * Picks the slip layout for a print object. Every dispenser chose it the same way,
 * so it lives here; each dispenser only owns its own framing bytes.
 *
 * `printWidth` is the printer's column count and `signatureBoxLines` the height of
 * each signature box. Every deployed printer is 40 columns, so both default — pass
 * them only for a printer that differs.
 */
export const buildSlip = (printObj: any, printWidth = 40, signatureBoxLines = 7): string[] => {
	switch (printObj?.formatType) {
		case 'ORDER_SUMMARY':
			return orderSummaryFormat(printObj, printWidth, signatureBoxLines);

		case 'DELIVERY_SLIP_DETAILED':
			return deliverySlipDetailedFormat(printObj, printWidth, signatureBoxLines);

		// The original per-asset slip: a signed copy for the customer when the order
		// asked for a receipt, then the driver's copy, cut apart by 0A1D564100.
		default: {
			const printArr: string[] = [];
			if (printObj?.isReceiptRequired) {
				printArr.push(...printFormat(printObj, 'DISPENSING SLIP', printWidth));
				printArr.push(PARTIAL_CUT);
			}
			printArr.push(...printFormat(printObj, 'PRINT COPY', printWidth));
			return printArr;
		}
	}
};

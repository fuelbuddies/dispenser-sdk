//npm run esbuild-browser:watch

import { BaseDispenser } from "./base/BaseDispenser";
export class IsoilVegaTVersion10 extends BaseDispenser {
    private totalizerBuffer =        Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0D]);
    private read_sale =              Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0D]);
    private transaction_enable =     Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x34, 0x31, 0x31, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x39, 0x20, 0x20, 0x20, 0x20, 0x39, 0x35, 0x0D]);
    private read_preset =            Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0D]);
    private start =                  Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x34, 0x20, 0x20, 0x20, 0x20, 0x43, 0x41, 0x0D]);
    private preset_dummy =           Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x32, 0x31, 0x30, 0x30, 0x31, 0x32, 0x33, 0x34, 0x31, 0x31, 0x20, 0x20, 0x20, 0x20, 0x37, 0x36, 0x0D]);
    private stop =                   Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x35, 0x31, 0x20, 0x20, 0x20, 0x20, 0x45, 0x44, 0x0D]);
    private terminate =              Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x35, 0x30, 0x20, 0x20, 0x20, 0x20, 0x44, 0x44, 0x0D]);
    private inbetween_close =        Buffer.from([0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x36, 0x20, 0x20, 0x20, 0x20, 0x45, 0x41, 0x0D]);
    private transaction_close =      Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x34, 0x37, 0x20, 0x20, 0x20, 0x20, 0x45, 0x41, 0x0D]);
    private check_nozzle_totalizer = Buffer.from([0x02, 0x30, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x20, 0x20, 0x20, 0x20, 0x36, 0x33, 0x0D]);

    // elockStatus() {
    //     this.debugLog("elockStatus", "Lock_Status");
    //     this.connection.send('Lock_Status');
    // }

    checkType() {
        return 'ISOILVEGATV10';
    }
    
    getExternalPump() {
        return "false";
    }

    // elockUnlock() {
    //     this.debugLog("elockUnlock", "Lock_UnLock");
    //     this.connection.send('Lock_UnLock');
    // }

    // elockReset() {
    //     this.debugLog("elockReset", "Lock_Reset");
    //     this.connection.send('Lock_Reset');
    // }

    // elockLock() {
    //     this.debugLog("elockLock", "Lock_Lock");
    //     this.connection.send('Lock_Lock');
    // }

    async totalizer() {
        this.debugLog("totalizer", "Read_Totalizer");
        await this.connection.write(this.totalizerBuffer);
    }

    readPreset() {
        this.debugLog("readPreset", "Read_Status");
        this.connection.write(this.check_nozzle_totalizer); // same command to get data on isoil
    }

    readSale() {
        this.debugLog("readSale", "Read_Status");
        this.connection.write(this.check_nozzle_totalizer); // same command to get data on isoil
    }

    async readStatus() {
        this.debugLog("readStatus", "Read_Status");
        await this.connection.write(this.check_nozzle_totalizer); // response needs some statuses to be hardcoded .. will see
    }


    switchToRemote() {
        this.debugLog("switchToRemote", "Go_Remote");
        //TBD        this.connection.send('Go_Remote');
    }

    switchToLocal() {
        this.debugLog("switchToLocal", "Go_Local");
        //TBD        this.connection.send('Go_Local');
    }

    async pumpStart() {
        this.debugLog("startPump", "Pump_Start");
        await this.connection.write(this.transaction_enable);
    }

    async pumpStop() {
        this.debugLog("stopPump", "Pump_Stop");
        await this.connection.write(this.terminate);
        await this.delay(300);
        await this.connection.write(this.inbetween_close);
        await this.delay(300);
    }

    async authorizeSale() {
        this.debugLog("authorizeSale", "Start");
        await this.connection.write(this.start);
    }

    async setPreset(quantity: number) {
        this.debugLog("setPreset", `Preset_QTY=${quantity}`);
        await this.sendPreset(quantity);
    }

    async sendPreset(quantity: number) {
        let J = 0, K = 0, L = 0, P = 0;
        const set: number = Math.floor(quantity);
        if (set < 10) {
            J = 0;
            K = 0;
            L = 0;
            P = set;
        }
        if (set > 9 && set < 100) {
            J = 0;
            K = 0;
            L = Math.floor(set / 10);
            P = set % 10;
        }
        if (set > 99 && set < 1000) {
            J = 0;
            K = Math.floor(set / 100);
            L = Math.floor((set / 10) % 10);
            P = set % 10;
        }
        if (set > 999 && set < 10000) {
            J = Math.floor(set / 1000);
            K = Math.floor((set / 100) % 10);
            L = Math.floor((set / 10) % 10);
            P = set % 10;
        }

        const one: number = 0x30 + J;
        const two: number = 0x30 + K;
        const three: number = 0x30 + L;
        const four: number = 0x30 + P;
        const BCC: number[] = [0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x32, 0x31, 0x30, 0x30, one, two, three, four, 0x31, 0x31, 0x20, 0x20, 0x20, 0x20];
        const BCC_SIZE: number = 20;

        let checksum: number = 0;
        for (let i = 0; i < BCC_SIZE; i++) {
            checksum += BCC[i];
        }
        checksum %= 256;

        const checksumHex: string = checksum.toString(16).toUpperCase().padStart(2, '0');
        const checksum1: number = checksumHex.charCodeAt(0);
        const checksum2: number = checksumHex.charCodeAt(1);

        const volume: number[] = [0x02, 0x30, 0x30, 0x31, 0x31, 0x34, 0x32, 0x31, 0x30, 0x30, one, two, three, four, 0x31, 0x31, 0x20, 0x20, 0x20, 0x20, checksum2, checksum1, 0x0D];

        // Uncomment to print volume array
        // for (let i = 0; i < 23; i++) {
        //     console.log(volume[i].toString(16).padStart(2, '0'));
        // }

        // Call write_command with volume array
        // write_command(volume);
        // Assuming dispencerSerial is accessible
        await this.connection.write(Buffer.from(volume));
    }

    async cancelPreset() {
        this.debugLog("cancelPreset", "Cancel_Preset");
        await this.sendPreset(0.0);
    }

    async suspendSale() {
        this.debugLog("suspendSale", "Stop");
        await this.connection.write(this.stop);
    }

    async resumeSale() {
        this.debugLog("resumeSale", "Resume_Sale");
        await this.connection.write(this.terminate);
        await this.delay(300);
        await this.connection.write(this.start);
        await this.delay(300);
    }

    async clearSale() {
        this.debugLog("clearSale", "Clear_Sale");
        await this.connection.write(this.transaction_close);
    }

    hasExternalPump() {
        this.debugLog("hasExternalPump", "External_Pump");
        return "false";
    }

    readAuthorization() {
        this.debugLog("readAuthorization", "Read_Authorization");
        this.connection.write(this.check_nozzle_totalizer); // same command to get data on isoil
    }

    processLegacyCommand(res: string) {
        this.debugLog("processLegacyCommand", res);

        if (!res.includes("59")) {
            this.debugLog("processLegacyCommand", "Command failed! check for status");
            throw Error("Command failed! check for status")
        }

        this.debugLog("processLegacyCommand", "Command success")
        return true;
    }

    processResponseRaw(response: string[], exponentCut: number, mantessaCut: number) {
        this.debugLog("processResponseRaw", response.join('\n'));

        if (response.length < 2) {
            this.debugLog("processResponseRaw", "Incompatible response");
            throw new Error("Incompatible response");
        }

        const exponent = this.hex2a(this.cutStringFromLast(response[0], exponentCut, true));
        const mantessa = this.hex2a(this.cutStringFromLast(response[1], mantessaCut, false));

        const returnString = `${exponent}.${mantessa}`;
        this.debugLog("processResponseRaw", returnString);
        return returnString;
    }

    /**
     * totalizer encoded to actual string helper.
     * @param response string[]
     * @param exponentCut number
     * @param mantessaCut number
     * @returns
     */
    processResponse(response: string[], exponentCut: number, mantessaCut: number) {
        this.debugLog("processResponse", response.join('\n'));
        const responseRaw = this.processResponseRaw(response, exponentCut, mantessaCut);
        this.debugLog("processResponse", JSON.stringify(responseRaw));
        return parseFloat(responseRaw);
    }

    processCommand(res: string) {
        this.debugLog("processCommand", res);
        if (!res.slice(0, -8).endsWith("3030")) {
            this.debugLog("processCommand", "Command failed! check for status");
            throw Error("Command failed! check for status")
        }

        this.debugLog("processCommand", "Command success");
        return true;
    }

    processRequestOfStartDelivery(res: string) {
        this.debugLog("processRequestOfStartDelivery", res);

        if (res.slice(0, 38).endsWith("30")) {
            this.debugLog("processRequestOfStartDelivery", "Not present");
            return "Not present";
        }
        else if (res.slice(0, 38).endsWith("31")) {
            this.debugLog("processRequestOfStartDelivery", "Request present");
            return "Request present";
        }
        else {
            this.debugLog("processRequestOfStartDelivery", "Command failed! check for status");
            return Error("Command failed! check for status");
        }
    }

    processStatusOfRemoteStop(res: string) {
        this.debugLog("processStatusOfRemoteStop", res);
        if (res.slice(0, -34).endsWith("30")) {
            this.debugLog("processStatusOfRemoteStop", "Not active");
            return "Not active";
        }
        else if (res.slice(0, -34).endsWith("31")) {
            this.debugLog("processStatusOfRemoteStop", "Active");
            return "Active";
        }
        else {
            this.debugLog("processStatusOfRemoteStop", "Command failed! check for status");
            return Error("Command failed! check for status");
        }
    }

    processStatusOfLocalPrinting(res: string) {
        this.debugLog("processStatusOfRemoteStop", res);
        if (res.slice(0, -526).endsWith("30")) {
            this.debugLog("processStatusOfRemoteStop", "Printer not enabled");
            return "Printer not enabled";
        }
        else if (res.slice(0, -526).endsWith("31")) {
            this.debugLog("processStatusOfRemoteStop", "Printer ON LINE");
            return "Printer ON LINE";
        }
        else if (res.slice(0, -526).endsWith("32")) {
            this.debugLog("processStatusOfRemoteStop", "No paper");
            return "No paper";
        }
        else if (res.slice(0, -526).endsWith("33")) {
            this.debugLog("processStatusOfRemoteStop", "Printer OFF LINE");
            return "Printer OFF LINE";
        }
        else if (res.slice(0, -526).endsWith("34")) {
            this.debugLog("processStatusOfRemoteStop", "Printer BUSY");
            return "Printer BUSY";
        }
        else if (res.slice(0, -526).endsWith("35")) {
            this.debugLog("processStatusOfRemoteStop", "Printing in progress");
            return "Printing in progress";
        }
        else if (res.slice(0, -526).endsWith("36")) {
            this.debugLog("processStatusOfRemoteStop", "Print aborted");
            return "Print aborted";
        }
        else if (res.slice(0, -526).endsWith("37")) {
            this.debugLog("processStatusOfRemoteStop", "Data not available");
            return "Data not available";
        }
        else {
            this.debugLog("processStatusOfRemoteStop", "Command failed! check for status");
            return Error("Command failed! check for status");
        }
    }


    processStatusOfBatch(res: string) {
        this.debugLog("processStatusOfBatch", res);
        if (res.slice(0, -32).endsWith("30")) {
            this.debugLog("processStatusOfBatch", "Batch not active");
            return "Batch not active";
        }
        else if (res.slice(0, -32).endsWith("31")) {
            this.debugLog("processStatusOfBatch", "Delivery in progress");
            return "Delivery in progress";
        }
        else if (res.slice(0, -32).endsWith("32")) {
            this.debugLog("processStatusOfBatch", "Delivery stopped");
            return "Delivery stopped";
        }
        else if (res.slice(0, -32).endsWith("33")) {
            this.debugLog("processStatusOfBatch", "Delivery completed");
            return "Request of store data of batch";
        }
        else {
            this.debugLog("processStatusOfBatch", "Command failed! check for status");
            throw Error("Command failed! check for status")
        }
    }

    processFlowOfProduct(res: string) {
        this.debugLog("processFlowOfProduct", res);
        if (res.slice(0, -30).endsWith("30")) {
            this.debugLog("processFlowOfProduct", "No flow");
            return "No flow";
        }
        else if (res.slice(0, -30).endsWith("31")) {
            this.debugLog("processFlowOfProduct", "Flow in progress");
            return "flow in pogress";
        }
        else {
            this.debugLog("processFlowOfProduct", "Command failed! check for status");
            return Error("Command failed! check for status");
        }
    }
    processStatusOfStopBatch(res: string) {
        this.debugLog("processStatusOfStopBatch", res);
        if (res.slice(0, -28).endsWith("30")) {
            this.debugLog("processStatusOfStopBatch", "No stop");
            return "No stop";
        }
        else if (res.slice(0, -28).endsWith("31")) {
            this.debugLog("processStatusOfStopBatch", "Stop by operator");
            return "Stop by operator";
        }
        else if (res.slice(0, -28).endsWith("32")) {
            this.debugLog("processStatusOfStopBatch", "Stop by remote");
            return "Stop for faulting of power supply";
        }
        else if (res.slice(0, -28).endsWith("34")) {
            this.debugLog("processStatusOfStopBatch", "Stop by permissive absence");
            return "Stop by permissive absence";
        }
        else if (res.slice(0, -28).endsWith("35")) {
            this.debugLog("processStatusOfStopBatch", "Stop by system alarm");
            return "Stop by system alarm";
        }
        else if (res.slice(0, -28).endsWith("36")) {
            this.debugLog("processStatusOfStopBatch", "Stop by meter alarm");
            return "Stop by meter alarm";
        }
        else if (res.slice(0, -28).endsWith("37")) {
            this.debugLog("processStatusOfStopBatch", "Stop by weight & measure switch absence");
            return "Stop by weight & measure switch absence";
        }
        else if (res.slice(0, -28).endsWith("38")) {
            this.debugLog("processStatusOfStopBatch", "Remote to local commutation");
            return "Remote to local commutation";
        }
        else {
            this.debugLog("processStatusOfStopBatch", "Command failed! check for status");
            return Error("Command failed! check for status");
        }
    }

    processStatus(res: string) {
        this.debugLog("processStatus", res);

        const response = {
            requestOfStartDelivery: this.processRequestOfStartDelivery(res),
            remoteStop: this.processStatusOfRemoteStop(res),
            statusOfBatch: this.processStatusOfBatch(res),
            flowOfProduct: this.processFlowOfProduct(res),
            localPrinting: this.processStatusOfLocalPrinting(res),
            stopOfBatch: this.processStatusOfStopBatch(res)
        }

        this.debugLog("processStatus", JSON.stringify(response));
        return response;
    }

    processRawReadStatus(res: string) {
        this.debugLog("processRawReadStatus", res);

        const response = this.hex2a(res).split(" ").filter((e) => { return e ? true : false; });
        this.debugLog("processRawReadStatus", JSON.stringify(response));
        return response;
    }

    processTotalizer(res: string) {
        this.debugLog("processTotalizer", res);
        const response = parseFloat((this.processRawReadStatus(res))[7].replace(',', '.'));
        this.debugLog("processTotalizer", JSON.stringify(response));
        return response;
    }

    processTotalizerWithBatch(res: string) {
        this.debugLog("processTotalizerWithBatch", res);
        const response = {
            totalizer: parseFloat((this.processRawReadStatus(res))[7].replace(',', '.')),
            batchNumber: this.processBatchNumber(res) + 1, // called before pump start.. so +1
            timestamp: Date.now()
        };
        this.debugLog("processTotalizerWithBatch", JSON.stringify(response));
        return response;
    }

    processReadSale(res: string) {
        this.debugLog("processReadSale", res);
        const response = parseFloat((this.processRawReadStatus(res))[12].replace(',', '.'));
        this.debugLog("processReadSale", JSON.stringify(response));
        return response;
    }

    processReadPreset(res: string) {
        this.debugLog("processReadPreset", res);
        const response = parseFloat((this.processRawReadStatus(res))[11].slice(0, -2));
        this.debugLog("processReadPreset", JSON.stringify(response));
        return response;
    }

    processFlowRate(res: string) {
        this.debugLog("processFlowRate", res);
        const response = parseInt(this.hex2a(res.slice(-82, -70)));
        this.debugLog("processFlowRate", JSON.stringify(response));
        return response;
    }

    processAverageFlowRate(res: string) {
        this.debugLog("processAverageFlowRate", res);
        const response = parseInt(this.hex2a(res.slice(-70, -58)));
        this.debugLog("processAverageFlowRate", JSON.stringify(response));
        return response;
    }

    processBatchNumber(res: string) {
        this.debugLog("processBatchNumber", res);
        const response = parseInt(this.hex2a(res.slice(242, 254)));
        this.debugLog("processBatchNumber", JSON.stringify(response));
        return response;
    }

    hasChecksBeforePumpStart() {
        this.debugLog("hasChecksBeforePumpStart", "false");
        return false;
    }
    isPumpStopped(res: string) {
        this.debugLog("isPumpStopped", res);
        const status = this.processStatus(res);
        this.debugLog("isPumpStopped", JSON.stringify(status));
        if (status.requestOfStartDelivery == 'Request present') {
            this.debugLog("isPumpStopped", "false");
            return false;
        }

        this.debugLog("isPumpStopped", "true");
        return true;
    }

    isReadyForPreset() {
        this.debugLog("isReadyForPreset", "true");
        return true;
    }

    isNozzleOnHook() {
        this.debugLog("isNozzleOnHook", "true");
        return true;
    }

    isNozzleOffHook() {
        this.debugLog("isNozzleOffHook", "true");
        return true;
    }

    isOnline(res: string): boolean {
        this.debugLog("isOnline", res);
        const readStatuses = this.processRawReadStatus(res);
        if (readStatuses.length > 0) {
            this.debugLog("isOnline", "true");
            return true;
        }
        this.debugLog("isOnline", "false");
        return false;
    }

    isPresetVerified(res: string, quantity: number) {
        this.debugLog("isPresetVerified", res);
        const presetValue = this.processReadPreset(res);
        if (quantity == presetValue) {
            this.debugLog("isPresetVerified", "true");
            return true;
        }
        this.debugLog("isPresetVerified", "false");
        return false;

    }

    isDispensing(res: string) {
        this.debugLog("isDispensing", res);
        const status = this.processStatus(res);
        this.debugLog("isDispensing", JSON.stringify(status));
        if (status.flowOfProduct == 'No flow' || status.remoteStop == 'Active') {
            this.debugLog("isDispensing", "false");
            return false;
        }
        this.debugLog("isDispensing", "true");
        return true;
    }

    isIdle(res: string) {
        this.debugLog("isIdle", res);
        const status = this.processStatus(res);
        this.debugLog("isDispensing", JSON.stringify(status));
        if (status.flowOfProduct == 'No flow' && status.statusOfBatch == 'Batch not active' && status.requestOfStartDelivery == 'Not present') {
            this.debugLog("isDispensing", "false");
            return true;
        }
        this.debugLog("isDispensing", "true");
        return false;
    }

    isSaleCloseable() {
        this.debugLog("isSaleCloseable", "true");
        return true;
    }

    /**
     * isOrderComplete
     *
     * @param res
     * @param quantity
     * @returns
     */
    isOrderComplete(res: string, quantity: number) {
        this.debugLog("isOrderComplete", res);
        const readsale = this.processReadSale(res);
        const totalizer = this.processTotalizer(res);

        if (readsale > quantity - 1) {
            const response = {
                status: true,
                percentage: this.toFixedNumber((readsale / quantity) * 100.00, 2),
                currentFlowRate: this.processFlowRate(res),
                averageFlowRate: this.processAverageFlowRate(res),
                batchNumber: this.processBatchNumber(res),
                totalizer,
                dispensedQty: this.toFixedNumber(readsale, 2)
            };

            this.debugLog("isOrderComplete", JSON.stringify(response));
            return response;
        }

        const response = {
            status: false,
            percentage: this.toFixedNumber((readsale / quantity) * 100.00, 2),
            currentFlowRate: this.processFlowRate(res),
            averageFlowRate: this.processAverageFlowRate(res),
            batchNumber: this.processBatchNumber(res),
            totalizer,
            dispensedQty: this.toFixedNumber(readsale, 2)
        };

        this.debugLog("isOrderComplete", JSON.stringify(response));
        return response;
    }

    printReceipt(printObj: any) {
        const printWidth = 33;
        const printArr = [];

        this.debugLog("printReceipt", JSON.stringify(printObj));

        if (printObj?.isReceiptRequired) {
            printArr.push(this.str2hex(this.centerAlignValue("****  CUSTOMER COPY  ****", printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.centerAlignValue("FUELBUDDY FUEL SUPPLY LLC", printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("BOWSER No", printObj?.vehicleRegistrationNumber, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("ASSET No", printObj?.registrationNumber, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("DATE", (new Date(printObj?.orderDate)).toLocaleDateString(), printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("DRIVER", printObj?.driverCode, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("CUSTOMER", printObj?.customerCode, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("ORDER No", printObj?.orderCode, printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("Batch No", printObj?.batchCode, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("START TIME", (new Date(printObj?.startTime)).toLocaleTimeString(), printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("END TIME", (new Date(printObj?.endTime)).toLocaleTimeString(), printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("PRODUCT", printObj?.productName, printWidth)));
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("DELIVERED", printObj?.quantity, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("START TOT.", printObj?.startTotalizer, printWidth)));
            printArr.push(this.str2hex(this.rightAlignValue("END TOT.", printObj?.endTotalizer, printWidth)));
            if (printObj?.odometerReading) {
                printArr.push(this.str2hex(this.rightAlignValue("ODOMETER", printObj?.odometerReading, printWidth)));
            }
            printArr.push('0A');
            printArr.push(this.str2hex(this.rightAlignValue("GROSS VOLUME", printObj?.unitOfMeasure, printWidth)));
            printArr.push('0A');
            printArr.push('0A');
        }

        printArr.push(this.str2hex(this.centerAlignValue("****  PRINT COPY  ****", printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.centerAlignValue("FUELBUDDY FUEL SUPPLY LLC", printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("BOWSER No", printObj?.vehicleRegistrationNumber, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("ASSET No", printObj?.registrationNumber, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("DATE", (new Date(printObj?.orderDate)).toLocaleDateString(), printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("DRIVER ID", printObj?.driverCode, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("CUSTOMER ID", printObj?.customerCode, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("ORDER No", printObj?.orderCode, printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("Batch No", printObj?.batchCode, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("START TIME", (new Date(printObj?.startTime)).toLocaleTimeString(), printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("END TIME", (new Date(printObj?.endTime)).toLocaleTimeString(), printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("PRODUCT", printObj?.productName, printWidth)));
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("DELIVERED", printObj?.quantity, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("START TOT.", printObj?.startTotalizer, printWidth)));
        printArr.push(this.str2hex(this.rightAlignValue("END TOT.", printObj?.endTotalizer, printWidth)));
        if (printObj?.odometerReading) {
            printArr.push(this.str2hex(this.rightAlignValue("ODOMETER", printObj?.odometerReading, printWidth)));
        }
        printArr.push('0A');
        printArr.push(this.str2hex(this.rightAlignValue("GROSS VOLUME", printObj?.unitOfMeasure, printWidth)));

        this.debugLog("printReceipt", `02303031313438313030303930${printArr.join('0A')}0A0A2020202020`);
        this.printOrder(`02303031313438313030303930${printArr.join('0A')}0A0A2020202020`);
    }

    printOrder(printText: string): boolean {
        let i: number;
        let checksum: number = 0;
      
        for (i = 0; i < printText.length; i += 2) {
          checksum += this.hexStringToByte(printText, i);
        }
      
        checksum %= 256;
      
        const checksumHex: string = checksum.toString(16).padStart(2, "0"); // More concise way to get hex string
      
        const checksum1: number = checksumHex.charCodeAt(0);
        const checksum2: number = checksumHex.charCodeAt(1);
      
        // Send each character of the hex string over serial
        for (i = 0; i < printText.length; i += 2) {
          this.connection.write(this.hexStringToByte(printText, i));
        }
      
        this.connection.write(checksum2);
        this.connection.write(checksum1);
        return this.connection.write(0x0d);
      }
}
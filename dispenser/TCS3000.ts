import { BaseDispenser } from "./base/BaseDispenser";

export class TCS3000 extends BaseDispenser {
    // // elockStatus() {
    // //     this.debugLog("elockStatus", "Lock_Status");
    // //     this.connection.send('Lock_Status');
    // // }

    // checkType() {
    //    this.connection.send("Dispenser");
    // }

    // // elockUnlock() {
    // //     this.debugLog("elockUnlock", "Lock_UnLock");
    // //     this.connection.send('Lock_UnLock');
    // // }

    // // elockReset() {
    // //     this.debugLog("elockReset", "Lock_Reset");
    // //     this.connection.send('Lock_Reset');
    // // }

    // // elockLock() {
    // //     this.debugLog("elockLock", "Lock_Lock");
    // //     this.connection.send('Lock_Lock');
    // // }

    // totalizer() {
    //     this.debugLog("totalizer", "Read_Totalizer");
    //     this.connection.send('Totalizer');
    // }

    // readPreset() {
    //     this.debugLog("readPreset", "Read_Status");
    //     this.connection.send('Read_Status'); // same command to get data on isoil
    // }

    // readSale() {
    //     this.debugLog("readSale", "Read_Sale");
    //     this.connection.send('Read_Sale'); // same command to get data on isoil
    // }

    // readStatus() {
    //     this.debugLog("readStatus", "Read_Status");
    //     this.connection.send("Read_Status"); // response needs some statuses to be hardcoded .. will see
    // }

    // switchToRemote() {
    //     this.debugLog("switchToRemote", "Go_Remote");
    //     //TBD        this.connection.send('Go_Remote');
    // }

    // switchToLocal() {
    //     this.debugLog("switchToLocal", "Go_Local");
    //     //TBD        this.connection.send('Go_Local');
    // }

    // startPump() {
    //     this.debugLog("startPump", "Pump_Start");
    //     this.connection.send('Pump_Start');
    // }

    // stopPump() {
    //     this.debugLog("stopPump", "Pump_Stop");
    //     this.connection.send("Pump_Stop");
    // }

    // authorizeSale() {
    //     this.debugLog("authorizeSale", "Start");
    //     this.connection.send("Authorize");
    // }

    // setPreset(quantity: number) {
    //     this.debugLog("setPreset", `Preset_QTY=${quantity}`);
    //     this.connection.send(`Preset_QTY=${quantity}`);
    // }

    // cancelPreset() {
    //     this.debugLog("cancelPreset", "Cancel_Preset");
    //     this.connection.send("Cancel_Preset");
    // }

    // suspendSale() {
    //     this.debugLog("suspendSale", "Stop");
    //     this.connection.send("Suspend_Sale");
    // }

    // resumeSale() {
    //     this.debugLog("resumeSale", "Resume_Sale");
    //     this.connection.send("Resume_Sale");
    // }

    // clearSale() {
    //     this.debugLog("clearSale", "Clear_Sale");
    //     this.connection.send('Clear_Sale');
    // }

    // hasExternalPump() {
    //     this.debugLog("hasExternalPump", "External_Pump");
    //     return "false";
    // }

    // // readExternalPumpStatus() {
    // //     this.debugLog("readExternalPumpStatus", "External_Pump_Status");
    // //     this.connection.send("External_Pump_Status");
    // // }

    // // startExternalPump() {
    // //     this.debugLog("startExternalPump", "External_Pump_Start");
    // //     this.connection.send("External_Pump_Start");
    // // }

    // // stopExternalPump() {
    // //     this.debugLog("stopExternalPump", "External_Pump_Stop");
    // //     this.connection.send("External_Pump_Stop");
    // // }

    // readAuthorization() {
    //     this.debugLog("readAuthorization", "Read_Authorization");
    //     this.connection.send("Read_Authorization");
    // }

    processTotalizer(res: string) {
        this.debugLog("processTotalizer", res);
        const response = this.hexToNumber(res.slice(16, -2));
        this.debugLog("processTotalizer", JSON.stringify(response));
        return response;
    }

    processTotalizerWithBatch(res: string) {
        this.debugLog("processTotalizerWithBatch", res);
        // const response = {
        //     totalizer: parseFloat((this.processRawReadStatus(res))[7].replace(',', '.')),
        //     batchNumber: this.processBatchNumber(res) + 1 // called before pump start.. so +1
        // };
        const response = { totalizer: this.processTotalizer(res), batchNumber: 0 };
        this.debugLog("processTotalizerWithBatch", JSON.stringify(response));
        return response;
    }

    processCommand(res: string, args: any, fnName: string) {
        if (args) {
            this.debugLog("processCommand", JSON.stringify(args));
            console.log("processCommandArgs", JSON.stringify(args));
        }

        if (fnName) {
            console.log("processCommandfnName", JSON.stringify(fnName))
            this.debugLog("processCommand", JSON.stringify(fnName));
        }

        if (fnName === "suspendSale") {
            if (res.includes('0043') || res.includes('0023')) {
                this.debugLog("processCommand", "Command success for suspend");
                return true;
            }
            this.debugLog("processCommand", "Command failed! check for status");
            throw Error("Command failed! check for status for pause");
        }

        if (fnName === "resumeSale") {
            if (res.includes('0023')) {
                this.debugLog("processCommand", "Command success for resume");
                return true;
            }
            this.debugLog("processCommand", "Command failed! check for status");
            throw Error("Command failed! check for status for resume");
        }

        this.debugLog("processCommand", res);
        if (res.includes('0011') || res.includes('0064') || res.includes('0044')) {
            this.debugLog("processCommand", "Command success");
            return true;
        }

        this.debugLog("processCommand", "Command failed! check for status");
        throw Error("Command failed! check for status");
    }

    processReadSale(res: string) {
        this.debugLog("processReadSale", res);
        const response = this.hexToNumber(res.slice(16, -2));
        this.debugLog("processReadSale", JSON.stringify(response));
        return response;
    }

    processStatus(res: string) {
        this.debugLog("processStatus", res);
        const statusBit = res.slice(16, -2);
        const statusMap = new Map([
            ['00', 'ERROR'],
            ['01', 'IDLE'],
            ['02', 'ACTIVE'],
            ['03', 'AIR (Air detected)'],
            ['04', 'PAUSED'],
            ['05', 'STOPPED'],
            ['06', 'TCKT_PENDING'],
            ['07', 'PRINTING']
        ]);
        return { status: statusMap.get(statusBit) };
    }

    isPumpStopped(res: string) {
        this.debugLog("isPumpStopped", res);
        const status = this.processStatus(res);
        this.debugLog("isPumpStopped", JSON.stringify(status));
        if (status.status == 'IDLE') {
            this.debugLog("isPumpStopped", "true");
            return true;
        }

        this.debugLog("isPumpStopped", "false");
        return false;
    }

    isDispensing(res: string) {
        this.debugLog("isDispensing", res);
        const status = this.processStatus(res);
        if (status.status == 'ACTIVE') {
            return true;
        }

        return false;
    }

    isIdle(res: string) {
        this.debugLog("isIdle", res);
        const status = this.processStatus(res);
        if (status.status == 'IDLE') {
            return true;
        }

        return false;
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

        if (readsale > quantity - 1) {
            const response = {
                status: true,
                percentage: this.toFixedNumber((readsale / quantity) * 100.00, 2),
                // currentFlowRate: this.processFlowRate(res),
                // averageFlowRate: this.processAverageFlowRate(res),
                // batchNumber: this.processBatchNumber(res),
                dispensedQty: this.toFixedNumber(readsale, 2)
            };

            this.debugLog("isOrderComplete", JSON.stringify(response));
            return response;
        }

        const response = {
            status: false,
            percentage: this.toFixedNumber((readsale / quantity) * 100.00, 2),
            // currentFlowRate: this.processFlowRate(res),
            // averageFlowRate: this.processAverageFlowRate(res),
            // batchNumber: this.processBatchNumber(res),
            dispensedQty: this.toFixedNumber(readsale, 2)
        };

        this.debugLog("isOrderComplete", JSON.stringify(response));
        return response;
    }

    isOnline(res: string): boolean {
        const status = this.processStatus(res);
        if (status.status) {
            return true;
        }
        return false;
    }

    isPresetVerified() {
        return true; // can't check in this dispenser
    }


    hasChecksBeforePumpStart() {
        this.debugLog("hasChecksBeforePumpStart", "false");
        return false;
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

    isSaleCloseable() {
        this.debugLog("isSaleCloseable", "true");
        return true;
    }
}
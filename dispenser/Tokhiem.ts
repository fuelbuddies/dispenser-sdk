import debug from 'debug';
import { BaseDispenser } from "./base/BaseDispenser";

const debugLog = debug('dispenser:Tokhiem');
export class Tokhiem extends BaseDispenser {
    private totalizerBuffer       = Buffer.from([0x01, 0x41, 0x54, 0x7F, 0x6B]);
    private pump_start            = Buffer.from([0x01, 0x41, 0x4F, 0x7F, 0x70]);
    private pump_stop             = Buffer.from([0x01, 0x41, 0x5A, 0x7F, 0x65]);
    private read_preset           = Buffer.from([0x01, 0x41, 0x48, 0x7F, 0x77]);
    private cancel_preset         = Buffer.from([0x01, 0x41, 0x45, 0x7F, 0x7A]);
    private authorize             = Buffer.from([0x01, 0x41, 0x41, 0x7F, 0x7E]);
    private go_local              = Buffer.from([0x01, 0x41, 0x47, 0x7F, 0x78]);
    private clear_sale            = Buffer.from([0x01, 0x41, 0x46, 0x7F, 0x79]);
    private suspend_sale          = Buffer.from([0x01, 0x41, 0x44, 0x7F, 0x7B]);
    private resume_sale           = Buffer.from([0x01, 0x41, 0x55, 0x7F, 0x6A]);
    private tokhim_read_sale      = Buffer.from([0x01, 0x41, 0x52, 0x7F, 0x6D]);
    private tokhim_status         = Buffer.from([0x01, 0x41, 0x53, 0x7F, 0x6C]);
    private tokhim_authorize_on   = Buffer.from([0x01, 0x41, 0x41, 0x7F, 0x7E]);
    private tokhim_authorize_off  = Buffer.from([0x01, 0x41, 0x47, 0x7F, 0x78]);
    private tokhim_show_preset    = Buffer.from([0x01, 0x41, 0x43, 0x7F, 0x7C]);

    async totalizer() {
        debugLog("totalizer");
        await this.connection.write(this.totalizerBuffer);
    }
    async authorizeSale() {
        debugLog("authorizeSale");
        await this.connection.write(this.authorize);
    }

    async readPreset() {
        debugLog("readPreset");
        await this.connection.write(this.read_preset);
    }

    async suspendDispencer() {
        debugLog("suspendDispencer");
        await this.connection.write(this.suspend_sale);
    }

    async clearSale() {
        debugLog("clearSale");
        await this.connection.write(this.clear_sale);
    }

    async readSale() {
        debugLog("readSale");
        await this.connection.write(this.tokhim_read_sale);
    }

    async readAuth() {
        debugLog("readAuth");
        await this.connection.write(this.tokhim_status);
    }

    async cancelPreset() {
        debugLog("cancelPreset");
        await this.connection.write(this.cancel_preset);
    }

    async resumeDispencer() {
        debugLog("resumeDispencer");
        await this.connection.write(this.resume_sale);
    }

    async pumpStop() {
        debugLog("pumpStop");
        await this.connection.write(this.pump_stop);
    }

    async pumpStart() {
        debugLog("pumpStart");
        await this.connection.write(this.pump_start);
    }

    printReciept(receiptMessage: unknown) {
        debugLog("printReciept");
        return "59";
    }

    getType() {
        return 'TOKHIEM';
    }

    getExternalPump() {
        debugLog("getExternalPump: false");
        return "false";
    }

    async switchMode(online=true) {
        if(online) {
            // for switching to online pump_start is recommended that is happening already in future flow
            debugLog("switchMode: online");
            await this.pumpStart();
        }
        debugLog("switchMode: offline");
        await this.connection.write(this.tokhim_authorize_off);
    }

    async readDispencerStatus() {
        debugLog("readDispencerStatus");
        await this.connection.write(this.tokhim_status);
    }

    async sendPreset(quantity: number) {
        debugLog("sendPreset", quantity);
        const set = Math.floor(quantity); // Convert quantity to integer

        let J = 0, K = 0, L = 0, P = 0;

        if (set < 10) {
            P = set;
        } else if (set < 100) {
            L = Math.floor(set / 10);
            P = set % 10;
        } else if (set < 1000) {
            K = Math.floor(set / 100);
            L = Math.floor((set / 10) % 10);
            P = set % 10;
        } else if (set < 10000) {
            J = Math.floor(set / 1000);
            K = Math.floor((set / 100) % 10);
            L = Math.floor((set / 10) % 10);
            P = set % 10;
        }

        const one = 0x30 + J;
        const two = 0x30 + K;
        const three = 0x30 + L;
        const four = 0x30 + P;

        const BCC = Buffer.from([0x01, 0x41, 0x50, 0x31, 0x30, one, two, three, four, 0x30, 0x30, 0x7F]);
        const result = BCC.reduce((acc, byte) => acc ^ byte, 0);
        const volume = Buffer.concat([BCC, Buffer.from([result])]);

        // Assuming you have a serialport object named 'dispencerSerial'
        debugLog("volume sent", volume);
        await this.connection.write(volume);
    }


  async switchToRemote() {
    debugLog("switchToRemote");
    await this.switchMode(true);
  }

  checkType() {
    debugLog("checkType");
    return this.getType();
  }

  async switchToLocal() {
    debugLog("switchToLocal");
    await this.switchMode(false);
  }

  // todo:  this will be moved to baseDispenser
  // elockStatus() {
  //   this.connection.send("Lock_Status");
  // }

  // elockUnlock() {
  //   this.connection.send("Lock_UnLock");
  // }

  // elockReset() {
  //   this.connection.send("Lock_Reset");
  // }

  // elockLock() {
  //   this.connection.send("Lock_Lock");
  // }

  async readStatus() {
    debugLog("readStatus");
    await this.readDispencerStatus();
  }

  async readAuthorization() {
    debugLog("readAuthorization");
    await this.readDispencerStatus();
  }

  async startPump() {
    debugLog("startPump");
    await this.pumpStart();
  }

  async stopPump() {
    debugLog("stopPump");
    await this.pumpStop();
  }

  async setPreset(quantity: number) {
    debugLog("setPreset", quantity);
    await this.sendPreset(quantity);
  }

  async suspendSale() {
    debugLog("suspendSale");
    await this.suspendDispencer();
  }

  async resumeSale() {
    debugLog("resumeSale");
    await this.resumeDispencer();
  }

  hasExternalPump() {
    debugLog("hasExternalPump");
    return this.getExternalPump();
  }

  // todo need to move this to base dispenser
  // readExternalPumpStatus() {
  //   this.connection.send("External_Pump_Status");
  // }

  // startExternalPump() {
  //   this.connection.send("External_Pump_Start");
  // }

  // stopExternalPump() {
  //   this.connection.send("External_Pump_Stop");
  // }

  async printReceipt(printObj: any) {
    await new Promise(resolve => setTimeout(resolve, 200));
    debugLog("printReceipt:", printObj);
    return "59";
    // this.connection.send("Print_Receipt");
  }

  processStatus(res: string) {
    debugLog("processStatus", arguments);
    const statusSplit = res.split("7f");
    const statusString = this.cutStringFromLast(statusSplit[0], 4, true);
    const hexStatus1 = this.cutStringFromLast(statusString, 2, true);
    const hexStatus0 = this.cutStringFromLast(statusString, 2, false);

    const returnObj = {
      duStatus: this.processStatusZero(hexStatus0.toString()),
      state: this.processStatusOne(hexStatus1.toString()),
    };

    debugLog("processStatus: ", returnObj);
    return returnObj;
  }

  processElockStatus(status: string) {
    debugLog("processElockStatus", status);
    const statuses: any = {
      Position: ["Unlocked", "Locked"],
      Tank1Cup: ["Unlocked", "Locked"],
      Tank1Handle: ["Unlocked", "Locked"],
      Tank2Cup: ["Unlocked", "Locked"],
      Tank2Handle: ["Unlocked", "Locked"],
    };


    var elockStatus = this.processStatusMappingRaw(status.split(""), statuses);
    debugLog("processElockStatus: ", elockStatus);
    return elockStatus;
  }

  processStatusMapping(status: string, statuses: any) {
    const statusCodes = this.hex2bin(status).split("").reverse();
    var returnObj = this.processStatusMappingRaw(statusCodes, statuses);
    debugLog("processStatusMapping: ", returnObj);
    return returnObj;
  }

  processStatusMappingRaw(statusCodes: any, statuses: any) {
    const statistics: any = Object.keys(statuses).map(function (key, index) {
      return [key, statuses[key][statusCodes[index]]];
    });

    var returnObj = statistics.reduce(function (acc: any, cur: any) {
      acc[cur[0]] = cur[1];
      return acc;
    }, {});

    debugLog("processStatusMappingRaw: ", returnObj);
    return returnObj;
  }

  processStatusZero(status: string) {
    const statuses: any = {
      Nozzle: ["Off Hook", "On Hook"],
      Motor: ["Motor Off", "Motor On"],
      Mode: ["Manual", "Remote"],
      SinglePulser: ["Ok", "Fail"],
      AllPulser: ["Ok", "Fail"],
      MainsFail: ["Ok", "Fail"],
      ATSCTag: ["Not Recieved", "Recieved"],
      Print: ["Taken", "Not Taken"],
    };

    var returnObj = this.processStatusMapping(status, statuses);
    debugLog("processStatusZero: ", returnObj);
    return returnObj;
  }

  processStatusOne(status: string) {
    debugLog("processStatusOne", status);
    switch (status) {
      case "30":
        return "Idle"; //
      case "31":
        return "Call"; //
      case "32":
        return "Preset Ready"; //
      case "33":
        return "Fueling";
      case "34":
        return "Payable"; //
      case "35":
        return "Suspended"; //no flow
      case "36":
        return "Stopped"; //Delivery stopped
      case "38":
        return "Inoperative";
      case "39":
        return "Authorised";
      case "3b":
        return "Started";
      case "3d":
        return "Suspend Started";
      case "3e":
        return "Wait for preset";
      default:
        throw new Error("Status not readable");
    }
  }

  processCommand(res: string) {
    debugLog("processCommand", arguments);
    if (!res.includes("59")) {
      throw Error("Command failed! check for status");
    }
    debugLog("processCommand: success");
    return true;
  }

  processReadSale(res: string) {
    debugLog("processReadSale", arguments);
    const responseCodedArray = res.split("2e");
    const returnObj = {
      unitPrice: this.processResponseRaw(
        [responseCodedArray[0], responseCodedArray[1]],
        4,
        6
      ),
      volume: this.processResponseRaw(
        [responseCodedArray[1], responseCodedArray[2]],
        8,
        6
      ),
      amount: this.processResponseRaw(
        [responseCodedArray[2], responseCodedArray[3]],
        10,
        2
      ),
      density: "",
    };

    debugLog("processReadSale: ", returnObj);
    return returnObj;
  }

  /**
   * process totalizer string value.
   * @param res string
   * @returns
   */
  processTotalizer(res: string) {
    var returnObj = this.processResponse(res.split("2e"), 16, 4);
    debugLog("processTotalizer: ", returnObj);
    return returnObj;
  }

  processTotalizerWithBatch(res: string) {
    var returnObj = {
      totalizer: this.processTotalizer(res),
      batchNumber: this.processBatchNumber(res) + 1,
      timestamp: new Date().getTime(),
    };

    debugLog("processTotalizerWithBatch: ", returnObj);
    return returnObj;
  }

  processReadPreset(res: string) {
    debugLog("processReadPreset", arguments);
    if (res.includes("4e"))
      throw new Error("Preset read command failed! please check");

    var returnObj = this.processResponse(res.split("2e"), 14, 4);
    debugLog("processReadPreset: ", returnObj);
    return returnObj;
  }

  processFlowRate(res: string) {
    debugLog("processFlowRate: %s", res);
    // const response = parseInt(this.hex2a(res.slice(-82, -70)));
    // debugLog("processFlowRate", JSON.stringify(response));
    return 0;
  }

  processAverageFlowRate(res: string) {
    debugLog("processAverageFlowRate: %s", res);
    // const response = parseInt(this.hex2a(res.slice(-70, -58)));
    // debugLog("processAverageFlowRate", JSON.stringify(response));
    return 0;
  }

  processBatchNumber(res: string) {
    debugLog("processBatchNumber: %s", res);
    // const response = parseInt(this.hex2a(res.slice(-58, -46)));
    // debugLog("processBatchNumber", JSON.stringify(0));
    return 0;
  }

  processResponseRaw(
    response: string[],
    exponentCut: number,
    mantessaCut: number
  ) {
    debugLog("processResponseRaw", arguments);

    if (response.length < 2) {
      throw new Error("Incompatible response");
    }

    const exponent = this.hex2a(
      this.cutStringFromLast(response[0], exponentCut, true)
    );
    const mantessa = this.hex2a(
      this.cutStringFromLast(response[1], mantessaCut, false)
    );

    var returnObj = `${exponent}.${mantessa}`;
    debugLog("processResponseRaw: %s", returnObj);
    return returnObj;
  }

  /**
   * totalizer encoded to actual string helper.
   * @param response string[]
   * @param exponentCut number
   * @param mantessaCut number
   * @returns
   */
  processResponse(
    response: string[],
    exponentCut: number,
    mantessaCut: number
  ) {
    debugLog("processResponse", arguments);
    var returnObj = parseFloat(
      this.processResponseRaw(response, exponentCut, mantessaCut)
    );

    debugLog("processResponse: ", returnObj);
    return returnObj;
  }

  hasChecksBeforePumpStart() {
    debugLog("hasChecksBeforePumpStart");
    return true;
  }

  isPumpStopped(res: string) {
    debugLog("isPumpStopped", arguments);
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Stopped") {
      debugLog("isPumpStopped: true");
      return true;
    }
    debugLog("isPumpStopped: false");
    return false;
  }

  isReadyForPreset(res: string) {
    debugLog("isReadyForPreset", arguments);
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Idle") {
      debugLog("isReadyForPreset: true");
      return true;
    }
    debugLog("isReadyForPreset: false");
    return false;
  }

  isNozzleOnHook(res: string): boolean {
    debugLog("isNozzleOnHook", arguments);
    const readStatuses = this.processStatus(res);
    if (readStatuses.duStatus["Nozzle"] == "On Hook") {
      debugLog("isNozzleOnHook: true");
      return true;
    }
    debugLog("isNozzleOnHook: false");
    return false;
  }

  isNozzleOffHook(res: string): boolean {
    debugLog("isNozzleOffHook", arguments);
    const readStatuses = this.processStatus(res);
    if (readStatuses.duStatus["Nozzle"] == "Off Hook") {
      debugLog("isNozzleOffHook: true");
      return true;
    }
    debugLog("isNozzleOffHook: false");
    return false;
  }

  isOnline(res: string): boolean {
    debugLog("isOnline", arguments);
    const readStatuses = this.processStatus(res);
    if (
      readStatuses.duStatus &&
      readStatuses.state &&
      readStatuses.duStatus.Mode === "Remote"
    ) {
      debugLog("isOnline: true");
      return true;
    }
    debugLog("isOnline: false");
    return false;
  }

  isPresetAvailable(): boolean {
    debugLog("isPresetAvailable");
    return true;
  }

  isNozzleCheckRequired() {
    debugLog("isNozzleCheckRequired");
    return true;
  }

  isPresetVerified(res: string, quantity: number) {
    const presetValue = this.processReadPreset(res);
    if (quantity == presetValue) {
      debugLog("isPresetVerified: true");
      return true;
    }
    debugLog("isPresetVerified: false");
    return false;
  }

  isDispensing(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Fueling") {
      debugLog("isDispensing: true");
      return true;
    }
    debugLog("isDispensing: false");
    return false;
  }

  isIdle(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Idle") {
      debugLog("isIdle: true");
      return true;
    }
    debugLog("isIdle: false");
    return false;
  }

  isSaleCloseable(res: string) {
    debugLog("isSaleCloseable", arguments);
    const dispenserStatus = this.processStatus(res);
    if (
      dispenserStatus["duStatus"]["Nozzle"] === "On Hook" &&
      dispenserStatus["state"] === "Payable"
    ) {
      debugLog("isSaleCloseable: true");
      return true;
    }
    debugLog("isSaleCloseable: false");
    return false;
  }

  isOrderComplete(res: string, quantity: number) {
    debugLog("isOrderComplete Arguments", arguments);
    const readsale = this.toFixedNumber(
      parseFloat(this.processReadSale(res).volume),
      2
    );
    if (readsale >= quantity) {
      var returnObj = {
        status: true,
        percentage: this.toFixedNumber((readsale / quantity) * 100.0, 2),
        currentFlowRate: this.processFlowRate(res),
        averageFlowRate: this.processAverageFlowRate(res),
        batchNumber: this.processBatchNumber(res),
        dispensedQty: this.toFixedNumber(readsale, 2),
      };
      debugLog("isOrderComplete: ", returnObj);
      return returnObj;
    }
    var returnObj = {
      status: false,
      percentage: this.toFixedNumber((readsale / quantity) * 100.0, 2),
      currentFlowRate: this.processFlowRate(res),
      averageFlowRate: this.processAverageFlowRate(res),
      batchNumber: this.processBatchNumber(res),
      dispensedQty: this.toFixedNumber(readsale, 2),
    };

    debugLog("isOrderComplete: ", returnObj);
    return returnObj;
  }
}

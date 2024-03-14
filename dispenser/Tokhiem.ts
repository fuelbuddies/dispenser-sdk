import { BaseDispenser } from "./BaseDispenser";

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
        await this.connection.write(this.totalizerBuffer);
    }
    async authorizeSale() {
        await this.connection.write(this.authorize);
    }
    
    async readPreset() {
        await this.connection.write(this.read_preset);
    }
    
    async suspendDispencer() {
        await this.connection.write(this.suspend_sale);
    }
    
    async clearSale() {
        await this.connection.write(this.clear_sale);
    }
    
    async readSale() {
        await this.connection.write(this.tokhim_read_sale);
    }
    
    async readAuth() {
        await this.connection.write(this.tokhim_status);
    }
    
    async cancelPreset() {
        await this.connection.write(this.cancel_preset);
    }
    
    async resumeDispencer() {
        await this.connection.write(this.resume_sale);
    }
    
    async pumpStop() {
        await this.connection.write(this.pump_stop);
    }
    
    async pumpStart() {
        await this.connection.write(this.pump_start);
    }

    async printReciept(receiptMessage) {}
    
    getType() {
        return 'TOKHIEM';
    }
    
    getExternalPump() {
        return "false";
    }
    
    async switchMode(online=true) {
        if(online) {
            // for switching to online pump_start is recommended that is happening already in future flow
            await this.pumpStart();
        }
        
        await this.connection.write(this.tokhim_authorize_off);
    }
    
    async readDispencerStatus() {
        await this.connection.write(this.tokhim_status);
    }
    
    async sendPreset(quantity: number) {
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
        console.log("volume sent", volume);
        await this.connection.write(volume);
    }


  async switchToRemote() {
    await this.switchMode(true);
  }

  checkType() {
    return this.getType();
  }

  async switchToLocal() {
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
    await this.readDispencerStatus();
  }

  async readAuthorization() {
    await this.readDispencerStatus();
  }

  async startPump() {
    await this.pumpStart();
  }

  async stopPump() {
    await this.pumpStop();
  }

  async setPreset(quantity: number) {
    await this.sendPreset(quantity);
  }

  async suspendSale() {
    await this.suspendDispencer();
  }

  async resumeSale() {
    await this.resumeDispencer();
  }

  hasExternalPump() {
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

  printReceipt(printObj: any) {
    this.debugLog("printReceipt", printObj);
    // this.connection.send("Print_Receipt");
  }

  processStatus(res: string) {
    console.log("processStatus", arguments);
    const statusSplit = res.split("7f");
    const statusString = this.cutStringFromLast(statusSplit[0], 4, true);
    const hexStatus1 = this.cutStringFromLast(statusString, 2, true);
    const hexStatus0 = this.cutStringFromLast(statusString, 2, false);

    const ret = {
      duStatus: this.processStatusZero(hexStatus0.toString()),
      state: this.processStatusOne(hexStatus1.toString()),
    };

    return ret;
  }

  processElockStatus(status: string) {
    const statuses: any = {
      Position: ["Unlocked", "Locked"],
      Tank1Cup: ["Unlocked", "Locked"],
      Tank1Handle: ["Unlocked", "Locked"],
      Tank2Cup: ["Unlocked", "Locked"],
      Tank2Handle: ["Unlocked", "Locked"],
    };

    return this.processStatusMappingRaw(status.split(""), statuses);
  }

  processStatusMapping(status: string, statuses: any) {
    const statusCodes = this.hex2bin(status).split("").reverse();
    return this.processStatusMappingRaw(statusCodes, statuses);
  }

  processStatusMappingRaw(statusCodes: any, statuses: any) {
    const statistics: any = Object.keys(statuses).map(function (key, index) {
      return [key, statuses[key][statusCodes[index]]];
    });

    return statistics.reduce(function (acc: any, cur: any) {
      acc[cur[0]] = cur[1];
      return acc;
    }, {});
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

    return this.processStatusMapping(status, statuses);
  }

  processStatusOne(status: string) {
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
    console.log('processCommand', arguments);
    if (!res.includes("59")) {
      throw Error("Command failed! check for status");
    }
    return true;
  }

  processReadSale(res: string) {
    const responseCodedArray = res.split("2e"); //not sure about this, (ideal packet must look like '3333333333236540')
    return {
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
      density: "", //@TODO fix me
    };
  }

  /**
   * process totalizer string value.
   * @param res string
   * @returns
   */
  processTotalizer(res: string) {
    return this.processResponse(res.split("2e"), 16, 4);
  }

  processTotalizerWithBatch(res: string) {
    return {
      totalizer: this.processTotalizer(res),
      batchNumber: this.processBatchNumber(res) + 1, // called before pump start.. so +1
    };
  }

  processReadPreset(res: string) {
    console.log("processReadPreset", arguments);
    if (res.includes("4e"))
      throw new Error("Preset read command failed! please check");

    return this.processResponse(res.split("2e"), 14, 4);
  }

  processFlowRate(res: string) {
    this.debugLog("processFlowRate", res);
    // const response = parseInt(this.hex2a(res.slice(-82, -70)));
    // this.debugLog("processFlowRate", JSON.stringify(response));
    return 0;
  }

  processAverageFlowRate(res: string) {
    this.debugLog("processAverageFlowRate", res);
    // const response = parseInt(this.hex2a(res.slice(-70, -58)));
    // this.debugLog("processAverageFlowRate", JSON.stringify(response));
    return 0;
  }

  processBatchNumber(res: string) {
    this.debugLog("processBatchNumber", res);
    // const response = parseInt(this.hex2a(res.slice(-58, -46)));
    // this.debugLog("processBatchNumber", JSON.stringify(0));
    return 0;
  }

  processResponseRaw(
    response: string[],
    exponentCut: number,
    mantessaCut: number
  ) {
    if (response.length < 2) {
      throw new Error("Incompatible response");
    }

    const exponent = this.hex2a(
      this.cutStringFromLast(response[0], exponentCut, true)
    );
    const mantessa = this.hex2a(
      this.cutStringFromLast(response[1], mantessaCut, false)
    );
    return `${exponent}.${mantessa}`;
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
    return parseFloat(
      this.processResponseRaw(response, exponentCut, mantessaCut)
    );
  }

  hasChecksBeforePumpStart() {
    return true;
  }

  isPumpStopped(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Stopped") {
      return true;
    }
    return false;
  }

  isReadyForPreset(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Idle") {
      return true;
    }
    return false;
  }

  isNozzleOnHook(res: string): boolean {
    const readStatuses = this.processStatus(res);
    return readStatuses.duStatus["Nozzle"] == "On Hook";
  }

  isNozzleOffHook(res: string): boolean {
    const readStatuses = this.processStatus(res);
    return readStatuses.duStatus["Nozzle"] == "Off Hook";
  }

  isOnline(res: string): boolean {
    const readStatuses = this.processStatus(res);
    if (
      readStatuses.duStatus &&
      readStatuses.state &&
      readStatuses.duStatus.Mode === "Remote"
    ) {
      return true;
    }
    return false;
  }

  isPresetVerified(res: string, quantity: number) {
    const presetValue = this.processReadPreset(res);
    if (quantity == presetValue) {
      return true;
    }
    return false;
  }

  isDispensing(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Fueling") {
      return true;
    }
    return false;
  }

  isIdle(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus["state"] === "Idle") {
      return true;
    }
    return false;
  }

  isSaleCloseable(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (
      dispenserStatus["duStatus"]["Nozzle"] === "On Hook" &&
      dispenserStatus["state"] === "Payable"
    ) {
      return true;
    }
    return false;
  }

  isOrderComplete(res: string, quantity: number) {
    const readsale = this.toFixedNumber(
      parseFloat(this.processReadSale(res).volume),
      2
    );
    if (readsale >= quantity) {
      return {
        status: true,
        percentage: this.toFixedNumber((readsale / quantity) * 100.0, 2),
        currentFlowRate: this.processFlowRate(res),
        averageFlowRate: this.processAverageFlowRate(res),
        batchNumber: this.processBatchNumber(res),
        dispensedQty: this.toFixedNumber(readsale, 2),
      };
    }
    return {
      status: false,
      percentage: this.toFixedNumber((readsale / quantity) * 100.0, 2),
      currentFlowRate: this.processFlowRate(res),
      averageFlowRate: this.processAverageFlowRate(res),
      batchNumber: this.processBatchNumber(res),
      dispensedQty: this.toFixedNumber(readsale, 2),
    };
  }
}

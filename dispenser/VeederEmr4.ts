import debug from "debug";
import { BaseDispenser } from "./base/BaseDispenser";

const debugLog = debug("dispenser:veederEmr4");
export class VeederEmr4 extends BaseDispenser {
  private deliveryStatus: string[] = [
    "Delivery Error",
    "Delivery Completed",
    "ATC Is Active",
    "Reserved",
    "Net Preset Is Active",
    "Delivery Is Active",
    "Flow Is Active",
    "Delivery Ticket Is Pending",
    "Waiting For Authorization",
    "Delivery End Request",
    "Pause Delivery Request",
    "No Flow Stop",
    "Preset Stop",
    "Preset Error",
    "Pulser Encoder Error",
    "ATC Error",
  ];

  // checkType() {
  //   this.connection.send("Dispenser");
  // }

  // switchToRemote() {
  //   this.connection.send("Go_Remote");
  // }

  // switchToLocal() {
  //   this.connection.send("Go_Local");
  // }

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

  // totalizer() {
  //   this.connection.send("Totalizer");
  // }

  // readStatus() {
  //   this.connection.send("Read_Status");
  // }

  // startPump() {
  //   this.connection.send("Pump_Start");
  // }

  // stopPump() {
  //   this.connection.send("Pump_Stop");
  // }

  // authorizeSale() {
  //   this.connection.send("Authorize");
  // }

  // setPreset(quantity: number) {
  //   this.connection.send(`Preset_QTY=${quantity}`);
  // }

  // readPreset() {
  //   this.connection.send("Read_Preset");
  // }

  // cancelPreset() {
  //   this.connection.send("Cancel_Preset");
  // }

  // readSale() {
  //   this.connection.send("Read_Sale");
  // }

  // suspendSale() {
  //   this.connection.send("Suspend_Sale");
  // }

  // resumeSale() {
  //   this.connection.send("Resume_Sale");
  // }

  // clearSale() {
  //   this.connection.send("Clear_Sale");
  // }

  // hasExternalPump() {
  //   this.connection.send("External_Pump");
  // }

  // readExternalPumpStatus() {
  //   this.connection.send("External_Pump_Status");
  // }

  // startExternalPump() {
  //   this.connection.send("External_Pump_Start");
  // }

  // stopExternalPump() {
  //   this.connection.send("External_Pump_Stop");
  // }

  // readAuthorization() {
  //   this.connection.send("Read_Authorization");
  // }

  printReceipt(printObj: any) {
    debugLog("printReceipt: %s", printObj);
    // this.connection.send("Print_Receipt");
  }

  interpolateHex(originalString: string) {
    const hexArray = originalString.match(/.{1,2}/g);

    if (hexArray) {
      return hexArray.reverse().join("");
    }

    return "";
  }

  processStatus(res: string) {
    const statusString = parseInt(
      this.interpolateHex(res.substring(10).slice(0, -4)),
      16
    );
    if (isNaN(statusString)) {
      throw new Error("Unknow Status");
    }

    const binaryStatus = this.decimalToBinaryTwosComplement(statusString, 16);
    const ret = new Map();
    for (let i = 0; i < binaryStatus.length; i++) {
      ret.set(this.deliveryStatus[i], Boolean(parseInt(binaryStatus[i])));
    }

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

  processCommand(res: string) {
    if (res.includes("7eff014100bf7e")) {
      return true;
    } else {
      throw Error("Command failed! check for status");
    }
  }

  processReadSale(res: string) {
    return {
      unitPrice: 0.0, //this.processResponseRaw([responseCodedArray[0],responseCodedArray[1]], 4, 6),
      volume: this.processNumericResponse(res.substring(9).slice(0, -4)), // cut front 9 char and last 4 chars
      amount: 0.0, //this.processResponseRaw([responseCodedArray[2],responseCodedArray[3]], 10, 2),
      density: "", //@TODO fix me
    };
  }

  /**
   * process totalizer string value.
   * @param res string
   * @returns
   */
  processTotalizer(res: string) {
    return this.processResponse(res.split("2e"), 14, 4);
  }

  processTotalizerWithBatch(res: string) {
    return {
      totalizer: this.processTotalizer(res),
      batchNumber: this.processBatchNumber(res) + 1,  // called before pump start.. so +1
    };
  }

  processReadPreset(res: string) {
    // if(res.includes('4e')) throw new Error("Preset read command failed! please check");

    return this.processFloatResponse(res.split("7e")[1]);
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

  processNumericResponse(response: string) {
    const hexStringArray = ("0000000000000000" + response)
      .slice(-16)
      .match(/.{1,2}/g);
    if (!hexStringArray) return 0;
    return this.hexToNumber(hexStringArray.reverse().join(""));
  }

  processFloatResponse(response: string) {
    const volumeHex = this.cutStringFromLast(
      this.interpolateHex(this.cutStringFromLast(response, 10, true)),
      8,
      true
    );

    return this.hexToFloat(volumeHex);
  }

  processResponseRaw(
    response: string[],
    exponentCut: number,
    mantessaCut: number
  ) {
    const exponent = this.hex2a(
      this.cutStringFromLast(response[0], exponentCut, true)
    );
    let mantessa = "0";
    if (response.length > 1)
      mantessa = this.hex2a(
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

  isPumpStopped(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus.get("Flow Is Active")) {
      return true;
    }
    return false;
  }

  isReadyForPreset(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (!dispenserStatus.get("Delivery Is Active")) {
      return true;
    }
    return false;
  }

  hasChecksBeforePumpStart() {
    return false;
  }

  isNozzleOnHook(): boolean {
    return true;
  }

  isNozzleOffHook(): boolean {
    return true;
  }

  isOnline(res: string): boolean {
    return res.substring(10).slice(0, -4) == "01";
  }

  isPresetAvailable(): boolean {
    return true;
  }

  isNozzleCheckRequiredBeforeAuthorize() {
    return false;
  }

  isNozzleCheckRequiredBeforeClearSale() {
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
    if (dispenserStatus.get("Delivery Is Active")) {
      return true;
    }
    return false;
  }

  isIdle(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus.get("Delivery Completed")) {
      return true;
    }
    return false;
  }

  isSaleCloseable(res: string) {
    const dispenserStatus = this.processStatus(res);
    if (dispenserStatus.get("Net Preset Is Active")) {
      return true;
    }
    return false;
  }

  isOrderComplete(res: string, quantity: number) {
    const readsale = this.processReadSale(res).volume;
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

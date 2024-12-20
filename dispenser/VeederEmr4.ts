import debug from "debug";
import { BaseDispenser } from "./base/BaseDispenser";

const debugLog = debug("dispenser:veederEmr4");
export class VeederEmr4 extends BaseDispenser {
  private veeder_start             = Buffer.from([0x7E, 0x01, 0xFF, 0x53, 0x75, 0x00, 0x38, 0x7E]);
  private veeder_mode              = Buffer.from([0x7E, 0x01, 0xFF, 0x53, 0x75, 0x02, 0x36, 0x7E]);
  private veeder_finish            = Buffer.from([0x7E, 0x01, 0xFF, 0x53, 0x75, 0x01, 0x37, 0x7E]);
  private veeder_totalizer         = Buffer.from([0x7E, 0x01, 0xFF, 0x47, 0x6C, 0x4D, 0x7E]);
  private veeder_status            = Buffer.from([0x7E, 0x01, 0xFF, 0x54, 0x03, 0xA9, 0x7E]);
  private veeder_read_volume       = Buffer.from([0x7E, 0x01, 0xFF, 0x47, 0x6B, 0x4E, 0x7E]);
  private veeder_read_preset       = Buffer.from([0x7E, 0x01, 0xFF, 0x47, 0x6E, 0x4B, 0x7E]);
  private veeder_reset             = Buffer.from([0x7E, 0x01, 0xFF, 0x52, 0x00, 0xAE, 0x7E]);
  private veeder_preset            = Buffer.from([0x7E, 0x01, 0xFF, 0x53, 0x75, 0x03, 0x35, 0x7E]);
  private veeder_authorize_on      = Buffer.from([0x7E, 0x01, 0xFF, 0x44, 0x25, 0x01, 0x96, 0x7E]);
  private veeder_authorize_off     = Buffer.from([0x7E, 0x01, 0xFF, 0x44, 0x25, 0x00, 0x97, 0x7E]);
  private veeder_show_preset       = Buffer.from([0x7E, 0x01, 0xFF, 0x53, 0x75, 0x03, 0x35, 0x7E]);
  private veeder_emr_state         = Buffer.from([0x7E, 0x01, 0xFF, 0x54, 0x08, 0xA4, 0x7E]);
  private veeder_pause             = Buffer.from([0x7E, 0x01, 0xFF, 0x4F, 0x02, 0xAF, 0x7E]);
  private veeder_resume            = Buffer.from([0x7E, 0x01, 0xFF, 0x4F, 0x01, 0x00, 0xB0, 0x7E]);
  private veeder_read_sale         = Buffer.from([0x7E, 0x01, 0xFF, 0x47, 0x4B, 0x6E, 0x7E]);
  private veeder_get_authorization = Buffer.from([0x7E, 0x01, 0xFF, 0x54, 0x05, 0xA7, 0x7E]);
  private veeder_emr_status        = Buffer.from([0x7E, 0x01, 0xFF, 0x47, 0x4B, 0x6F, 0x7E]);
  private veeder_end_delivery      = Buffer.from([0x7E, 0x01, 0xFF, 0x4F, 0x03, 0xAE, 0x7E]);
  private veeder_delivery_auth     = Buffer.from([0x7E, 0x01, 0xFF, 0x4F, 0x06, 0x01, 0xAA, 0x7E]);

  
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

  getType() {
    return 'VEEDER_EMR4';
  }

  processCommand(res: string) {
    debugLog("processCommand: %s", res);
    if (res.includes("7eff014100bf7e")) {
      debugLog("processCommand: Command successful");
      return true;
    }

    throw Error("Command failed! check for status");
  }


  checkType() {
    debugLog("checkType");
    return this.getType();
  }

  async switchToRemote() {
    await this.connection.write(this.veeder_authorize_on);
    return await this.dispenserResponse();
  }

  async switchToLocal() {
    await this.connection.write(this.veeder_authorize_off);
    return await this.dispenserResponse();
  }

  async totalizer() {
    await this.connection.write(this.veeder_totalizer);
    return await this.dispenserResponse();
  }

  async readStatus() {
    await this.connection.write(this.veeder_status);
    return await this.dispenserResponse();
  }

  pumpStart() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.connection.write(this.veeder_delivery_auth);
        const response = await this.dispenserResponse();
        debugLog("pumpStart response: %s", response);
        if(response.includes("7eff014100bf7e")) {
          this.executeShellScriptAndCheck('scripts/EMR4/startpump.sh').then((result) => {
            debugLog("pumpStart result: %s", result);

            if (result) {
              debugLog("pumpStart result: %s", "7eff014100bf7e");
              return resolve("7eff014100bf7e");
            }

            debugLog("pumpStart result: %s", "Command failed!");
            return reject("Command failed!");

          });
        } else {
          return reject(response);
        }
      } catch (error) {
        debugLog("pumpStart error: %s", error);
        return reject("Command failed!");
      }
    });
  }

  async pumpStop() {
    try {
      const result = await this.executeShellScriptAndCheck('scripts/EMR4/stoppump.sh');
      debugLog("pumpStop result: %s", result);

      if (result) {
        return "7eff014100bf7e";
      }

      return "Command failed!";
    } catch (error) {
      debugLog("pumpStop error: %s", error);
      return "Command failed!";
    }
  }

  async authorizeSale() {
    await this.connection.write(this.veeder_start);
    return await this.dispenserResponse();
  }

  async readPreset() {
    await this.connection.write(this.veeder_read_preset);
    return await this.dispenserResponse();
  }

  async cancelPreset() {
    await this.connection.write(this.veeder_reset);
    return await this.dispenserResponse();
  }

  async readSale() {
    await this.connection.write(this.veeder_read_sale);
    return await this.dispenserResponse();
  }

  async suspendSale() {
    await this.connection.write(this.veeder_pause);
    return await this.dispenserResponse();
  }

  async resumeSale() {
    await this.connection.write(this.veeder_resume);
    return await this.dispenserResponse();
  }

  async clearSale() {
    await this.connection.write(this.veeder_end_delivery);
    await this.connection.write(this.veeder_reset);
    return await this.dispenserResponse();
  }

  async readAuthorization() {
    await this.connection.write(this.veeder_get_authorization);
    return await this.dispenserResponse();
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
      timestamp: new Date().getTime(),
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

  hasChecksBeforePumpStart(res: string) {
    debugLog("hasChecksBeforePumpStart: %s", res);
    const dispenserStatus = this.processStatus(res);
    debugLog("hasChecksBeforePumpStart: %s", dispenserStatus);
    return false;
  }

  isNozzleOnHook(res: string): boolean {
    debugLog("isNozzleOnHook: %s", res);
    const dispenserStatus = this.processStatus(res);
    debugLog("isNozzleOnHook: %s", dispenserStatus);
    return true;
  }

  isNozzleOffHook(res: string): boolean {
    debugLog("isNozzleOffHook: %s", res);
    const dispenserStatus = this.processStatus(res);
    debugLog("isNozzleOffHook: %s", dispenserStatus);
    return true;
  }

  isOnline(res: string): boolean {
    debugLog("isOnline: %s", res);
    const dispenserStatus = this.processStatus(res);
    debugLog("isOnline: %s", dispenserStatus);
    return res.substring(10).slice(0, -4) == "01";
  }

  isPresetAvailable(res: string): boolean {
    debugLog("isPresetAvailable: %s", res);
    const dispenserStatus = this.processStatus(res);
    debugLog("isPresetAvailable: %s", dispenserStatus);
    return true;
  }

  isNozzleCheckRequired(res: string) {
    debugLog("isNozzleCheckRequired: %s", res);
    const dispenserStatus = this.processStatus(res);
    debugLog("isNozzleCheckRequired: %s", dispenserStatus);
    return false;
  }

  isPresetVerified(res: string, quantity: number) {
    const presetValue = this.processReadPreset(res);
    debugLog("isPresetVerified: %s", presetValue);
    if (quantity == presetValue) {
      return true;
    }
    return false;
  }

  isDispensing(res: string) {
    const dispenserStatus = this.processStatus(res);
    debugLog("isDispensing: %s", dispenserStatus);
    if (dispenserStatus.get("Delivery Is Active")) {
      return true;
    }
    return false;
  }

  isIdle(res: string) {
    const dispenserStatus = this.processStatus(res);
    debugLog("isIdle: %s", dispenserStatus);
    if (dispenserStatus.get("Delivery Completed")) {
      return true;
    }
    return false;
  }

  isSaleCloseable(res: string) {
    const dispenserStatus = this.processStatus(res);
    debugLog("isSaleCloseable: %s", dispenserStatus);
    if (dispenserStatus.get("Net Preset Is Active")) {
      return true;
    }
    return false;
  }

  /**
   * we can install a printer on this dispenser. but it's not installed.
   * @returns false
   */
  isPrinterAvailable(res: string) {
    debugLog("isPrinterAvailable: %s", res);
    debugLog("isPrinterAvailable: %s", "false");
    return false;
  }

  isOrderComplete(res: string, quantity: number) {
    const readsale = this.processReadSale(res).volume;
    debugLog("isOrderComplete: %s", readsale);
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

  async setPreset(quantity: number) {
    debugLog("setPreset: %s", quantity);
    return await this.sendPreset(quantity);
  }

  calculateChecksum(headerBytes: any, messageBytes: any) {
    // Add all header and message bytes
    let checksum = headerBytes.reduce((sum: any, byte: any) => sum + byte, 0);
    checksum += messageBytes.reduce((sum: any, byte: any) => sum + byte, 0);

    // Two's complement (invert and add 1)
    checksum = ~checksum + 1;
    return checksum & 0xFF; // Ensure it's 8-bit
  }

  async sendPreset(veederPre: number) {
    // Header bytes as per protocol
    const START_BYTE = 0x7E;
    const HEADER_BYTES = [0x01, 0xFF, 0x53, 0x6E];

    // Convert the float to its 4-byte representation
    const messageBytes = Buffer.alloc(4);
    messageBytes.writeFloatLE(veederPre);

    // Calculate checksum
    const checksum = this.calculateChecksum(HEADER_BYTES, [...messageBytes]);

    // Construct the full message
    const fullMessage = [
      START_BYTE,
      ...HEADER_BYTES,
      ...messageBytes,
      checksum,
      START_BYTE,
    ];

    debugLog("sendPreset: %s", fullMessage.map(byte => byte.toString(16).padStart(2, '0')).join(' '));
    // Write all bytes to the connection at once
    this.connection.write(Buffer.from(fullMessage));
    return await this.dispenserResponse();
  }
}

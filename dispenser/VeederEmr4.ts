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

  checkType() {
    debugLog("checkType");
    return this.getType();
  }

  async switchToRemote() {
    return await this.connection.write(this.veeder_authorize_on);
  }

  async switchToLocal() {
    return await this.connection.write(this.veeder_authorize_off);
  }

  async totalizer() {
    return await this.connection.write(this.veeder_totalizer);
  }

  async readStatus() {
    return await this.connection.write(this.veeder_status);
  }

  async pumpStart() {
    const result = await this.executeShellScriptAndCheck('scripts/EMR4/startpump.sh');
    debugLog("pumpStart result: %s", result);

    if (result) {
      return "7eff014100bf7e";
    }

    return "Command failed!";
  }

  async pumpStop() {
    const result = await this.executeShellScriptAndCheck('scripts/EMR4/stoppump.sh');
    debugLog("pumpStop result: %s", result);

    if (result) {
      return "7eff014100bf7e";
    }

    return "Command failed!";
  }

  async authorizeSale() {
    return await this.connection.write(this.veeder_start);
  }

  async readPreset() {
    return await this.connection.write(this.veeder_read_preset);
  }

  async cancelPreset() {
    return await this.connection.write(this.veeder_reset);
  }

  async readSale() {
    return await this.connection.write(this.veeder_read_sale);
  }

  async suspendSale() {
    return await this.connection.write(this.veeder_pause);
  }

  async resumeSale() {
    return await this.connection.write(this.veeder_resume);
  }

  async clearSale() {
    await this.connection.write(this.veeder_reset);
    return this.connection.write(this.veeder_finish);
  }

  async readAuthorization() {
    return await this.connection.write(this.veeder_get_authorization);
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

  isNozzleCheckRequired() {
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

  /**
   * we can install a printer on this dispenser. but it's not installed.
   * @returns false
   */
  isPrinterAvailable() {
    debugLog("isPrinterAvailable: %s", "false");
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

  async setPreset(quantity: number) {
    debugLog("setPreset", quantity);
    await this.sendPreset(quantity);
  }

  async sendPreset(quantity: number) {
    const message = new Array(8).fill(0);
    const veederPreBuffer = new DataView(new ArrayBuffer(4));
    veederPreBuffer.setFloat32(0, quantity, true); // Store the float in little-endian format

    const AA = 0x7E;
    const BB = 0x01;
    const CC = 0xFF;
    const DD = 0x53;
    const EE = 0x6E;

    // Write the static part of the message
    this.connection.write(Buffer.from([AA, BB, CC, DD, EE]));

    // Write the floating-point value byte by byte
    for (let i = 0; i < 4; i++) {
        const byte = veederPreBuffer.getUint8(i);
        if (byte === 0) {
            this.connection.write(Buffer.from([0x00]));
        } else {
            this.connection.write(Buffer.from([byte]));
        }
        message[7 - i] = byte; // Reverse order to mimic the original C++ logic
    }

    // Calculate checksum
    let BCC = BB + CC + DD + EE + message.reduce((sum, byte) => sum + byte, 0);
    BCC = (BCC ^ 0xFF);
    const checksum = BCC + 0x01;

    if (checksum < 10) {
        this.connection.write(Buffer.from([0x00, checksum]));
    } else {
        this.connection.write(Buffer.from([checksum]));
    }

    // Write the final byte
    return this.connection.write(Buffer.from([AA]));
  }
}

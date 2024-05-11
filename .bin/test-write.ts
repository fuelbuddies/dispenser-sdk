#!/usr/bin/env ts-node

import ModbusRTU from "modbus-serial";

const timeout = 1000;
const baudRate = 9600;
const address = '/dev/ttyUSB1';
const deviceId = 1;

var overflowRegister = 8;
var overflowCount = 0;

async function run() {
    const client = new ModbusRTU();
    client.setID(deviceId);
    client.setTimeout(timeout);
    await client.connectRTUBuffered(address, { baudRate: baudRate });
    console.log("Connected to Seneca");
    await client.readHoldingRegisters(overflowRegister, 1).then((data) => {
        console.log("Overflow Register: ", data.buffer.readUInt16BE(0));
    });
    const writeRegister = await client.writeRegister(overflowRegister, ++overflowCount);
    console.log("writeRegister" ,writeRegister);
    console.log("Incremented Overflow Register");
    await client.readHoldingRegisters(overflowRegister, 1).then((data) => {
        console.log("Overflow Register: ", data.buffer.readUInt16BE(0));
    });
}

run();
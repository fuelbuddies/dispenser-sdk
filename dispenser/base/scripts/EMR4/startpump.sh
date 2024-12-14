#!/usr/bin/env bash

set -e

SCRIPT_PATH=$(dirname "$0")

pumpPin=${VITE_MAIN_DISPENSER_PUMP_PIN:-22}

pinctrl set ${pumpPin} op dl

# Run the command and capture its output
${SCRIPT_PATH}/pumpstatus.sh lo
#!/usr/bin/env bash

set -e

SCRIPT_PATH=$(dirname "$0")

pumpPin=${VITE_MAIN_DISPENSER_PUMP_PIN:-22}

pinctrl set ${pumpPin} op dh

${SCRIPT_PATH}/pumpstatus.sh hi
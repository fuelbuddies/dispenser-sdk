#!/usr/bin/env bash

set -e

SCRIPT_PATH=$(dirname "$0")

pumpPin=${VITE_MAIN_DISPENSER_PUMP_PIN:-22}

# function for checking pump status
function pumpstatus() {
    # Run the command and capture its output
    pin_state=$(pinctrl get ${pumpPin})

    # Check if the pin state contains "hi"
    if [[ $pin_state == *"$1"* ]]; then
        echo "true"
    else
        echo "false"
    fi
}


pinctrl set ${pumpPin} op dh

pumpstatus hi
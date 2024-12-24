#!/usr/bin/env bash

set -e

pumpPin=${VITE_MAIN_DISPENSER_PUMP_PIN:-22}

# Run the command and capture its output
pin_state=$(pinctrl get ${pumpPin})

# Check if the pin state contains "hi"
if [[ $pin_state == *"$1"* ]]; then
    echo "true"
else
    echo "false"
fi
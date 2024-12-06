#!/usr/bin/env bash

set -e

pumpPin=${VITE_MAIN_DISPENSER_PUMP_PIN:-22}

pinctrl set ${pumpPin} op dh

# Run the command and capture its output
pin_state=$(pinctrl get ${authPin})

# Check if the pin state contains "hi"
if [[ $pin_state == *"lo"* ]]; then
    echo "true"
else
    echo "false"
fi
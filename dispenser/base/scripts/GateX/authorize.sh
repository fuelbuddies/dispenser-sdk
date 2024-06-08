#!/usr/bin/env bash

set -e

authPin=${VITE_MAIN_DISPENSER_AUTHORIZATION_PIN:-26}

pinctrl set ${authPin} op dh

# Run the command and capture its output
pin_state=$(pinctrl get ${authPin})

# Check if the pin state contains "hi"
if [[ $pin_state == *"hi"* ]]; then
    echo "true"
else
    echo "false"
fi
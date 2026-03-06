#!/usr/bin/env bash

set -e

authPin=${VITE_MAIN_DISPENSER_AUTHORIZATION_PIN: 26}

# Run the command and capture its output
pinctrl set 26 ip

pin_state=$(pinctrl get 26)

# Check if the pin state contains "lo" or "hi"
if [[ $pin_state == *"lo"* ]]; then
    echo "false"
else if [[ $pin_state == *"hi"* ]]; then
    echo "true"
fi

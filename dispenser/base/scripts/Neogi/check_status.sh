#!/usr/bin/env bash

set -e

authPin=${VITE_MAIN_DISPENSER_AUTHORIZATION_PIN: 26}

# Run the command and capture its output
pinctrl set 26 ip

pin_state=$(pinctrl get 26)

# Check if the pin state contains "lo"
if [[ $pin_state == *"lo"* ]]; then
    echo "OFF_HOOK"
else if [[ $pin_state == *"hi"* ]]; then
    echo "ON HOOK"
fi

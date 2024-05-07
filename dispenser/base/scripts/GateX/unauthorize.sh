#!/usr/bin/env bash

set -e

pinctrl set 26 op dl

# Run the command and capture its output
pin_state=$(pinctrl get 26)

# Check if the pin state contains "hi"
if [[ $pin_state == *"lo"* ]]; then
    echo "true"
else
    echo "false"
fi

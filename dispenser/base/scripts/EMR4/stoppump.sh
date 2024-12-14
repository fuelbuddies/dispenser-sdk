#!/usr/bin/env bash

set -e

pumpPin=${VITE_MAIN_DISPENSER_PUMP_PIN:-22}

pinctrl set ${pumpPin} op dh

./pumpstatus.sh hi
#!/bin/bash
# Drives the asciinema recording for the hero terminal (run via record-cast.sh):
# a typed prompt, a real `cosmos build`, then `cosmos run --headless` with
# live UART output, killed after a few seconds of scheduler ticks.
set -u
cd "$HOME/HelloWorld"

PROMPT=$'\033[1;32mcosmos@gen3\033[0m:\033[1;34m~/HelloWorld\033[0m$ '

type_cmd() {
    printf '%b' "$PROMPT"
    local cmd="$1"
    for ((i = 0; i < ${#cmd}; i++)); do
        printf '%s' "${cmd:$i:1}"
        sleep 0.055
    done
    sleep 0.35
    printf '\n'
}

type_cmd "cosmos build"
cosmos build

sleep 0.6
# stdin must NOT be the asciinema pty: QEMU's stdio chardev wedges on it and
# the guest never produces serial output. /dev/null keeps the capture flowing.
type_cmd "cosmos run --headless"
timeout 8 cosmos run --headless </dev/null
exit 0

#!/bin/bash
# Re-records the hero terminal cast (public/assets/cosmos-build-run.cast).
#
# Needs: asciinema (pip install asciinema), the cosmos CLI, and a demo project
# at ~/HelloWorld (create once with `cosmos new HelloWorld` in $HOME).
# The demo project's build outputs are wiped first so the recorded build is a
# real compile; compress-cast.py then shrinks it to a ~6s segment.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf "$HOME/HelloWorld/bin" "$HOME/HelloWorld/obj" "$HOME/HelloWorld/output-x64"

raw=$(mktemp --suffix=.cast)
trap 'rm -f "$raw"' EXIT
TERM=xterm-256color asciinema rec --cols 100 --rows 20 -i 2 -q --overwrite \
    -c "bash scripts/record-cast-driver.sh" "$raw" </dev/null
python3 scripts/compress-cast.py "$raw" public/assets/cosmos-build-run.cast

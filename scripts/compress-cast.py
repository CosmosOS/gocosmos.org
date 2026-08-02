#!/usr/bin/env python3
"""Compress the raw cosmos build/run recording into a short hero-loop cast.

Segments (found by markers, not fixed indices):
  1. prompt + typing `cosmos build`     -> keep real pace
  2. build output                        -> compress to BUILD_TARGET seconds
  3. prompt + typing `cosmos run ...`    -> keep real pace
  4. QEMU launch + UART boot output      -> compress to RUN_TARGET seconds
Tail: everything from the QEMU "terminating on signal" line on is dropped.
"""
import json
import os
import sys

BUILD_TARGET = 6.0
GAP_CAP = 1.0  # max silence between events after scaling
COALESCE = 0.03  # merge output bursts; typed chars (55ms apart) stay separate

src, dst = sys.argv[1], sys.argv[2]

with open(src) as f:
    lines = f.read().splitlines()

header = json.loads(lines[0])
raw = [json.loads(l) for l in lines[1:] if l.strip()]

# The build output and QEMU echo leak the recording user's real $HOME; show
# the generic identity of the cosmos@gen3 prompt instead.
home = os.path.expanduser("~")
raw = [[t, k, d.replace(home, "/home/cosmos") if k == "o" else d]
       for t, k, d in raw]

# QEMU on the pty writes byte-at-a-time (~30k events). Merge bursts, but flush
# at every newline so one event = one line: the site binds the arrow keys to
# the player's step(), which advances exactly one event.
events = []
buf = ""
buf_t = last_t = 0.0


def flush():
    global buf
    if buf:
        events.append([buf_t, "o", buf])
        buf = ""


for t, kind, data in raw:
    if kind != "o":
        flush()
        events.append([t, kind, data])
        continue
    if buf and t - last_t > COALESCE:
        flush()
    if not buf:
        buf_t = t
    buf += data
    last_t = t
    while "\n" in buf:
        cut = buf.index("\n") + 1
        events.append([buf_t, "o", buf[:cut]])
        buf = buf[cut:]
        buf_t = t
flush()

# Drop the kill-message tail.
cut = next((i for i, e in enumerate(events)
            if "terminating on signal" in e[2] or "Terminated" in e[2]), None)
if cut is not None:
    events = events[:cut]

prompts = [i for i, e in enumerate(events) if "cosmos@gen3" in e[2]]
if len(prompts) != 2:
    sys.exit(f"expected 2 prompt events, found {len(prompts)}: {prompts}")


def end_of_typing(start):
    """Index just past the newline that ends the typed command."""
    for i in range(start + 1, len(events)):
        if events[i][2] in ("\r\n", "\n"):
            return i + 1
    sys.exit("no newline after typing")


t1 = end_of_typing(prompts[0])          # end of `cosmos build` typing
p2 = prompts[1]                          # run prompt
t2 = end_of_typing(p2)                   # end of `cosmos run` typing

# Per-event gaps.
gaps = []
prev = 0.0
for e in events:
    gaps.append(e[0] - prev)
    prev = e[0]

segments = [
    (0, t1, None),            # typing build: real pace
    (t1, p2, BUILD_TARGET),   # build output: compress
    (p2, t2, None),           # typing run: real pace
    (t2, len(events), None),  # UART boot: real pace, long silences capped
]

new_gaps = list(gaps)
for start, end, target in segments:
    if end <= start:
        continue
    real = sum(gaps[start:end])
    scale = (target / real) if (target is not None and real > 0) else 1.0
    for i in range(start, end):
        new_gaps[i] = min(gaps[i] * scale, GAP_CAP)

# Small lead-in so the poster frame isn't mid-keystroke.
new_gaps[0] = 0.3

t = 0.0
out = []
for gap, e in zip(new_gaps, events):
    t += gap
    out.append([round(t, 6), e[1], e[2]])

# Chapter markers (asciicast v2 "m" events): shown as dots on the player's
# timeline, and [ / ] jump between them.
labels = {prompts[0]: "cosmos build", p2: "cosmos run"}
banner = next((i for i, e in enumerate(events) if "CosmosOS" in e[2]), None)
if banner is not None:
    labels[banner] = "kernel boot (UART)"

header["idle_time_limit"] = 2.0
with open(dst, "w") as f:
    f.write(json.dumps(header) + "\n")
    for i, e in enumerate(out):
        if i in labels:
            f.write(json.dumps([e[0], "m", labels[i]]) + "\n")
        f.write(json.dumps(e) + "\n")

print(f"events={len(out)} duration={out[-1][0]:.1f}s "
      f"(build seg {sum(new_gaps[t1:p2]):.1f}s, run seg {sum(new_gaps[t2:]):.1f}s)")

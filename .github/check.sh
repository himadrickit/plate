#!/bin/sh
# validate a .plate file: check.sh file.plate
f=$1
[ -s "$f" ] || { echo "empty plate"; exit 1; }
[ "$(wc -c < "$f")" -le 4096 ] || { echo "plate too big"; exit 1; }
grep -qE '^name *=' "$f" || { echo "no name"; exit 1; }
[ "$(grep -c '^cell' "$f")" -le 40 ] || { echo "too many cells"; exit 1; }
grep -qE '^cell *=' "$f" || { echo "no cells"; exit 1; }
if grep -vE '^(#.*|[[:space:]]*|(name|author|category|canvas|gap|radius|bg|bg2|cell) *=[^<>`$]*)$' "$f"; then
  echo "bad line(s) above"; exit 1
fi

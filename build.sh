#!/bin/sh
# pack every .plate into one file so the site needs a single request
find templates community -name '*.plate' | sort | while read -r f; do
  echo "--- $f"
  cat "$f"
  echo
done > plates.bundle

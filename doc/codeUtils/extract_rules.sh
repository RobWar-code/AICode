#!/bin/bash

# Usage: ./extract_rules.sh filename

if [ $# -ne 1 ]; then
    echo "Usage: $0 <file>"
    exit 1
fi

file="$1"

grep -o 'rule: "[^"]*"' "$file" \
    | sed 's/rule: "\(.*\)"/\1/' \
    | sort
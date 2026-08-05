#!/bin/bash
for d in /var/www/domains/*; do
  if [ -d "$d/public_html" ]; then
    echo "Fixing $d"
    shopt -s dotglob
    mv "$d/public_html/"* "$d/" 2>/dev/null || true
    rmdir "$d/public_html" 2>/dev/null || true
  fi
done

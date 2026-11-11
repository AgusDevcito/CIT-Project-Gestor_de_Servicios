#!/usr/bin/env bash
# Generate a self‑signed certificate for local testing.
# Creates ./certs/fullchain.pem and ./certs/privkey.pem.

set -euo pipefail

# Ensure certs directory exists
mkdir -p certs

# Generate key and cert (valid for 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Dept/CN=localhost"

echo "Self‑signed certificate generated in ./certs"

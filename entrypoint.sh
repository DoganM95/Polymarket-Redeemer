#!/bin/sh

expect <<EOF
spawn npm run setup

expect "Enter your Polygon PoS RPC URL"
send "$POLYGON_POS_RPC_URL\r"

expect "Enter your wallet private key"
send "$POLYMARKET_PRIVATE_KEY\r"

expect "Enter your Polymarket proxy wallet address"
send "$POLYMARKET_WALLET_ADDRESS\r"

expect "Enter your Builder API key"
send "$POLYMARKET_BUILDER_API_KEY\r"

expect "Enter your Builder API secret"
send "$POLYMARKET_BUILDER_API_SECRET\r"

expect "Enter your Builder API passphrase"
send "$POLYMARKET_BUILDER_API_PASSPHRASE\r"

expect "Create a password to encrypt your keys"
send "$CREDENTIAL_ENCRYPTION_PASSWORD\r"

expect "Confirm password"
send "$CREDENTIAL_ENCRYPTION_PASSWORD\r"

expect eof
EOF

exec "$@"

# Redeem all open positions

expect <<EOF
spawn npm run redeem

expect "Enter your encryption password"
send "$CREDENTIAL_ENCRYPTION_PASSWORD\r"

expect eof
EOF


# keep container alive
# tail -f /dev/null
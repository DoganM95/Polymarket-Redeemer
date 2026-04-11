# Docker

To redeem positions once, run the container like this. Set the env vars ato the values you would have used in local development during `npm run setup`.

## Windows

```powershell
    docker run -it --rm `
        -e "POLYGON_POS_RPC_URL=https://..." `
        -e "POLYMARKET_PRIVATE_KEY=..." `
        -e "POLYMARKET_WALLET_ADDRESS=..." `
        -e "POLYMARKET_BUILDER_API_KEY=..." `
        -e "POLYMARKET_BUILDER_API_SECRET=..." `
        -e "POLYMARKET_BUILDER_API_PASSPHRASE=..." `
        -e "CREDENTIAL_ENCRYPTION_PASSWORD=..." `
        --name polymarket-redeemer `
        --pull always `
        ghcr.io/doganm95/polymarket-redeemer:latest
```

## Linux

```shell
    docker run -it --rm \
        -e "POLYGON_POS_RPC_URL=https://..." \
        -e "POLYMARKET_PRIVATE_KEY=..." \
        -e "POLYMARKET_WALLET_ADDRESS=..." \
        -e "POLYMARKET_BUILDER_API_KEY=..." \
        -e "POLYMARKET_BUILDER_API_SECRET=..." \
        -e "POLYMARKET_BUILDER_API_PASSPHRASE=..." \
        -e "CREDENTIAL_ENCRYPTION_PASSWORD=..." \
        --name polymarket-redeemer \
        --pull always \
        ghcr.io/doganm95/polymarket-redeemer:latest
```

## Automation

- To run the container in the background with no terminal attachment and output to the console, replace `-it` with `-d`
- To redeem periodically, run a container every x minutes using e.e. `crontab -e` on linux

## Notes

- The encrypted credentials are created on every container startup, never stored on the host machine & destroyed when the container stops
- `CREDENTIAL_ENCRYPTION_PASSWORD` is just there for good measure
- No ports are exposed, you can just read the logs (safest option, especially with some outdated npm dependencies)
- Only run this on a machine / Network that you have full control of (like your home LAN, a VPS, etc.)

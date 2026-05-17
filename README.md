<p align="center">
  <img src="https://raw.githubusercontent.com/DiumPay/zchf-app/8d199241c0a22db9c2ef7b90e06b9fb81542de53/src/assets/tokens/zchf.svg" alt="ZCHF" width="120" />
</p>

# Frankencoin.win — an open-source frontend for Frankencoin protocol

Frankencoin is a decentralized, oracle-free, collateral-backed stablecoin (ZCHF) on Ethereum.

Static and lightweight, this frontend is built with Astro, Tailwind, viem and web3-onboard. Made to avoid vendor lock-in and to be self-hostable, affordably and easily.

## Requirements

TBD. Bun is preferred. See `package.json` for the full list — Node `>=22.12.0`, Astro 6, Tailwind 4, viem 2, web3-onboard.

## Setup

```bash
git clone https://github.com/DiumPay/zchf-app.git
cd zchf-app
bun i --frozen-lockfile
```

Then:

- `bun run dev` for development
- `bun run dev:prod` to simulate production
- `bun run build:prod` to build

(`--frozen-lockfile` is recommended, not strictly required.)

## Features

- Built from scratch and fully static. Grab the `dist` and host it on Cloudflare Pages or any other static host for free.
- No expensive RPC needed. By default it uses a pool of Chainlist RPCs, which is reliable and distributed.
- Multi-language support to make Frankencoin feel more local. Currently de, en, fr, it, es, with more possible since multi-language was built in from the start.
- Lightweight, with proper headers and CSP set up.
- Dark and light mode.
- Less vendor lock-in. No API key required to run the frontend — it's optional.

## License

MIT
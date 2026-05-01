// CCIP uses its own 64-bit chain selectors, not EVM chain IDs.
// Source: https://docs.chain.link/ccip/directory/mainnet

import type { ChainKey } from "@config/network";

export const CCIP_SELECTORS: Partial<Record<ChainKey, bigint>> = {
    ethereum: 5009297550715157269n,
    arbitrum: 4949039107694359620n,
    avalanche: 6433500567565415381n,
    base: 15971525489660198786n,
    gnosis: 465200170687744372n,
    optimism: 3734403246176062136n,
    polygon: 4051577828743386545n,
    sonic: 1673871237479749969n,
};

/** CCIP explorer URL for a given sender's history. */
export const CCIP_EXPLORER = "https://ccip.chain.link";

/** Chainlink "Transporter" UI — public CCIP bridge. */
export const TRANSPORTER_URL = "https://app.transporter.io/";
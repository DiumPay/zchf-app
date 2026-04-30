// -------------------------------------------------------------
// Singleton viem clients for the app.
//
// publicClient → reads (multi-RPC balanced, auto-multicall batching)
// makeWalletClient(provider) → writes/sign, fed by the EIP-1193 provider
//                              from Web3-Onboard
// -------------------------------------------------------------

import {
    createPublicClient,
    createWalletClient,
    custom,
    type EIP1193Provider,
    type PublicClient,
    type WalletClient,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { balancedTransport } from "@lib/balancedTransport";
import { NET, IS_MAINNET } from "@config/network";

const chain = IS_MAINNET ? mainnet : sepolia;

export const publicClient: PublicClient = createPublicClient({
    chain,
    transport: balancedTransport({
        pool: [...NET.rpcPool],
        chainIdHex: NET.chainId,
        // Tweak as you go — these defaults are sane for most reads.
        // Slower for log queries:
        methodPerAttemptMs: {
            eth_getLogs: 4000,
            eth_call: 1500,
        },
    }),
    // Auto-batches reads via Multicall3 — replaces your custom batcher.
    batch: {
        multicall: true,
    },
});

export function makeWalletClient(provider: EIP1193Provider): WalletClient {
    return createWalletClient({
        chain,
        transport: custom(provider),
    });
}

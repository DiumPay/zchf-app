// -------------------------------------------------------------
// Singleton viem clients.
//
// publicClient → reads (multi-RPC balanced, auto-multicall batching)
// makeWalletClient(provider) → writes/sign (per Onboard wallet)
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
import { debugToast } from "@lib/toast";
import { NET, IS_MAINNET } from "@config/network";

const chain = IS_MAINNET ? mainnet : sepolia;

function hostOf(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

export const publicClient: PublicClient = createPublicClient({
    chain,
    transport: balancedTransport({
        pool: [...NET.rpcPool],
        chainIdHex: NET.chainId,
        methodPerAttemptMs: {
            eth_getLogs: 4000,
            eth_call: 1500,
        },
        // Surface unhealthy endpoints — only visible to devs (debug mode).
        // Always logged to console regardless.
        onBreaker: ({ url, open }) => {
            if (open) {
                debugToast(`RPC ${hostOf(url)} marked unhealthy`, "warning");
            }
        },
    }),
    batch: {
        multicall: true,
    },
});

// `provider` is loosely typed because Web3-Onboard's EIP-1193 provider type
// differs from viem's on event-listener generics (incompatible in TS, but
// functionally identical at runtime). viem's `custom()` only consumes
// `.request`, so this cast is safe.
export function makeWalletClient(provider: unknown): WalletClient {
    return createWalletClient({
        chain,
        transport: custom(provider as EIP1193Provider),
    });
}
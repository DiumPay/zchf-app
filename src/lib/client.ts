import {
    createPublicClient,
    createWalletClient,
    custom,
    type EIP1193Provider,
    type PublicClient,
    type WalletClient,
    type Chain,
} from "viem";
import {
    mainnet, sepolia, arbitrum, avalanche, base,
    gnosis, optimism, polygon, sonic,
} from "viem/chains";
import { balancedTransport } from "@lib/balancedTransport";
import { debugToast } from "@lib/toast";
import { CHAINS, DEFAULT_CHAIN, type ChainKey } from "@config/network";

const VIEM_CHAINS: Record<ChainKey, Chain> = {
    ethereum: mainnet,
    arbitrum: arbitrum,
    avalanche: avalanche,
    base: base,
    gnosis: gnosis,
    optimism: optimism,
    polygon: polygon,
    sonic: sonic,
    sepolia: sepolia,
};

function hostOf(url: string): string {
    try { return new URL(url).hostname; } catch { return url; }
}

const publicClients = new Map<ChainKey, PublicClient>();

export function getPublicClient(key: ChainKey = DEFAULT_CHAIN): PublicClient {
    const cached = publicClients.get(key);
    if (cached) return cached;

    const NET = CHAINS[key];
    const client = createPublicClient({
        chain: VIEM_CHAINS[key],
        transport: balancedTransport({
            pool: [...NET.rpcPool],
            chainIdHex: NET.chainId,
            methodPerAttemptMs: { eth_getLogs: 4000, eth_call: 1500 },
            onBreaker: ({ url, open }) => {
                if (open) debugToast(`RPC ${hostOf(url)} marked unhealthy`, "warning");
            },
        }),
        batch: { multicall: true },
    }) as PublicClient;

    publicClients.set(key, client);
    return client;
}

export const publicClient = getPublicClient(DEFAULT_CHAIN);

export function makeWalletClient(provider: unknown, chainKey: ChainKey = DEFAULT_CHAIN): WalletClient {
    return createWalletClient({
        chain: VIEM_CHAINS[chainKey],
        transport: custom(provider as EIP1193Provider),
    }) as WalletClient;
}
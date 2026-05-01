export type ChainKey =
    | "ethereum"
    | "arbitrum"
    | "avalanche"
    | "base"
    | "gnosis"
    | "optimism"
    | "polygon"
    | "sonic"
    | "sepolia";

export interface ChainConfig {
    key: ChainKey;
    chainId: `0x${string}`;
    chainIdNumber: number;
    label: string;
    token: string;
    explorer: string;
    rpcPool: readonly string[];
    isCanonical: boolean;
    isBridged: boolean;
}

// https://chainlist.org
export const CHAINS: Record<ChainKey, ChainConfig> = {
    ethereum: {
        key: "ethereum",
        chainId: "0x1",
        chainIdNumber: 1,
        label: "Ethereum",
        token: "ETH",
        explorer: "https://etherscan.io",
        isCanonical: true,
        isBridged: false,
        rpcPool: [
            "https://eth.drpc.org",
            "https://eth.blockrazor.xyz",
            "https://1rpc.io/eth",
            "https://eth.meowrpc.com",
            "https://ethereum-public.nodies.app",
            "https://mainnet.gateway.tenderly.co",
            "https://eth.api.onfinality.io/public",
            "https://0xrpc.io/eth",
            "https://api.zan.top/eth-mainnet",
            "https://eth.rpc.blxrbdn.com",
            "https://ethereum-mainnet.gateway.tatum.io",
            "https://eth.llamarpc.com",
            "https://ethereum-rpc.publicnode.com",
            "https://public-eth.nownodes.io",
            "https://rpc.sentio.xyz/mainnet",
            "https://eth.api.pocket.network",
            "https://rpc.fullsend.to",
            "https://gateway.tenderly.co/public/mainnet",
            "https://rpc.flashbots.net/fast",
            "https://rpc.mevblocker.io/fast",
            "https://eth-mainnet.public.blastapi.io",
            "https://ethereum.public.blockpi.network/v1/rpc/public",
            "https://ethereum.rpc.subquery.network/public",
            "https://eth1.lava.build",
            "https://ethereum-json-rpc.stakely.io",
            "https://rpc.mevblocker.io/fullprivacy",
        ],
    },
    arbitrum: {
        key: "arbitrum",
        chainId: "0xa4b1",
        chainIdNumber: 42161,
        label: "Arbitrum One",
        token: "ETH",
        explorer: "https://arbiscan.io",
        isCanonical: false,
        isBridged: true,
        rpcPool: [
            "https://arbitrum-one-rpc.publicnode.com",
            "https://arbitrum.meowrpc.com",
            "https://api.zan.top/arb-one",
            "https://arbitrum.api.onfinality.io/public",
            "https://public-arb-mainnet.fastnode.io",
            "https://rpc.sentio.xyz/arbitrum-one",
            "https://arb1.arbitrum.io/rpc",
            "https://1rpc.io/arb",
            "https://arbitrum-one-public.nodies.app",
            "https://arbitrum-one.public.blastapi.io",
            "https://arb-one.api.pocket.network",
            "https://rpc.owlracle.info/arb/70d38ce1826c4a60bb2a8e05a6c8b20f",
            "https://arbitrum.gateway.tenderly.co",
            "https://arb1.lava.build",
            "https://arbitrum.public.blockpi.network/v1/rpc/public",
        ],
    },
    avalanche: {
        key: "avalanche",
        chainId: "0xa86a",
        chainIdNumber: 43114,
        label: "Avalanche",
        token: "AVAX",
        explorer: "https://snowscan.xyz",
        isCanonical: false,
        isBridged: true,
        rpcPool: [
            "https://api.avax.network/ext/bc/C/rpc",
            "https://avalanche-c-chain-rpc.publicnode.com",
            "https://1rpc.io/avax/c",
            "https://avalanche-public.nodies.app/ext/bc/C/rpc",
            "https://avalanche.api.onfinality.io/public/ext/bc/C/rpc",
            "https://api.zan.top/avax-mainnet/ext/bc/C/rpc",
            "https://avalanche.drpc.org",
            "https://avalanche-mainnet.gateway.tenderly.co",
            "https://rpc.owlracle.info/avax/70d38ce1826c4a60bb2a8e05a6c8b20f",
            "https://spectrum-01.simplystaking.xyz/avalanche-mn-rpc/ext/bc/C/rpc",
            "https://avax.api.pocket.network",
            "https://rpc.sentio.xyz/avalanche",
        ],
    },
    base: {
        key: "base",
        chainId: "0x2105",
        chainIdNumber: 8453,
        label: "Base",
        token: "ETH",
        explorer: "https://basescan.org",
        isCanonical: false,
        isBridged: true,
        rpcPool: [
            "https://base.llamarpc.com",
            "https://mainnet.base.org",
            "https://developer-access-mainnet.base.org",
            "https://base.public.blockpi.network/v1/rpc/public",
            "https://1rpc.io/base",
            "https://base-public.nodies.app",
            "https://base.meowrpc.com",
            "https://base-mainnet.public.blastapi.io",
            "https://base.gateway.tenderly.co",
            "https://gateway.tenderly.co/public/base",
            "https://base-rpc.publicnode.com",
            "https://base.drpc.org",
            "https://base-mainnet.gateway.tatum.io",
            "https://api.zan.top/base-mainnet",
            "https://base.lava.build",
            "https://rpc.owlracle.info/base/70d38ce1826c4a60bb2a8e05a6c8b20f",
            "https://base.api.pocket.network",
            "https://base.rpc.blxrbdn.com",
            "https://rpc.sentio.xyz/base",
        ],
    },
    gnosis: {
        key: "gnosis",
        chainId: "0x64",
        chainIdNumber: 100,
        label: "Gnosis",
        token: "xDAI",
        explorer: "https://gnosisscan.io",
        isCanonical: false,
        isBridged: true,
        rpcPool: [
            "https://rpc.gnosischain.com",
            "https://gnosis-public.nodies.app",
            "https://rpc.gnosis.gateway.fm",
            "https://rpc.ap-southeast-1.gateway.fm/v4/gnosis/non-archival/mainnet",
            "https://gnosis.drpc.org",
            "https://gnosis-rpc.publicnode.com",
            "https://1rpc.io/gnosis",
            "https://gnosis.api.pocket.network",
            "https://public-gno-mainnet.fastnode.io",
            "https://gnosis.oat.farm",
            "https://gno-mainnet.gateway.tatum.io",
        ],
    },
    optimism: {
        key: "optimism",
        chainId: "0xa",
        chainIdNumber: 10,
        label: "OP Mainnet",
        token: "ETH",
        explorer: "https://optimistic.etherscan.io",
        isCanonical: false,
        isBridged: true,
        rpcPool: [
            "https://mainnet.optimism.io",
            "https://1rpc.io/op",
            "https://optimism-public.nodies.app",
            "https://optimism.public.blockpi.network/v1/rpc/public",
            "https://optimism.api.onfinality.io/public",
            "https://optimism-rpc.publicnode.com",
            "https://api.zan.top/opt-mainnet",
            "https://optimism.drpc.org",
            "https://optimism.gateway.tenderly.co",
            "https://gateway.tenderly.co/public/optimism",
            "https://optimism-mainnet.gateway.tatum.io",
            "https://go.getblock.io/e8a75f8dcf614861becfbcb185be6eb4",
            "https://rpc.owlracle.info/opt/70d38ce1826c4a60bb2a8e05a6c8b20f",
            "https://public-op-mainnet.fastnode.io",
            "https://rpc.sentio.xyz/optimism",
        ],
    },
    polygon: {
        key: "polygon",
        chainId: "0x89",
        chainIdNumber: 137,
        label: "Polygon",
        token: "POL",
        explorer: "https://polygonscan.com",
        isCanonical: false,
        isBridged: true,
        rpcPool: [
            "https://polygon.drpc.org",
            "https://1rpc.io/matic",
            "https://polygon-rpc.com",
            "https://polygon-bor-rpc.publicnode.com",
            "https://polygon.meowrpc.com",
            "https://polygon.gateway.tenderly.co",
        ],
    },
    sonic: {
        key: "sonic",
        chainId: "0x92",
        chainIdNumber: 146,
        label: "Sonic",
        token: "S",
        explorer: "https://sonicscan.org",
        isCanonical: false,
        isBridged: true,
        rpcPool: [
            "https://sonic.drpc.org",
            "https://rpc.soniclabs.com",
            "https://sonic-rpc.publicnode.com",
        ],
    },
    sepolia: {
        key: "sepolia",
        chainId: "0xaa36a7",
        chainIdNumber: 11155111,
        label: "Sepolia",
        token: "ETH",
        explorer: "https://sepolia.etherscan.io",
        isCanonical: false,
        isBridged: false,
        rpcPool: [
            "https://1rpc.io/sepolia",
            "https://0xrpc.io/sep",
            "https://ethereum-sepolia-rpc.publicnode.com",
            "https://api.zan.top/eth-sepolia",
            "https://eth-sepolia.api.onfinality.io/public",
        ],
    },
};

export const CANONICAL_CHAIN: ChainKey = "ethereum";
export const DEFAULT_CHAIN: ChainKey = "ethereum";

/** Chains where ZCHF exists — canonical Ethereum + bridged variants. */
export const SUPPORTED_CHAINS: readonly ChainKey[] = [
    "ethereum",
    "arbitrum",
    "avalanche",
    "base",
    "gnosis",
    "optimism",
    "polygon",
    "sonic",
];

export function chainByIdHex(idHex: string): ChainConfig | undefined {
    return Object.values(CHAINS).find(c => c.chainId.toLowerCase() === idHex.toLowerCase());
}

export function chainByIdNumber(id: number): ChainConfig | undefined {
    return Object.values(CHAINS).find(c => c.chainIdNumber === id);
}
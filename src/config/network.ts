// src/config/network.ts
// Frankencoin runs on Ethereum mainnet. Sepolia kept for dev/testing.

const NETWORK = import.meta.env.MODE === "production" ? "mainnet" : "mainnet";

const CONFIGS = {
    mainnet: {
        chainId: "0x1",
        chainLabel: "Ethereum",
        explorer: "https://etherscan.io",
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
    sepolia: {
        chainId: "0xaa36a7",
        chainLabel: "Sepolia",
        explorer: "https://sepolia.etherscan.io",
        rpcPool: [
            "https://1rpc.io/sepolia",
            "https://0xrpc.io/sep",
            "https://ethereum-sepolia-rpc.publicnode.com",
            "https://api.zan.top/eth-sepolia",
            "https://eth-sepolia.api.onfinality.io/public",
        ],
    },
} as const;

export const NET = CONFIGS[NETWORK];
export const IS_MAINNET = NETWORK === "mainnet";

import Onboard, { type OnboardAPI } from "@web3-onboard/core";
import injectedWalletsModule from "@web3-onboard/injected-wallets";
import { NET } from "@config/network";

const injected = injectedWalletsModule();
const wallets = [injected];

// Pick a random RPC from the pool on each page load.
// Onboard only accepts one rpcUrl per chain, so this gives redundancy
// across sessions — if one endpoint is down, the next reload picks another.
// Actual app reads go through viem's balanced transport, not this URL.
const randomRpc = NET.rpcPool[Math.floor(Math.random() * NET.rpcPool.length)];

const chains = [
    {
        id: NET.chainId,
        token: "ETH",
        label: NET.chainLabel,
        rpcUrl: randomRpc,
        blockExplorerUrl: NET.explorer,
    },
];

const appMetadata = {
    name: "Frankencoin",
    icon: "<svg />",
    logo: "<svg />",
    description: "Frankencoin dApp",
    recommendedInjectedWallets: [
        { name: "MetaMask", url: "https://metamask.io" },
        { name: "Coinbase", url: "https://wallet.coinbase.com/" },
    ],
};

let onboard: OnboardAPI | null = null;

function currentTheme(): "dark" | "light" {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function getOnboard(): OnboardAPI {
    if (!onboard) {
        onboard = Onboard({
            wallets,
            chains,
            appMetadata,
            theme: currentTheme(),
            connect: {
                autoConnectLastWallet: true,
            },
        });
    }
    return onboard;
}

export function syncOnboardTheme(): void {
    if (!onboard) return;
    onboard.state.actions.updateTheme(currentTheme());
}
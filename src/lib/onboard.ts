import Onboard, { type OnboardAPI } from "@web3-onboard/core";
import injectedWalletsModule from "@web3-onboard/injected-wallets";
import metamaskModule from "@web3-onboard/metamask";
import coinbaseWalletModule from "@web3-onboard/coinbase";
import { CHAINS, SUPPORTED_CHAINS } from "@config/network";
import zchfLogo from "@assets/tokens/zchf.svg?url";

const injected = injectedWalletsModule();
const metamask = metamaskModule({
  options: {
    extensionOnly: true,
    dappMetadata: {
      name: "Frankencoin",
    },
  },
});
const coinbaseWallet = coinbaseWalletModule();

const wallets = [metamask, coinbaseWallet, injected];

const chains = SUPPORTED_CHAINS.map((key) => {
  const c = CHAINS[key];
  const rpc = c.rpcPool[Math.floor(Math.random() * c.rpcPool.length)];
  return {
    id: c.chainId,
    token: c.token,
    label: c.label,
    rpcUrl: rpc,
    blockExplorerUrl: c.explorer,
  };
});

const appMetadata = {
  name: "Frankencoin",
  icon: zchfLogo,
  logo: zchfLogo,
  description: "Borrow ZCHF decentralized Swiss francs against crypto collateral.",
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
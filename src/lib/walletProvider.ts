import type { Address } from "viem";

export const ETH_CHAIN_ID_HEX = "0x1";

export function getRawProvider(): any {
    const eth = (window as any).ethereum;
    if (!eth) return null;
    if (Array.isArray(eth.providers) && eth.providers.length) {
        const mm = eth.providers.find((p: any) => p.isMetaMask && !p.isBraveWallet);
        return mm ?? eth.providers[0];
    }
    return eth;
}

export async function readChainId(): Promise<string | null> {
    const p = getRawProvider();
    if (!p?.request) return null;
    try {
        const id = await p.request({ method: "eth_chainId" });
        return typeof id === "string" ? id.toLowerCase() : null;
    } catch {
        return null;
    }
}

export async function forceMainnet(): Promise<void> {
    const p = getRawProvider();
    if (!p?.request) throw new Error("No wallet provider available");
    await p.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ETH_CHAIN_ID_HEX }],
    });
}

export function isUserCancelErr(err: any): boolean {
    const code = err?.code ?? err?.cause?.code;
    if (code === 4001) return true;
    return /reject|denied|cancel/i.test(err?.message ?? "");
}

export function isWalletRpcError(err: any): boolean {
    const msg = (err?.message ?? err?.cause?.message ?? "").toString().toLowerCase();
    const code = err?.code ?? err?.cause?.code;
    if (msg.includes("json-rpc") || msg.includes("json rpc")) return true;
    return code === -32603 || code === -32000 || code === -32601 || code === -32006;
}
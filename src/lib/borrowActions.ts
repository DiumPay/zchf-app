// Transaction helpers for the borrow flow. Two paths:
//
//   1. Same price as parent  → mintingHubV2.clone(parent, coll, mint, expiration)
//   2. Different price       → cloneHelper.cloneWithPrice(parent, coll, mint, expiration, newPrice)
//
// All three writes pin chain: mainnet. The PAGE is responsible for ensuring
// the wallet is on mainnet before calling — it surfaces a "Switch to Ethereum"
// button when the user is on a different chain. We rely on chain: mainnet here
// only as a final safety net; if the page logic is wrong, viem will error out
// instead of silently signing on the wrong network.

import {
    erc20Abi, maxUint256, parseEventLogs,
    type Address, type WalletClient, type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { MINTING_HUB_V2_ABI } from "@abi/mintingHub";
import { CLONE_HELPER_ABI } from "@abi/cloneHelper";
import { ADDRESSES } from "@config/addresses";

/** Read current allowance for a given spender. */
export async function getAllowance(
    client: PublicClient,
    token: Address,
    owner: Address,
    spender: Address,
): Promise<bigint> {
    return await client.readContract({
        address: token, abi: erc20Abi,
        functionName: "allowance", args: [owner, spender],
    });
}

/** Approve max — same pattern earn.astro uses. Returns when receipt confirms. */
export async function approveCollateral(
    walletClient: WalletClient,
    publicClient: PublicClient,
    token: Address,
    spender: Address,
    account: Address,
): Promise<`0x${string}`> {
    const hash = await walletClient.writeContract({
        address: token, abi: erc20Abi, functionName: "approve",
        args: [spender, maxUint256], account, chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}

/**
 * Path 1: clone at parent price (cheaper, no helper involved).
 * Returns the newly created position address parsed from PositionOpened.
 */
export async function executeClone(
    walletClient: WalletClient,
    publicClient: PublicClient,
    args: {
        parent: Address;
        collateral: bigint;
        mint: bigint;
        expiration: number; // unix seconds
        account: Address;
    },
): Promise<{ hash: `0x${string}`; position: Address }> {
    const hash = await walletClient.writeContract({
        address: ADDRESSES.ethereum.mintingHubV2!,
        abi: MINTING_HUB_V2_ABI,
        functionName: "clone",
        args: [args.parent, args.collateral, args.mint, args.expiration],
        account: args.account, chain: mainnet,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const position = parseNewPosition(receipt.logs);
    return { hash, position };
}

/**
 * Path 2: clone via CloneHelper, which mints at parent price then adjusts.
 * Returns the newly created position address parsed from PositionOpened.
 */
export async function executeCloneWithPrice(
    walletClient: WalletClient,
    publicClient: PublicClient,
    args: {
        parent: Address;
        collateral: bigint;
        mint: bigint;
        expiration: number;
        newPrice: bigint;
        account: Address;
    },
): Promise<{ hash: `0x${string}`; position: Address }> {
    const hash = await walletClient.writeContract({
        address: ADDRESSES.ethereum.cloneHelper!,
        abi: CLONE_HELPER_ABI,
        functionName: "cloneWithPrice",
        args: [args.parent, args.collateral, args.mint, args.expiration, args.newPrice],
        account: args.account, chain: mainnet,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const position = parseNewPosition(receipt.logs);
    return { hash, position };
}

/** Pulls the new position address out of the PositionOpened event. */
function parseNewPosition(logs: readonly { topics: any; data: any }[]): Address {
    const events = parseEventLogs({
        abi: MINTING_HUB_V2_ABI,
        eventName: "PositionOpened",
        logs: logs as any,
    });
    if (events.length === 0) {
        throw new Error("PositionOpened event missing from receipt");
    }
    return (events[0] as any).args.position as Address;
}
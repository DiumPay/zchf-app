// Transaction helpers for launching a challenge against a position.
// Mirrors official frankencoin's ChallengeAction component:
//
//   1. Approve collateral spend to MintingHubV2
//   2. MintingHubV2.challenge(positionAddr, amount, expectedPrice)
//
// `expectedPrice` is the *current* position.price — passed as a sanity check
// to the contract. If the price has been adjusted between the read and the
// tx, the contract reverts. We always read price live just before signing.

import {
    erc20Abi, maxUint256,
    type Address, type WalletClient, type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { MINTING_HUB_V2_ABI } from "@abi/mintingHub";
import { ADDRESSES } from "@config/addresses";

export async function getCollateralAllowance(
    client: PublicClient,
    token: Address,
    owner: Address,
): Promise<bigint> {
    return await client.readContract({
        address: token, abi: erc20Abi,
        functionName: "allowance",
        args: [owner, ADDRESSES.ethereum.mintingHubV2!],
    });
}

export async function getCollateralBalance(
    client: PublicClient,
    token: Address,
    owner: Address,
): Promise<bigint> {
    return await client.readContract({
        address: token, abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
    });
}

/** Approve collateral spend to MintingHubV2 (max — same pattern as borrow). */
export async function approveCollateralForChallenge(
    walletClient: WalletClient,
    publicClient: PublicClient,
    collateralToken: Address,
    account: Address,
): Promise<`0x${string}`> {
    const hash = await walletClient.writeContract({
        address: collateralToken, abi: erc20Abi, functionName: "approve",
        args: [ADDRESSES.ethereum.mintingHubV2!, maxUint256],
        account, chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}

/**
 * Launch the challenge. `expectedPrice` is the position's current `price()`
 * value — must be read live by the caller and passed through. The contract
 * reverts if the position price changes between read and tx.
 *
 * Returns the tx hash. Caller decides what to do on success (toast, redirect).
 */
export async function launchChallenge(
    walletClient: WalletClient,
    publicClient: PublicClient,
    args: {
        position: Address;
        collateralAmount: bigint;
        expectedPrice: bigint;
        account: Address;
    },
): Promise<`0x${string}`> {
    const hash = await walletClient.writeContract({
        address: ADDRESSES.ethereum.mintingHubV2!,
        abi: MINTING_HUB_V2_ABI,
        functionName: "challenge",
        args: [args.position, args.collateralAmount, args.expectedPrice],
        account: args.account, chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
/**
 * Governance write actions for mainnet.
 *
 * All three writes here are vote-gated except `delegateVoteTo` (which is
 * what you call BEFORE you can vote — it's the registration step). The
 * vote-gated ones use the helpers chain from `lib/votingHelpers.ts`.
 */

import { type Address, type WalletClient, type PublicClient, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { EQUITY_ABI } from "@abi/equity";
import { SAVINGS_ABI } from "@abi/savings";
import { FRANKENCOIN_ABI } from "@abi/frankencoin";
import { GOVERNANCE_SENDER_ABI, BRIDGED_GOVERNANCE_ABI } from "@abi/ccipGovernance";
import { ADDRESSES } from "@config/addresses";

export const ZCHF_DECIMALS = 18;
export const PPM_PER_PCT = 10_000; // PPM (e.g. 35000) ÷ 10_000 = 3.5%

// Read current delegate target for a holder. Returns zero address if no
// delegation has been set.
export async function readDelegate(
    client: PublicClient,
    holder: Address,
): Promise<Address> {
    const equity = ADDRESSES.ethereum.equity as Address;
    return (await client.readContract({
        address: equity,
        abi: EQUITY_ABI,
        functionName: "delegates",
        args: [holder],
    })) as Address;
}

/**
 * Delegate voting power. Pass `delegate = sender` to self-delegate (which
 * is the required step to activate your own voting power for governance
 * writes from your address).
 */
export async function delegateVoteTo(
    walletClient: WalletClient,
    publicClient: PublicClient,
    account: Address,
    delegate: Address,
): Promise<`0x${string}`> {
    const equity = ADDRESSES.ethereum.equity as Address;
    const hash = await walletClient.writeContract({
        address: equity,
        abi: EQUITY_ABI,
        functionName: "delegateVoteTo",
        args: [delegate],
        account,
        chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}

/**
 * Propose a new leadrate. The contract opens a 7-day veto window; if no
 * counter-proposal arrives, anyone can call applyChange() afterwards.
 *
 *   newRatePct: human-friendly percent, e.g. 3.5 → 35000 PPM
 *   helpers: from buildVotingHelpers().helpers
 */
export async function proposeLeadrate(
    walletClient: WalletClient,
    publicClient: PublicClient,
    account: Address,
    newRatePct: number,
    helpers: Address[],
    moduleAddress?: Address,
): Promise<`0x${string}`> {
    const savings = (moduleAddress ?? (ADDRESSES.ethereum.savings as Address));
    // Convert % → PPM. Math.round to absorb float wiggle (3.5 * 10_000 = 35000
    // is exact, but 0.1 * 10_000 = 999.9999... in some FP scenarios).
    const newRatePpm = Math.round(newRatePct * PPM_PER_PCT);
    if (newRatePpm < 0 || newRatePpm > 16_777_215) {
        // uint24 bounds — sanity guard so a UI typo doesn't silently revert
        throw new Error(`leadrate ${newRatePct}% is out of uint24 PPM range`);
    }
    const hash = await walletClient.writeContract({
        address: savings,
        abi: SAVINGS_ABI,
        functionName: "proposeChange",
        args: [newRatePpm, helpers],
        account,
        chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}

/**
 * Suggest a new minting module. Costs MIN_FEE ZCHF (1000 by default) plus
 * an application period during which veto power holders can deny it.
 *
 *   applicationPeriodSec: window in seconds, e.g. 14 days = 1_209_600
 *   applicationFeeZchf: human ZCHF amount (NOT wei), e.g. 1000
 */
export async function suggestMinter(
    walletClient: WalletClient,
    publicClient: PublicClient,
    account: Address,
    minter: Address,
    applicationPeriodSec: number,
    applicationFeeZchf: string,
    message: string,
): Promise<`0x${string}`> {
    const zchf = ADDRESSES.ethereum.zchf as Address;
    const fee = parseUnits(applicationFeeZchf, ZCHF_DECIMALS);
    const hash = await walletClient.writeContract({
        address: zchf,
        abi: FRANKENCOIN_ABI,
        functionName: "suggestMinter",
        args: [minter, BigInt(applicationPeriodSec), fee, message],
        account,
        chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}

/**
 * Sync FPS voting power to another chain via CCIP.
 *
 * Two-step pattern:
 *   1. simulate `getCCIPFee()` to know the native-fee cost
 *   2. write `pushVotes()` with `value = fee * 1.2` for headroom
 *
 * voters = [callerAddress, ...helpersChain]. Caller MUST be voters[0] —
 * the GovernanceSender enforces it.
 */
export async function getSyncVotesFee(
    publicClient: PublicClient,
    targetSelector: bigint,
    targetReceiver: Address,
    voters: Address[],
): Promise<bigint> {
    const sender = ADDRESSES.ethereum.ccipGovernanceSender as Address;
    return (await publicClient.readContract({
        address: sender,
        abi: GOVERNANCE_SENDER_ABI,
        functionName: "getCCIPFee",
        args: [targetSelector, targetReceiver, voters, true],
    })) as bigint;
}

export async function syncVotesToChain(
    walletClient: WalletClient,
    publicClient: PublicClient,
    account: Address,
    targetSelector: bigint,
    targetReceiver: Address,
    voters: Address[],
): Promise<{ hash: `0x${string}`; fee: bigint }> {
    const sender = ADDRESSES.ethereum.ccipGovernanceSender as Address;
    const fee = await getSyncVotesFee(publicClient, targetSelector, targetReceiver, voters);
    // 20% buffer — CCIP fees vary slightly with gas price by the time the tx
    // actually lands. Anything paid above the required fee is refunded by
    // the contract.
    const value = (fee * 12n) / 10n;
    const hash = await walletClient.writeContract({
        address: sender,
        abi: GOVERNANCE_SENDER_ABI,
        functionName: "pushVotes",
        args: [targetSelector, targetReceiver, voters],
        value,
        account,
        chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return { hash, fee };
}

/**
 * Read the caller's currently-synced voting power on a target chain.
 * Returns { synced, total } so the caller can compute a percent.
 */
export async function readVotesOnTarget(
    targetClient: PublicClient,
    bridgedGovernance: Address,
    account: Address,
    helpers: Address[],
): Promise<{ synced: bigint; total: bigint }> {
    const results = await targetClient.multicall({
        allowFailure: false,
        contracts: [
            {
                address: bridgedGovernance,
                abi: BRIDGED_GOVERNANCE_ABI,
                functionName: "votesDelegated",
                args: [account, helpers],
            },
            {
                address: bridgedGovernance,
                abi: BRIDGED_GOVERNANCE_ABI,
                functionName: "totalVotes",
            },
        ],
    }) as [bigint, bigint];
    return { synced: results[0], total: results[1] };
}

/**
 * Aggregate FPS stats from mainnet:
 *   - avgHoldingDuration: avg time-weighted holding period in seconds.
 *     Equity.totalVotes is sum(balance × holdingTime) shifted by 20 bits;
 *     dividing by totalSupply and right-shifting 20 gives back seconds.
 *   - fpsForVeto: how many FPS at average duration are needed to reach 2%.
 *
 * These are nice-to-have UI numbers, not used in any tx — display only.
 */
export async function readFPSAverageStats(
    publicClient: PublicClient,
): Promise<{ totalSupply: bigint; totalVotes: bigint; avgHoldingDurationSec: bigint; fpsForVeto: bigint }> {
    const equity = ADDRESSES.ethereum.equity as Address;
    const [totalSupply, totalVotes] = (await publicClient.multicall({
        allowFailure: false,
        contracts: [
            { address: equity, abi: EQUITY_ABI, functionName: "totalSupply" },
            { address: equity, abi: EQUITY_ABI, functionName: "totalVotes" },
        ],
    })) as [bigint, bigint];

    const avgHoldingDurationSec = totalSupply > 0n
        ? (totalVotes / totalSupply) >> 20n
        : 0n;
    const fpsForVeto = (totalSupply * 200n) / 10_000n;

    return { totalSupply, totalVotes, avgHoldingDurationSec, fpsForVeto };
}
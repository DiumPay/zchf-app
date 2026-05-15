/**
 * Voting helpers builder.
 *
 * Frankencoin's veto-gated writes (denyPosition, denyMinter, Savings.proposeChange)
 * take an `address[] helpers` argument that proves the caller's combined
 * voting power meets the 2% threshold.
 *
 *   Contract check (Equity.checkQualified):
 *     - The caller's own votes are always included.
 *     - For each helper, the contract walks `delegates[helper] → delegates[…] → …`
 *       and verifies that chain terminates at the caller. So each helper just
 *       needs SOME delegation path back to the caller — direct, transitive,
 *       doesn't matter. No ordering is required between helpers.
 *     - Votes are summed: caller.votes() + sum(helpers[i].votes()).
 *     - Pass condition: sum × 10_000 ≥ totalVotes × 200  (i.e. ≥ 2%).
 *
 *   How we build helpers off-chain:
 *     - BFS through the supporter graph from the caller (everyone who has
 *       delegated to caller, directly or transitively).
 *     - Fetch each candidate's votes() on-chain.
 *     - Sort by votes desc, greedy add until we cross 2% (minimizes calldata).
 *
 * Self-delegations don't count as support — the caller is already in the sum.
 */

import { type Address, type PublicClient } from "viem";
import { EQUITY_ABI } from "@abi/equity";
import { ADDRESSES } from "@config/addresses";
import { loadGovernance } from "@lib/governance";

const VETO_THRESHOLD_BPS = 200n; // 2.00%

export type VotingPower = {
    selfVotes: bigint;
    totalVotes: bigint;
    /** Helpers to pass into the vote-gated function. */
    helpers: Address[];
    /** Total caller + helpers votes. */
    combinedVotes: bigint;
    /** True iff combinedVotes / totalVotes ≥ 2%. */
    qualified: boolean;
};

/**
 * Build the helpers chain for `sender` and pre-compute whether it passes
 * the 2% veto threshold. Safe to pass `result.helpers` directly to any
 * vote-gated write when `result.qualified === true`.
 */
export async function buildVotingHelpers(
    client: PublicClient,
    sender: Address,
): Promise<VotingPower> {
    const equity = ADDRESSES.ethereum.equity as Address;
    if (!equity) {
        throw new Error("Equity address not configured for mainnet");
    }
    const senderLc = sender.toLowerCase();

    // Pull delegation graph from grenadier (in-flight dedup keeps this cheap).
    const gov = await loadGovernance();

    // Build inverse map: delegateeTo[X] = [Y1, Y2, ...] where each Yi has
    // delegates[Yi] == X. Self-delegations are skipped — they don't add
    // any new voting power beyond what the caller already brings.
    const delegateeTo = new Map<string, string[]>();
    for (const d of gov.delegations.list) {
        const to = d.delegatedTo.toLowerCase();
        const from = d.owner.toLowerCase();
        if (to === from) continue;
        const list = delegateeTo.get(to);
        if (list) list.push(from);
        else delegateeTo.set(to, [from]);
    }

    // BFS from sender through all transitive supporters. `seen` prevents
    // revisits, which also short-circuits any cycles in the graph.
    const seen = new Set<string>([senderLc]);
    const candidates: string[] = [];
    const queue: string[] = [senderLc];
    while (queue.length > 0) {
        const cur = queue.shift()!;
        const supporters = delegateeTo.get(cur);
        if (!supporters) continue;
        for (const s of supporters) {
            if (seen.has(s)) continue;
            seen.add(s);
            candidates.push(s);
            queue.push(s);
        }
    }

    // One multicall: totalVotes + sender votes + each candidate's votes.
    const reads = [
        { address: equity, abi: EQUITY_ABI, functionName: "totalVotes" as const },
        { address: equity, abi: EQUITY_ABI, functionName: "votes" as const, args: [sender] },
        ...candidates.map(c => ({
            address: equity,
            abi: EQUITY_ABI,
            functionName: "votes" as const,
            args: [c as Address],
        })),
    ];
    const results = await client.multicall({ allowFailure: false, contracts: reads }) as bigint[];
    const totalVotes = results[0];
    const selfVotes = results[1];

    const threshold = (totalVotes * VETO_THRESHOLD_BPS) / 10_000n;

    // Early exit: caller alone qualifies.
    if (selfVotes >= threshold) {
        return { selfVotes, totalVotes, helpers: [], combinedVotes: selfVotes, qualified: true };
    }

    // Sort supporters by votes desc — biggest first minimizes helpers count.
    const ranked = candidates
        .map((addr, i) => ({ addr, votes: results[2 + i] }))
        .filter(c => c.votes > 0n) // skip dust
        .sort((a, b) => (a.votes < b.votes ? 1 : a.votes > b.votes ? -1 : 0));

    let combined = selfVotes;
    const helpers: Address[] = [];
    for (const r of ranked) {
        if (combined >= threshold) break;
        helpers.push(r.addr as Address);
        combined += r.votes;
    }

    return {
        selfVotes,
        totalVotes,
        helpers,
        combinedVotes: combined,
        qualified: combined >= threshold,
    };
}
/**
 * CCIP GovernanceSender on mainnet — used to replicate FPS voting weight
 * to another chain. Pays a CCIP fee in native ETH (msg.value).
 *
 *   getCCIPFee(destSelector, receiver, voters, payNative=true) → wei
 *   pushVotes(destSelector, receiver, voters) payable
 *
 * voters[] = [callerAddress, ...helpersChain]. Caller must be voters[0] —
 * the contract enforces that. Receiver = BridgedGovernance on the dest L2.
 */
import { parseAbi } from "viem";

export const GOVERNANCE_SENDER_ABI = parseAbi([
    "function getCCIPFee(uint64 destChainSelector, address receiver, address[] voters, bool payNative) view returns (uint256)",
    "function pushVotes(uint64 destChainSelector, address receiver, address[] voters) payable",
]);

/**
 * The BridgedGovernance contract on each L2 mirrors the voting power
 * that was last synced from mainnet. `votesDelegated(account, helpers)`
 * returns the same combined voting power semantic as Equity.votes() —
 * helpful for showing "your votes on this chain" before deciding to sync.
 */
export const BRIDGED_GOVERNANCE_ABI = parseAbi([
    "function votesDelegated(address account, address[] helpers) view returns (uint256)",
    "function totalVotes() view returns (uint256)",
]);
/**
 * Chainlink CCIP TokenPool — minimal read-only surface.
 *
 * Each chain that ZCHF lives on has a token pool that gates inbound/outbound
 * transfers per remote chain via a token-bucket rate limiter:
 *   - capacity: max amount the bucket can hold (max single transfer)
 *   - rate: refill rate per second
 *   - tokens: current bucket level
 *
 * getSupportedChains() returns the list of remote chain selectors this pool
 * is configured for. getRemoteToken() decodes the ZCHF address on the
 * destination chain (ABI-encoded bytes — usually decodes to address).
 *
 * We only call the *Current* limiter accessors so the on-chain math
 * (refill since last update) is already applied for us.
 */
import { parseAbi } from "viem";

export const CCIP_TOKEN_POOL_ABI = parseAbi([
    "function getSupportedChains() view returns (uint64[])",
    "function getRemoteToken(uint64 remoteChainSelector) view returns (bytes)",
    "function getCurrentInboundRateLimiterState(uint64 remoteChainSelector) view returns ((uint128 tokens, uint32 lastUpdated, bool isEnabled, uint128 capacity, uint128 rate))",
    "function getCurrentOutboundRateLimiterState(uint64 remoteChainSelector) view returns ((uint128 tokens, uint32 lastUpdated, bool isEnabled, uint128 capacity, uint128 rate))",
]);
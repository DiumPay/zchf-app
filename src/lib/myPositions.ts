import { type Address, erc20Abi } from "viem";
import { ADDRESSES } from "@config/addresses";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI as PositionV2ABI } from "@abi/position";

// dev → local grenadier. prod → deployed grenadier behind cf.
const API_BASE = import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://grenadier-zchf.enni.ch";

// ============================================================================
// API TYPES — shape of one position from grenadier
// ============================================================================

interface ApiPosition {
    version: number;
    position: Address;
    owner: Address;
    original: Address;
    parent: Address;
    collateral: Address;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    minted: string;
    price: string;
    collateralBalance: string;
    expiration: number;
    cooldown: number;
    start: number;
    closed: boolean;
    denied: boolean;
    isClone: boolean;
    isOriginal: boolean;
    annualInterestPPM: number;
    riskPremiumPPM: number;
    reserveContribution: number;
    challengePeriod: number;
    minimumCollateral: string;
    availableForPosition: string;
    availableForClones: string;
    availableForMinting: string;
    limitForPosition: string;
    limitForClones: string;
}

interface OwnerResponse {
    num: number;
    list: ApiPosition[];
}

// ============================================================================
// PERSISTENT PER-USER CACHE
// Static position metadata barely changes; cache the API rows per user so
// repeat page loads skip the network. The on-chain multicall always pulls
// fresh volatile state (minted, price, balances, allowance).
// ============================================================================

const USER_KEY_PREFIX = "frnk:userPositions:v2:";
const USER_POSITIONS_KEY = (user: Address) => `${USER_KEY_PREFIX}${user.toLowerCase()}`;
const CACHE_TTL_MS = 60_000;

interface UserPositionsCache {
    rows: ApiPosition[];
    at: number;
}

function loadUserCache(user: Address): UserPositionsCache | null {
    try {
        const raw = localStorage.getItem(USER_POSITIONS_KEY(user));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as UserPositionsCache;
        if (parsed.rows && Array.isArray(parsed.rows)) return parsed;
    } catch {}
    return null;
}

function saveUserCache(user: Address, rows: ApiPosition[]) {
    try {
        localStorage.setItem(USER_POSITIONS_KEY(user), JSON.stringify({ rows, at: Date.now() }));
    } catch {}
}

/** Wipe every per-user localStorage entry. Call after a mint (new position
 *  created) or as a manual escape hatch. */
export function clearAllPositionsCache() {
    try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(USER_KEY_PREFIX)) keys.push(k);
        }
        for (const k of keys) localStorage.removeItem(k);
    } catch {}
    lastOwnerLookup = null;
}

/** Wipe just one user's cache. */
export function clearUserPositionsCache(user: Address) {
    try { localStorage.removeItem(USER_POSITIONS_KEY(user)); } catch {}
    if (lastOwnerLookup?.user === user.toLowerCase()) lastOwnerLookup = null;
}

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface MyPositionDetail {
    address: Address;
    original: Address;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    collateral: Address;
    minted: bigint;
    price: bigint;
    collateralBalance: bigint;
    expiration: number;
    cooldown: number;
    start: number;
    challengedAmount: bigint;
    isClosed: boolean;
    limit: bigint;
    minimumCollateral: bigint;
    riskPremiumPPM: number;
    reserveContribution: number;
    annualInterestPPM: number;
    availableForMinting: bigint;
    isClone: boolean;
    userCollateralBalance: bigint;
    userZchfBalance: bigint;
    userCollateralAllowance: bigint;
}

// Holds the most recent owner lookup so loadMyPositionDetails can map back
// to its API row metadata without re-fetching.
let lastOwnerLookup: { user: string; rows: ApiPosition[] } | null = null;

// ============================================================================
// PUBLIC API
// ============================================================================

async function fetchOwnerRows(user: Address): Promise<ApiPosition[]> {
    const url = `${API_BASE}/positions/owner/${user.toLowerCase()}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    const json = (await res.json()) as OwnerResponse;
    return (json.list ?? []).filter(r =>
    r.version === 2 &&
    !r.denied &&
    !r.closed &&
    // hide empty shells: no debt AND no collateral
    !(BigInt(r.minted ?? "0") === 0n && BigInt(r.collateralBalance ?? "0") === 0n)
);
}

/**
 * Get position addresses owned by user.
 * - Cache hit (< 60s old) → instant, no network.
 * - Cache miss / forceRefresh → hit grenadier, populate cache.
 * Either way, lastOwnerLookup is set so loadMyPositionDetails has metadata.
 */
export async function findUserPositions(
    user: Address,
    opts?: { forceRefresh?: boolean }
): Promise<Address[]> {
    if (!opts?.forceRefresh) {
        const cached = loadUserCache(user);
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
            lastOwnerLookup = { user: user.toLowerCase(), rows: cached.rows };
            return cached.rows.map(r => r.position);
        }
    }

    const rows = await fetchOwnerRows(user);
    lastOwnerLookup = { user: user.toLowerCase(), rows };
    saveUserCache(user, rows);
    return rows.map(r => r.position);
}

/**
 * Hydrate full position details. Uses cached API metadata + ONE multicall
 * for fresh on-chain state and user balances.
 */
export async function loadMyPositionDetails(
    addresses: Address[],
    user: Address | null
): Promise<MyPositionDetail[]> {
    if (addresses.length === 0) return [];
    const client = getPublicClient("ethereum");
    const zchf = ADDRESSES.ethereum.zchf as Address;

    let apiRows: ApiPosition[] = [];
    if (user && lastOwnerLookup?.user === user.toLowerCase()) {
        const wanted = new Set(addresses.map(a => a.toLowerCase()));
        apiRows = lastOwnerLookup.rows.filter(r => wanted.has(r.position.toLowerCase()));
    } else if (user) {
        // Fallback: lookup wasn't primed, fetch fresh
        const fresh = await fetchOwnerRows(user);
        lastOwnerLookup = { user: user.toLowerCase(), rows: fresh };
        const wanted = new Set(addresses.map(a => a.toLowerCase()));
        apiRows = fresh.filter(r => wanted.has(r.position.toLowerCase()));
    } else {
        return [];
    }

    if (apiRows.length === 0) return [];

    const partials = apiRows.map((r): MyPositionDetail => {
        const available =
            BigInt(r.availableForPosition ?? "0") + BigInt(r.availableForClones ?? "0");
        return {
            address: r.position,
            original: r.original,
            isClone: r.isClone,
            collateralName: r.collateralName ?? "Unknown",
            collateralSymbol: r.collateralSymbol ?? "?",
            collateralDecimals: r.collateralDecimals ?? 18,
            collateral: r.collateral,
            minted: BigInt(r.minted ?? "0"),
            price: BigInt(r.price ?? "0"),
            collateralBalance: BigInt(r.collateralBalance ?? "0"),
            expiration: r.expiration ?? 0,
            cooldown: r.cooldown ?? 0,
            start: r.start ?? 0,
            challengedAmount: 0n,
            isClosed: r.closed ?? false,
            limit:
                BigInt(r.limitForPosition ?? "0") + BigInt(r.limitForClones ?? "0"),
            minimumCollateral: BigInt(r.minimumCollateral ?? "0"),
            riskPremiumPPM: r.riskPremiumPPM ?? 0,
            reserveContribution: r.reserveContribution ?? 0,
            annualInterestPPM: r.annualInterestPPM ?? 0,
            availableForMinting: available,
            userCollateralBalance: 0n,
            userZchfBalance: 0n,
            userCollateralAllowance: 0n,
        };
    });

    const FRESH_PER_POS = 4;
    const freshCalls = partials.flatMap(p => ([
        { address: p.address, abi: PositionV2ABI, functionName: "cooldown" },
        { address: p.address, abi: PositionV2ABI, functionName: "challengedAmount" },
        { address: p.address, abi: PositionV2ABI, functionName: "minted" },
        { address: p.address, abi: PositionV2ABI, functionName: "price" },
    ] as const));

    const balanceCalls = partials.map(p => ({
        address: p.collateral,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [p.address],
    } as const));

    const userCalls = user
        ? [
            { address: zchf, abi: erc20Abi, functionName: "balanceOf", args: [user] } as const,
            ...partials.flatMap(p => [
                { address: p.collateral, abi: erc20Abi, functionName: "balanceOf", args: [user] } as const,
                { address: p.collateral, abi: erc20Abi, functionName: "allowance", args: [user, p.address] } as const,
            ]),
        ]
        : [];

    let results: any[] = [];
    try {
        results = await client.multicall({
            contracts: [...freshCalls, ...balanceCalls, ...userCalls],
            allowFailure: true,
        });
    } catch (err) {
        console.warn("[mypos] multicall top-up failed:", err);
        return partials;
    }

    const freshSlice = results.slice(0, freshCalls.length);
    const balanceSlice = results.slice(freshCalls.length, freshCalls.length + balanceCalls.length);
    const userSlice = results.slice(freshCalls.length + balanceCalls.length);

    return partials.map((p, i) => {
        const base = i * FRESH_PER_POS;
        const cooldown = freshSlice[base + 0]?.result;
        const challenged = freshSlice[base + 1]?.result;
        const minted = freshSlice[base + 2]?.result;
        const price = freshSlice[base + 3]?.result;
        const collBal = balanceSlice[i]?.result;

        const out = { ...p };
        if (cooldown !== undefined) out.cooldown = Number(cooldown as bigint);
        if (challenged !== undefined) out.challengedAmount = challenged as bigint;
        if (minted !== undefined) out.minted = minted as bigint;
        if (price !== undefined) out.price = price as bigint;
        if (collBal !== undefined) out.collateralBalance = collBal as bigint;

        if (user) {
            out.userZchfBalance = (userSlice[0]?.result as bigint) ?? 0n;
            out.userCollateralBalance = (userSlice[1 + i * 2]?.result as bigint) ?? 0n;
            out.userCollateralAllowance = (userSlice[2 + i * 2]?.result as bigint) ?? 0n;
        }
        return out;
    });
}
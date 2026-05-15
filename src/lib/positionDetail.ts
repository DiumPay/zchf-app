import { erc20Abi, isAddress, type Address, zeroAddress } from "viem";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI } from "@abi/position";
import { ADDRESSES } from "@config/addresses";

// ============================================================================
// STATIC METADATA — pure on-chain reads, cached forever per address.
//
// Position immutables (collateral, limit, minimumCollateral, expiration,
// start, challengePeriod, riskPremiumPPM, reserveContribution, original)
// are set at deployment/initialization and have no setter on the V2 contract.
// They never change.
//
// ERC20 metadata (name, symbol, decimals) is also immutable per token.
// We cache it keyed by collateral address — 138 positions share ~15 tokens,
// so this saves repeat ERC20 reads across the whole app.
//
// Two localStorage namespaces:
//   frnk:posStatic:v1:<addr>  → PositionStaticDetail (serialized bigints)
//   frnk:erc20Meta:v1:<addr>  → { name, symbol, decimals }
// ============================================================================

const POS_KEY = (addr: string) => `frnk:posStatic:v1:${addr.toLowerCase()}`;
const ERC20_KEY = (addr: string) => `frnk:erc20Meta:v1:${addr.toLowerCase()}`;

export interface PositionStaticDetail {
    address: Address;
    original: Address;
    isOriginal: boolean;
    collateral: Address;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    limit: bigint;
    minimumCollateral: bigint;
    expiration: number;
    start: number;
    challengePeriod: number;
    riskPremiumPPM: number;
    reserveContribution: number;
}

export interface PositionLiveDetail {
    price: bigint;
    minted: bigint;
    availableForClones: bigint;
    cooldown: number;
    challengedAmount: bigint;
    isClosed: boolean;
    annualInterestPPM: number;
    userBalance: bigint;
    allowanceHub: bigint;
    allowanceHelper: bigint;
}

export type PositionDetail = PositionStaticDetail & PositionLiveDetail;

function loadPosCache(addr: Address): PositionStaticDetail | null {
    try {
        const raw = localStorage.getItem(POS_KEY(addr));
        if (!raw) return null;
        const j = JSON.parse(raw);
        return {
            ...j,
            limit: BigInt(j.limit),
            minimumCollateral: BigInt(j.minimumCollateral),
        };
    } catch { return null; }
}

function savePosCache(p: PositionStaticDetail) {
    try {
        localStorage.setItem(POS_KEY(p.address), JSON.stringify({
            ...p,
            limit: p.limit.toString(),
            minimumCollateral: p.minimumCollateral.toString(),
        }));
    } catch { /* quota / private mode — drop silently */ }
}

interface Erc20Meta { name: string; symbol: string; decimals: number; }

function loadErc20Cache(addr: Address): Erc20Meta | null {
    try {
        const raw = localStorage.getItem(ERC20_KEY(addr));
        return raw ? JSON.parse(raw) as Erc20Meta : null;
    } catch { return null; }
}

function saveErc20Cache(addr: Address, meta: Erc20Meta) {
    try { localStorage.setItem(ERC20_KEY(addr), JSON.stringify(meta)); }
    catch { /* ignore */ }
}

/**
 * Resolve a position's static metadata. Pure on-chain, layered cache.
 *
 * Round-trips:
 *   - Position cached + ERC20 cached → 0
 *   - Position cached only           → 0 (ERC20 lives in PositionStaticDetail already)
 *   - First visit, ERC20 known       → 1 multicall (9 position reads)
 *   - First visit, ERC20 unknown     → 2 multicalls (9 position + 3 ERC20)
 *
 * All fields are contract immutables — no setters exist on the V2 position
 * for any of them. Cache never invalidates.
 */
export async function findStaticPosition(address: string): Promise<PositionStaticDetail | null> {
    if (!isAddress(address)) return null;
    const addr = address as Address;

    // Best path: full position metadata cached.
    const cached = loadPosCache(addr);
    if (cached) return cached;

    const client = getPublicClient("ethereum");

    // 9 position immutables in one multicall.
    let r: any[];
    try {
        r = await client.multicall({
            contracts: [
                { address: addr, abi: POSITION_V2_ABI, functionName: "original" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "collateral" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "limit" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "minimumCollateral" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "expiration" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "start" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "challengePeriod" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "riskPremiumPPM" as const },
                { address: addr, abi: POSITION_V2_ABI, functionName: "reserveContribution" as const },
            ],
            allowFailure: false,
        });
    } catch {
        return null;
    }

    const original = r[0] as Address;
    const collateral = r[1] as Address;

    // ERC20 metadata: try cache first (138 positions share ~15 tokens).
    let erc20 = loadErc20Cache(collateral);
    if (!erc20) {
        try {
            const meta = await client.multicall({
                contracts: [
                    { address: collateral, abi: erc20Abi, functionName: "name" as const },
                    { address: collateral, abi: erc20Abi, functionName: "symbol" as const },
                    { address: collateral, abi: erc20Abi, functionName: "decimals" as const },
                ],
                allowFailure: false,
            });
            erc20 = {
                name: meta[0] as string,
                symbol: meta[1] as string,
                decimals: Number(meta[2]),
            };
            saveErc20Cache(collateral, erc20);
        } catch {
            return null;
        }
    }

    const result: PositionStaticDetail = {
        address: addr,
        original,
        isOriginal: addr.toLowerCase() === original.toLowerCase(),
        collateral,
        collateralName: erc20.name,
        collateralSymbol: erc20.symbol,
        collateralDecimals: erc20.decimals,
        limit: r[2] as bigint,
        minimumCollateral: r[3] as bigint,
        expiration: Number(r[4]),
        start: Number(r[5]),
        challengePeriod: Number(r[6]),
        riskPremiumPPM: Number(r[7]),
        reserveContribution: Number(r[8]),
    };

    savePosCache(result);
    return result;
}

export async function loadPositionDetail(
    p: PositionStaticDetail,
    user: Address | null
): Promise<PositionDetail> {
    const client = getPublicClient("ethereum");
    const userAddr = user ?? zeroAddress;

    const calls = [
        { address: p.address, abi: POSITION_V2_ABI, functionName: "price" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "minted" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "availableForClones" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "cooldown" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "challengedAmount" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "isClosed" as const },
        { address: p.address, abi: POSITION_V2_ABI, functionName: "annualInterestPPM" as const },
        { address: p.collateral, abi: erc20Abi, functionName: "balanceOf" as const, args: [userAddr] as const },
        { address: p.collateral, abi: erc20Abi, functionName: "allowance" as const, args: [userAddr, ADDRESSES.ethereum.mintingHubV2] as const },
        { address: p.collateral, abi: erc20Abi, functionName: "allowance" as const, args: [userAddr, ADDRESSES.ethereum.cloneHelper] as const },
    ];

    const r = await client.multicall({ contracts: calls, allowFailure: false });

    return {
        ...p,
        price: r[0] as bigint,
        minted: r[1] as bigint,
        availableForClones: r[2] as bigint,
        cooldown: Number(r[3]),
        challengedAmount: r[4] as bigint,
        isClosed: r[5] as boolean,
        annualInterestPPM: Number(r[6]),
        userBalance: r[7] as bigint,
        allowanceHub: r[8] as bigint,
        allowanceHelper: r[9] as bigint,
    };
}

export function liqPriceUnits(p: { price: bigint; collateralDecimals: number }): number {
    return Number(p.price) / Math.pow(10, 36 - p.collateralDecimals);
}

export function detailStatus(p: PositionDetail): "active" | "cooldown" | "challenged" | "closed" | "expired" | "pending" {
    if (p.isClosed) return "closed";
    if (p.expiration * 1000 < Date.now()) return "expired";
    if (p.challengedAmount > 0n) return "challenged";
    if (p.start * 1000 > Date.now()) return "pending";
    if (p.cooldown * 1000 > Date.now()) return "cooldown";
    return "active";
}

export function requiredCollateral(mintAmount: bigint, price: bigint): bigint {
    if (price === 0n) return 0n;
    return (mintAmount * 10n ** 18n + price - 1n) / price;
}

export function maxMintFor(collAmount: bigint, price: bigint): bigint {
    return (collAmount * price) / 10n ** 18n;
}

export function reserveAmount(mintAmount: bigint, reserveContributionPPM: number): bigint {
    return (mintAmount * BigInt(reserveContributionPPM)) / 1_000_000n;
}

export function upfrontFee(
    mintAmount: bigint,
    annualInterestPPM: number,
    secondsToExpiry: number
): bigint {
    if (secondsToExpiry <= 0) return 0n;
    const YEAR = 365 * 24 * 60 * 60;
    return (mintAmount * BigInt(secondsToExpiry) * BigInt(annualInterestPPM))
        / (BigInt(YEAR) * 1_000_000n);
}

export function effectiveInterestPPM(
    annualInterestPPM: number,
    reserveContributionPPM: number
): number {
    const r = reserveContributionPPM / 1_000_000;
    return Math.round(annualInterestPPM / (1 - r));
}

export function sentToWallet(
    mintAmount: bigint,
    reserveContributionPPM: number,
    annualInterestPPM: number,
    secondsToExpiry: number
): bigint {
    const reserve = reserveAmount(mintAmount, reserveContributionPPM);
    const fee = upfrontFee(mintAmount, annualInterestPPM, secondsToExpiry);
    if (mintAmount < reserve + fee) return 0n;
    return mintAmount - reserve - fee;
}
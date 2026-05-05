import { erc20Abi, type Address } from "viem";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI } from "@abi/position";

const INDEXER_BASE = "https://api.enni.ch";

interface IndexerLatest {
    borrow: string;
    borrowBlock: number;
    updatedAt: number;
}

interface IndexerBorrowRow {
    collateral: Address;
    totalPositions: number;
    activePositions: number;
    bestPrice: { positionAddress: Address; value: string } | null;
    bestInterest: { positionAddress: Address; valuePPM: number } | null;
    bestExpiration: { positionAddress: Address; value: number } | null;
    bestAvailability: { positionAddress: Address; value: string } | null;
    alternatives: Address[];
}

interface IndexerBorrowFile {
    block: number;
    rows: IndexerBorrowRow[];
    updatedAt: number;
}

export interface Position {
    address: Address;
    collateral: Address;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    price: bigint;
    expiration: number;
    annualInterestPPM: number;
    reserveContribution: number;
    availableForClones: bigint;
    isClosed: boolean;
    cooldown: number;
    challengedAmount: bigint;
}

/**
 * Borrow-table data: indexer gives us the curated "best of each axis" per
 * collateral. We only need to enrich each row's bestPrice position with
 * collateral metadata + a bit of fresh state for the UI.
 */
export async function loadPositionsCached(): Promise<Position[]> {
    // 1. Fetch curated list from indexer (2 edge-cached HTTP calls)
    const latest = await fetch(`${INDEXER_BASE}/latest.json`).then(r => r.json()) as IndexerLatest;
    const borrow = await fetch(`${INDEXER_BASE}/${latest.borrow}`).then(r => r.json()) as IndexerBorrowFile;

    // 2. For each row, the position to display is bestPrice's positionAddress.
    //    (Highest liquidation price = most generous mint-to-collateral ratio.)
    const rows = borrow.rows.filter(r => r.bestPrice !== null);

    // 3. One multicall: fetch collateral metadata + per-position fresh state
    const client = getPublicClient("ethereum");

    const calls = rows.flatMap(r => [
        { address: r.collateral, abi: erc20Abi, functionName: "name" as const },
        { address: r.collateral, abi: erc20Abi, functionName: "symbol" as const },
        { address: r.collateral, abi: erc20Abi, functionName: "decimals" as const },
        { address: r.bestPrice!.positionAddress, abi: POSITION_V2_ABI, functionName: "expiration" as const },
        { address: r.bestPrice!.positionAddress, abi: POSITION_V2_ABI, functionName: "annualInterestPPM" as const },
        { address: r.bestPrice!.positionAddress, abi: POSITION_V2_ABI, functionName: "reserveContribution" as const },
    ]);

    const results = await client.multicall({ contracts: calls, allowFailure: true, batchSize: 1024 });
    const FIELDS = 6;

    return rows.map((r, i) => {
        const base = i * FIELDS;
        const get = <T>(idx: number, fb: T): T => {
            const x = results[base + idx];
            return x && x.status === "success" ? (x.result as T) : fb;
        };

        return {
            address: r.bestPrice!.positionAddress,
            collateral: r.collateral,
            collateralName: get<string>(0, "Unknown"),
            collateralSymbol: get<string>(1, "?"),
            collateralDecimals: Number(get<number>(2, 18)),
            price: BigInt(r.bestPrice!.value),
            expiration: r.bestExpiration?.value ?? 0,
            annualInterestPPM: Number(get<number>(4, 0)),
            reserveContribution: Number(get<number>(5, 0)),
            availableForClones: BigInt(r.bestAvailability?.value ?? "0"),
            isClosed: false,
            cooldown: 0,
            challengedAmount: 0n,
        };
    });
}

export function liquidationPriceUnits(p: Position): number {
    return Number(p.price) / Math.pow(10, 36 - p.collateralDecimals);
}

export function effectiveInterestPPM(p: { annualInterestPPM: number; reserveContribution: number }): number {
    if (p.reserveContribution >= 1_000_000) return p.annualInterestPPM;
    const r = p.reserveContribution / 1_000_000;
    return Math.round(p.annualInterestPPM / (1 - r));
}

export function positionStatus(p: Position): "active" | "cooldown" | "challenged" | "closed" | "expired" {
    if (p.isClosed) return "closed";
    if (p.expiration * 1000 < Date.now()) return "expired";
    if (p.challengedAmount > 0n) return "challenged";
    if (p.cooldown * 1000 > Date.now()) return "cooldown";
    return "active";
}

export function clearPositionsCache(): void {
    /* no-op — indexer + edge cache handle this */
}
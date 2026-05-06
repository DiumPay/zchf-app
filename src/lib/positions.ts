import { type Address, getAddress } from "viem";

const API_BASE = "https://api.frankencoin.com";
const POSITIONS_URL = `${API_BASE}/positions/open`;

/**
 * Raw shape returned by https://api.frankencoin.com/positions/open
 */
interface ApiPosition {
    version: number;
    position: Address;
    owner: Address;
    collateral: Address;
    price: string;
    created: number;
    isOriginal: boolean;
    isClone: boolean;
    denied: boolean;
    denyDate: number;
    closed: boolean;
    original: Address;
    parent: Address;
    minimumCollateral: string;
    annualInterestPPM: number;
    riskPremiumPPM: number;
    reserveContribution: number;
    start: number;
    cooldown: number;
    expiration: number;
    challengePeriod: number;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    collateralBalance: string;
    limitForPosition: string;
    limitForClones: string;
    availableForClones: string;
    availableForMinting: string;
    availableForPosition: string;
    minted: string;
}

interface ApiResponse {
    num: number;
    addresses: Address[];
    map: Record<string, ApiPosition>;
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

// Tiny in-memory cache so repeated navigations within the same session don't refetch.
// The endpoint itself is edge-cached, so this is just a UX nicety.
let cache: { data: Position[]; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function fetchAllPositions(): Promise<ApiPosition[]> {
    const res = await fetch(POSITIONS_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`positions API ${res.status}`);
    const json = (await res.json()) as ApiResponse;
    return json.addresses.map(a => json.map[a]).filter(Boolean);
}

function curateBorrowRows(all: ApiPosition[]): Position[] {
    const now = Math.floor(Date.now() / 1000);

    const isActive = (p: ApiPosition): boolean =>
        !p.closed
        && !p.denied
        && p.start <= now
        && p.cooldown <= now
        && p.expiration > now
        && BigInt(p.availableForClones) > 0n;

    // Group by collateral address (lowercased so checksum casing doesn't matter)
    const groups = new Map<string, ApiPosition[]>();
    for (const p of all) {
        const key = p.collateral.toLowerCase();
        const arr = groups.get(key) ?? [];
        arr.push(p);
        groups.set(key, arr);
    }

    const rows: Position[] = [];

    for (const group of groups.values()) {
        const active = group.filter(isActive);
        if (active.length === 0) continue;

        // Best price = highest liquidation price (most generous mint ratio).
        const best = active.reduce((acc, cur) =>
            BigInt(cur.price) > BigInt(acc.price) ? cur : acc
        );

        // Best expiration across the *active* set — used so the row shows the
        // longest-lived option for that collateral, not necessarily the bestPrice's.
        const bestExpiration = active.reduce((acc, cur) =>
            cur.expiration > acc.expiration ? cur : acc
        );

        // Best availability across the active set — sum-ish proxy for "pool capacity".
        const bestAvailability = active.reduce((acc, cur) =>
            BigInt(cur.availableForClones) > BigInt(acc.availableForClones) ? cur : acc
        );

        rows.push({
            address: best.position,
            collateral: getAddress(best.collateral),
            collateralName: best.collateralName,
            collateralSymbol: best.collateralSymbol,
            collateralDecimals: Number(best.collateralDecimals),
            price: BigInt(best.price),
            expiration: bestExpiration.expiration,
            annualInterestPPM: Number(best.annualInterestPPM),
            reserveContribution: Number(best.reserveContribution),
            availableForClones: BigInt(bestAvailability.availableForClones),
            isClosed: false,
            cooldown: 0,
            challengedAmount: 0n,
        });
    }

    return rows;
}

export async function loadPositionsCached(): Promise<Position[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
    const all = await fetchAllPositions();
    const rows = curateBorrowRows(all);
    cache = { data: rows, at: Date.now() };
    return rows;
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
    cache = null;
}
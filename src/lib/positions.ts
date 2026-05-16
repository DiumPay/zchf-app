import { type Address, getAddress } from "viem";

// dev → local grenadier. prod build → deployed grenadier behind cf.
const API_BASE = import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://grenadier-zchf.enni.ch";

const POSITIONS_URL = `${API_BASE}/positions/curated`;

/**
 * Raw shape returned by grenadier's /positions/curated endpoint.
 * Same field names as frankencoin's API, server-side curation already applied.
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
    list: ApiPosition[];
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
// Grenadier itself caches for 5s and cf in front caches too — this is just UX.
let cache: { data: Position[]; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function fetchAllPositions(): Promise<ApiPosition[]> {
    const res = await fetch(POSITIONS_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`positions API ${res.status}`);
    const json = (await res.json()) as ApiResponse;
    return json.list ?? [];
}

/**
 * Map raw API positions to our internal Position type.
 * Grenadier's /positions/curated already returns one position per collateral
 * (best effective interest, longest expiration), so we just shape the fields.
 */
function shapePositions(all: ApiPosition[]): Position[] {
    return all.map(p => ({
        address: p.position,
        collateral: getAddress(p.collateral),
        collateralName: p.collateralName,
        collateralSymbol: p.collateralSymbol,
        collateralDecimals: Number(p.collateralDecimals),
        price: BigInt(p.price),
        expiration: p.expiration,
        annualInterestPPM: Number(p.annualInterestPPM),
        reserveContribution: Number(p.reserveContribution),
        availableForClones: BigInt(p.availableForClones),
        isClosed: p.closed,
        cooldown: p.cooldown,
        challengedAmount: 0n, // grenadier doesn't track challenges yet; safe default.
    }));
}

export async function loadPositionsCached(): Promise<Position[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
    const all = await fetchAllPositions();
    const rows = shapePositions(all);
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

// ---------------------------------------------------------------------------
// Monitored positions — every still-alive position eligible for challenge.
// Different endpoint, different shape (has challengedCollateral), so kept
// separate from loadPositionsCached. We don't reuse `Position` because the
// monitoring view doesn't care about reserve / interest / availableForClones
// and needs `minted` + `challengedCollateral` that the borrow view doesn't.
// ---------------------------------------------------------------------------

const MONITORED_URL = `${API_BASE}/positions/monitored`;

interface ApiMonitoredPosition extends ApiPosition {
    challengedCollateral: string;
}

interface ApiMonitoredResponse {
    num: number;
    list: ApiMonitoredPosition[];
}

export interface MonitoredPosition {
    address: Address;
    owner: Address;
    collateral: Address;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    price: bigint;
    collateralBalance: bigint;
    minted: bigint;
    minimumCollateral: bigint;
    challengedCollateral: bigint;
    expiration: number;
    cooldown: number;
    challengePeriod: number;
    annualInterestPPM: number;
    reserveContribution: number;
}

let monitoredCache: { data: MonitoredPosition[]; at: number } | null = null;

export async function loadMonitoredCached(): Promise<MonitoredPosition[]> {
    if (monitoredCache && Date.now() - monitoredCache.at < CACHE_TTL_MS) return monitoredCache.data;
    const res = await fetch(MONITORED_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`monitored API ${res.status}`);
    const json = (await res.json()) as ApiMonitoredResponse;
    const rows: MonitoredPosition[] = (json.list ?? []).map(p => ({
        address: p.position,
        owner: getAddress(p.owner),
        collateral: getAddress(p.collateral),
        collateralName: p.collateralName,
        collateralSymbol: p.collateralSymbol,
        collateralDecimals: Number(p.collateralDecimals),
        price: BigInt(p.price),
        collateralBalance: BigInt(p.collateralBalance),
        minted: BigInt(p.minted),
        minimumCollateral: BigInt(p.minimumCollateral),
        // Grenadier returns "0" when no open challenges. BigInt("0") is fine.
        challengedCollateral: BigInt(p.challengedCollateral ?? "0"),
        expiration: p.expiration,
        cooldown: p.cooldown,
        challengePeriod: Number(p.challengePeriod),
        annualInterestPPM: Number(p.annualInterestPPM),
        reserveContribution: Number(p.reserveContribution),
    }));
    monitoredCache = { data: rows, at: Date.now() };
    return rows;
}

export function clearMonitoredCache(): void {
    monitoredCache = null;
}
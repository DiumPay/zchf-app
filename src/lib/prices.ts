import { parseAbi } from "viem";
import { getPublicClient } from "@lib/client";

/**
 * Browser-friendly price oracle. No API keys, no CORS-restricted sources.
 *
 * Strategy per asset: try a chain of public endpoints, first success wins.
 * localStorage cache keeps results across reloads and avoids hammering APIs.
 *
 * For the 5 illiquid tokens (BOSS, REALU, SPYon, LENDS, FPS) we route through
 * grenadier first since no public oracle covers them. Grenadier proxies
 * api.frankencoin.com which sources from defillama / thegraph / on-chain.
 */

const CACHE_PREFIX = "fc-price:";
const PRICE_TTL_MS = 5 * 60 * 1000;
const FX_TTL_MS = 60 * 60 * 1000;

// dev → local grenadier. prod → deployed grenadier behind cf.
const GRENADIER_BASE = import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://grenadier.frankencoin.win";

// Tokens grenadier tracks via /prices/ticker. Anything outside this set falls
// through to the public sources below.
const GRENADIER_TRACKED = new Set(["BOSS", "REALU", "SPYON", "LENDS", "FPS"]);

type CachedValue = { v: number; t: number };

function readCache(key: string, ttlMs: number): number | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const { v, t } = JSON.parse(raw) as CachedValue;
        if (Date.now() - t > ttlMs) return null;
        return v;
    } catch {
        return null;
    }
}

function writeCache(key: string, value: number): void {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ v: value, t: Date.now() }));
    } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/* Source adapters — each returns USD or throws.                       */
/* ------------------------------------------------------------------ */

async function fromCoinbase(productId: string): Promise<number> {
    const r = await fetch(`https://api.coinbase.com/v2/prices/${productId}/spot`);
    if (!r.ok) throw new Error(`coinbase ${r.status}`);
    const j = await r.json();
    const p = parseFloat(j?.data?.amount);
    if (!Number.isFinite(p) || p <= 0) throw new Error("coinbase bad price");
    return p;
}

async function fromKraken(pair: string): Promise<number> {
    const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
    if (!r.ok) throw new Error(`kraken ${r.status}`);
    const j = await r.json();
    const k = j?.result && Object.keys(j.result)[0];
    const p = parseFloat(j?.result?.[k]?.c?.[0]);
    if (!Number.isFinite(p) || p <= 0) throw new Error("kraken bad price");
    return p;
}

async function fromDefiLlama(coinKey: string): Promise<number> {
    const r = await fetch(`https://coins.llama.fi/prices/current/${coinKey}`);
    if (!r.ok) throw new Error(`defillama ${r.status}`);
    const j = await r.json();
    const p = j?.coins?.[coinKey]?.price;
    if (!Number.isFinite(p) || p <= 0) throw new Error("defillama no price");
    return p as number;
}

async function fromCoincap(slug: string): Promise<number> {
    const r = await fetch(`https://api.coincap.io/v2/assets/${slug}`);
    if (!r.ok) throw new Error(`coincap ${r.status}`);
    const j = await r.json();
    const p = parseFloat(j?.data?.priceUsd);
    if (!Number.isFinite(p) || p <= 0) throw new Error("coincap bad price");
    return p;
}

/* ------------------------------------------------------------------ */
/* Grenadier — single source for both USD and CHF on the 5 illiquid    */
/* tokens (BOSS, REALU, SPYon, LENDS, FPS). One fetch fills both       */
/* caches so getPriceUSD and getMarketPriceCHF share the same call.    */
/* ------------------------------------------------------------------ */

interface GrenadierPrice {
    address: string;
    symbol: string;
    decimals: number;
    chainId: number;
    source: string;
    timestamp: number;
    chf: number;
    usd: number;
}

// In-flight dedup: if two callers hit the same ticker before the first
// returns, both await the same promise.
const grenadierInflight = new Map<string, Promise<GrenadierPrice | null>>();

async function fetchGrenadierTicker(symbolUpper: string): Promise<GrenadierPrice | null> {
    const existing = grenadierInflight.get(symbolUpper);
    if (existing) return existing;

    const p = (async (): Promise<GrenadierPrice | null> => {
        try {
            const r = await fetch(`${GRENADIER_BASE}/prices/ticker/${symbolUpper}`);
            if (!r.ok) return null;
            const j = (await r.json()) as GrenadierPrice;
            if (!Number.isFinite(j?.usd) || j.usd <= 0) return null;
            return j;
        } catch {
            return null;
        }
    })();
    grenadierInflight.set(symbolUpper, p);
    try {
        return await p;
    } finally {
        grenadierInflight.delete(symbolUpper);
    }
}

/**
 * Side-effect: writes both usd and chf caches when grenadier responds. Returns
 * the USD price (or throws so it slots into the existing Source chain).
 */
async function fromGrenadierUSD(symbolUpper: string): Promise<number> {
    const j = await fetchGrenadierTicker(symbolUpper);
    if (!j) throw new Error(`grenadier ${symbolUpper} unavailable`);
    if (Number.isFinite(j.chf) && j.chf > 0) {
        writeCache(`chf:${symbolUpper}`, j.chf);
    }
    return j.usd;
}

type Source = () => Promise<number>;

async function tryFirst(sources: Source[]): Promise<number | null> {
    for (const src of sources) {
        try { return await src(); } catch { /* next */ }
    }
    return null;
}

const eth = (addr: string) => `ethereum:${addr.toLowerCase()}`;

/* ------------------------------------------------------------------ */
/* On-chain helper for ysyBOLD: 1 share -> N BOLD via pricePerShare()  */
/* ------------------------------------------------------------------ */

const YSYBOLD_TOKEN = "0x23346B04a7f55b8760E5860AA5A77383D63491cD" as const;
const YSYBOLD_ABI = parseAbi(["function pricePerShare() view returns (uint256)"]);

async function ysyBoldSharesPerBold(): Promise<number> {
    const cached = readCache("ratio:ysybold", PRICE_TTL_MS);
    if (cached !== null) return cached;

    const client = getPublicClient("ethereum");
    const pps = await client.readContract({
        address: YSYBOLD_TOKEN,
        abi: YSYBOLD_ABI,
        functionName: "pricePerShare",
    });
    const ratio = Number(pps) / 1e18;
    if (!Number.isFinite(ratio) || ratio <= 0) throw new Error("ysybold bad ratio");

    writeCache("ratio:ysybold", ratio);
    return ratio;
}

/* ------------------------------------------------------------------ */
/* Per-symbol source chains. Symbols not listed -> null -> N/A in UI.  */
/* ------------------------------------------------------------------ */

const SOURCES: Record<string, Source[]> = {
    WBTC: [
        () => fromCoinbase("BTC-USD"),
        () => fromKraken("XBTUSD"),
        () => fromDefiLlama(eth("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")),
        () => fromCoincap("bitcoin"),
    ],
    CBBTC: [
        () => fromCoinbase("BTC-USD"),
        () => fromKraken("XBTUSD"),
        () => fromDefiLlama(eth("0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf")),
        () => fromCoincap("bitcoin"),
    ],
    WETH: [
        () => fromCoinbase("ETH-USD"),
        () => fromKraken("ETHUSD"),
        () => fromDefiLlama(eth("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")),
        () => fromCoincap("ethereum"),
    ],

    PAXG: [
        () => fromDefiLlama(eth("0x45804880De22913dAFE09f4980848ECE6EcbAf78")),
    ],
    XAUT: [
        () => fromDefiLlama(eth("0x68749665FF8D2d112Fa859AA293F07A622782F38")),
    ],

    CRV: [
        () => fromCoinbase("CRV-USD"),
        () => fromKraken("CRVUSD"),
        () => fromDefiLlama(eth("0xD533a949740bb3306d119CC777fa900bA034cd52")),
        () => fromCoincap("curve-dao-token"),
    ],
    GNO: [
        () => fromCoinbase("GNO-USD"),
        () => fromKraken("GNOUSD"),
        () => fromDefiLlama(eth("0x6810e776880C02933D47DB1b9fc05908e5386b96")),
        () => fromCoincap("gnosis-gno"),
    ],

    LSETH: [
        () => fromDefiLlama(eth("0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549")),
    ],
    WSTETH: [
        () => fromDefiLlama(eth("0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0")),
    ],

    // BOLD: pulled from DEX-aware indexer. Falls back to 1.0 only if everything fails.
    BOLD: [
        () => fromDefiLlama(eth("0x6440f144b7e50d6a8439336510312d2f54beb01d")),
        async () => 1.0, // pegged stablecoin; trust the peg as last resort
    ],

    // ysyBOLD = on-chain pricePerShare * BOLD/USD
    YSYBOLD: [
        async () => {
            const [ratio, boldUsd] = await Promise.all([
                ysyBoldSharesPerBold(),
                getPriceUSD("BOLD"),
            ]);
            if (boldUsd === null) throw new Error("BOLD price unavailable");
            return ratio * boldUsd;
        },
        () => fromDefiLlama(eth("0x23346B04a7f55b8760E5860AA5A77383D63491cD")),
    ],

    // The 5 illiquid tokens — grenadier proxies upstream feeds that cover
    // these (defillama / thegraph / on-chain). No public fallback available.
    BOSS:  [() => fromGrenadierUSD("BOSS")],
    REALU: [() => fromGrenadierUSD("REALU")],
    SPYON: [() => fromGrenadierUSD("SPYON")],
    LENDS: [() => fromGrenadierUSD("LENDS")],
    FPS:   [() => fromGrenadierUSD("FPS")],
};

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export async function getPriceUSD(symbol: string): Promise<number | null> {
    const key = symbol.toUpperCase();
    const sources = SOURCES[key];
    if (!sources) return null;

    const cacheKey = `usd:${key}`;
    const cached = readCache(cacheKey, PRICE_TTL_MS);
    if (cached !== null) return cached;

    const fresh = await tryFirst(sources);
    if (fresh !== null) writeCache(cacheKey, fresh);
    return fresh;
}

export async function getUsdChfRate(): Promise<number | null> {
    const cached = readCache("fx:usdchf", FX_TTL_MS);
    if (cached !== null) return cached;

    const rate = await tryFirst([
        async () => {
            const r = await fetch("https://open.er-api.com/v6/latest/USD");
            if (!r.ok) throw new Error(`er-api ${r.status}`);
            const j = await r.json();
            const v = j?.rates?.CHF;
            if (!Number.isFinite(v) || v <= 0) throw new Error("er-api no rate");
            return v as number;
        },
        async () => {
            const r = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=CHF");
            if (!r.ok) throw new Error(`exchangerate.host ${r.status}`);
            const j = await r.json();
            const v = j?.rates?.CHF;
            if (!Number.isFinite(v) || v <= 0) throw new Error("exchangerate.host no rate");
            return v as number;
        },
    ]);
    if (rate !== null) writeCache("fx:usdchf", rate);
    return rate;
}

export async function getMarketPriceCHF(symbol: string): Promise<number | null> {
    const key = symbol.toUpperCase();

    // Fast path for grenadier-tracked tokens: the upstream feed already
    // gives us a direct CHF value, no FX rate hop needed.
    if (GRENADIER_TRACKED.has(key)) {
        const cached = readCache(`chf:${key}`, PRICE_TTL_MS);
        if (cached !== null) return cached;

        // fromGrenadierUSD writes the chf cache as a side effect. Pull it
        // back out after the fetch resolves. If grenadier fails, fall
        // through to the multiplied path below — won't help for these
        // tokens but is harmless.
        const usd = await getPriceUSD(key);
        const afterFetch = readCache(`chf:${key}`, PRICE_TTL_MS);
        if (afterFetch !== null) return afterFetch;
        if (usd === null) return null;
        // Grenadier returned USD but not CHF (unlikely) — fall back to FX.
        const rate = await getUsdChfRate();
        return rate === null ? null : usd * rate;
    }

    // Default: USD price * USD/CHF FX rate.
    const [usd, rate] = await Promise.all([getPriceUSD(key), getUsdChfRate()]);
    if (usd === null || rate === null) return null;
    return usd * rate;
}

export function clearPriceCache(): void {
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
        }
    } catch { /* ignore */ }
}
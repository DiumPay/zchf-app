/**
 * Free, no-key price oracle for the borrow page.
 *
 * Two-layer design:
 *   1. Per-symbol "source chain" — an ordered list of endpoint adapters.
 *      We call them in order and return the first valid number. This is the
 *      redundancy: if Binance is rate-limiting or down, we fall through to
 *      Coinbase, then Kraken, then DefiLlama, then CoinCap.
 *   2. localStorage cache with TTL. Prices are cached 5 minutes, FX 1 hour.
 *      That keeps page reloads fast and avoids hammering free APIs.
 *
 * Every endpoint here is public, no API key, CORS-enabled.
 */

const CACHE_PREFIX = "fc-price:";
const PRICE_TTL_MS = 5 * 60 * 1000;   // crypto: 5 min
const FX_TTL_MS = 60 * 60 * 1000;     // forex: 1 h (CHF/USD doesn't move much)

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
    } catch {
        /* private mode / quota exceeded — ignore, we'll just refetch */
    }
}

/* ------------------------------------------------------------------ */
/* Source adapters — each returns USD price or throws.                */
/* ------------------------------------------------------------------ */

async function fromBinance(symbol: string): Promise<number> {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (!r.ok) throw new Error(`binance ${r.status}`);
    const j = await r.json();
    const p = parseFloat(j.price);
    if (!Number.isFinite(p) || p <= 0) throw new Error("binance bad price");
    return p;
}

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
    // Kraken returns { result: { XXBTZUSD: { c: ["price", "vol"] } } }
    const k = j?.result && Object.keys(j.result)[0];
    const p = parseFloat(j?.result?.[k]?.c?.[0]);
    if (!Number.isFinite(p) || p <= 0) throw new Error("kraken bad price");
    return p;
}

async function fromDefiLlama(coinKey: string): Promise<number> {
    // coinKey format: "ethereum:0xabc..."
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

type Source = () => Promise<number>;

/** Try each source in order, return first success, or null if all fail. */
async function tryFirst(sources: Source[]): Promise<number | null> {
    for (const src of sources) {
        try {
            return await src();
        } catch {
            /* fall through to next source */
        }
    }
    return null;
}

const eth = (addr: string) => `ethereum:${addr.toLowerCase()}`;

/* ------------------------------------------------------------------ */
/* Per-symbol source chains.                                           */
/* Symbols not in this map => no oracle available => N/A in UI.        */
/* ------------------------------------------------------------------ */

const SOURCES: Record<string, Source[]> = {
    // BTC family — WBTC and cbBTC peg 1:1 with BTC for valuation
    WBTC: [
        () => fromBinance("BTCUSDT"),
        () => fromCoinbase("BTC-USD"),
        () => fromKraken("XBTUSD"),
        () => fromDefiLlama(eth("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")),
        () => fromCoincap("bitcoin"),
    ],
    CBBTC: [
        () => fromBinance("BTCUSDT"),
        () => fromCoinbase("BTC-USD"),
        () => fromKraken("XBTUSD"),
        () => fromDefiLlama(eth("0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf")),
        () => fromCoincap("bitcoin"),
    ],

    // ETH
    WETH: [
        () => fromBinance("ETHUSDT"),
        () => fromCoinbase("ETH-USD"),
        () => fromKraken("ETHUSD"),
        () => fromDefiLlama(eth("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")),
        () => fromCoincap("ethereum"),
    ],

    // Gold-backed — keep separate, premiums differ between PAXG and XAUt
    PAXG: [
        () => fromBinance("PAXGUSDT"),
        () => fromDefiLlama(eth("0x45804880De22913dAFE09f4980848ECE6EcbAf78")),
    ],
    XAUT: [
        () => fromDefiLlama(eth("0x68749665FF8D2d112Fa859AA293F07A622782F38")),
    ],

    // Liquid ERC20s
    CRV: [
        () => fromBinance("CRVUSDT"),
        () => fromCoinbase("CRV-USD"),
        () => fromDefiLlama(eth("0xD533a949740bb3306d119CC777fa900bA034cd52")),
        () => fromCoincap("curve-dao-token"),
    ],
    GNO: [
        () => fromBinance("GNOUSDT"),
        () => fromCoinbase("GNO-USD"),
        () => fromDefiLlama(eth("0x6810e776880C02933D47DB1b9fc05908e5386b96")),
        () => fromCoincap("gnosis-gno"),
    ],

    // LSTs — must be priced individually, NOT as ETH (different exchange rates)
    LSETH: [
        () => fromDefiLlama(eth("0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549")),
    ],
    WSTETH: [
        () => fromDefiLlama(eth("0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0")),
    ],

    // DeFi vault token — DefiLlama indexes via DEX pool routes
    YSYBOLD: [
        () => fromDefiLlama(eth("0x23346B04a7f55b8760E5860AA5A77383D63491cD")),
    ],

    // BOSS, LENDS, REALU, SPYON intentionally not listed -> N/A
};

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/** USD price for 1 unit of the collateral. null if no oracle is configured. */
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

/** USD -> CHF conversion rate. ZCHF is treated 1:1 with CHF. */
export async function getUsdChfRate(): Promise<number | null> {
    const cached = readCache("fx:usdchf", FX_TTL_MS);
    if (cached !== null) return cached;

    const rate = await tryFirst([
        async () => {
            const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=CHF");
            if (!r.ok) throw new Error(`frankfurter ${r.status}`);
            const j = await r.json();
            const v = j?.rates?.CHF;
            if (!Number.isFinite(v) || v <= 0) throw new Error("frankfurter no rate");
            return v as number;
        },
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

/** Market price of 1 collateral unit in ZCHF. null = oracle unavailable. */
export async function getMarketPriceCHF(symbol: string): Promise<number | null> {
    const [usd, rate] = await Promise.all([getPriceUSD(symbol), getUsdChfRate()]);
    if (usd === null || rate === null) return null;
    return usd * rate;
}

/** Manual cache bust if you ever need it (e.g. a "refresh" button). */
export function clearPriceCache(): void {
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
        }
    } catch {
        /* ignore */
    }
}
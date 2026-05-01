// -------------------------------------------------------------
// Multi-endpoint balanced transport for viem.
//
// Two-tier strategy:
//   Tier 1 — User-supplied RPC (if set in localStorage["userRpc"])
//            Tried alone, no fanout. Saves user's compute units.
//   Tier 2 — Public pool fallback. Hedged racing, EWMA scoring, breakers.
// -------------------------------------------------------------

import { custom, type Transport, type EIP1193RequestFn } from "viem";

export interface BalancedTransportConfig {
    pool: string[];
    chainIdHex?: string;

    perAttemptMs?: number;
    totalBudgetMs?: number;
    maxRetries?: number;
    coldFanout?: number;
    warmFanout?: number;
    promoteWins?: number;
    stickyTtlMs?: number;

    callTtlMs?: number;
    blockAwareCache?: boolean;
    maxCacheEntries?: number;

    ewmaAlpha?: number;
    cooldownMs?: number;
    unhealthyThreshold?: number;

    jitterMinMs?: number;
    jitterMaxMs?: number;

    methodPerAttemptMs?: Record<string, number>;
    methodFanout?: Record<string, number>;

    dnsWarmup?: boolean;
    stalenessBlockPenalty?: number;

    persistKey?: string;
    userRpcKey?: string;
    userRpcTimeoutMs?: number;
    userRpcFailThreshold?: number;
    userRpcCooldownMs?: number;

    onWin?: (e: { url: string; ms: number; method: string; tier: "user" | "pool" }) => void;
    onFail?: (e: { url: string; err: unknown; method: string; tier: "user" | "pool" }) => void;
    onBreaker?: (e: { url: string; open: boolean }) => void;
}

export const WALLET_ONLY_METHODS = new Set<string>([
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "personal_sign",
    "eth_sign",
    "eth_signTypedData",
    "eth_signTypedData_v3",
    "eth_signTypedData_v4",
    "wallet_switchEthereumChain",
    "wallet_addEthereumChain",
    "wallet_requestPermissions",
    "wallet_getPermissions",
    "wallet_watchAsset",
    "eth_requestAccounts",
    "eth_accounts",
]);

const NEVER_CACHE = new Set<string>([
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "eth_estimateGas",
    "eth_gasPrice",
    "eth_maxPriorityFeePerGas",
    "eth_feeHistory",
]);

const DEFAULTS = {
    perAttemptMs: 1500,
    totalBudgetMs: 10_000,
    maxRetries: 3,
    coldFanout: 3,
    warmFanout: 2,
    promoteWins: 2,
    stickyTtlMs: 60_000,
    callTtlMs: 400,
    blockAwareCache: false,
    maxCacheEntries: 2000,
    ewmaAlpha: 0.25,
    cooldownMs: 15_000,
    unhealthyThreshold: 0.65,
    jitterMinMs: 50,
    jitterMaxMs: 300,
    dnsWarmup: true,
    stalenessBlockPenalty: 2,
    persistKey: "rpc-balancer-breakers",
    userRpcKey: "userRpc",
    userRpcTimeoutMs: 3000,
    userRpcFailThreshold: 3,
    userRpcCooldownMs: 30_000,
} as const;

const MAX_RATE_LIMIT_COOLDOWN_MS = 5 * 60_000;

interface EndpointState {
    url: string;
    latEwma: number;
    errEwma: number;
    wins: number;
    breakerUntil: number;
    lastBlockSeen: number;
    lastBlockSeenAt: number;
}

const nowMs = () => Date.now();

function makeEndpoint(url: string): EndpointState {
    return { url, latEwma: 800, errEwma: 0, wins: 0, breakerUntil: 0, lastBlockSeen: 0, lastBlockSeenAt: 0 };
}

const ewma = (prev: number, sample: number, alpha: number) =>
    prev * (1 - alpha) + sample * alpha;

const jitter = (min: number, max: number) => min + Math.random() * (max - min);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function fastCacheKey(method: string, params: unknown[], block?: number | null): string {
    return `${method}|${JSON.stringify(params)}|${block ?? "~"}`;
}

function endpointScore(e: EndpointState, tipBlock: number | undefined, staleThreshold: number) {
    const latScore = 1 / (1 + e.latEwma);
    const ok = 1 - e.errEwma;
    const healthy = e.breakerUntil > nowMs() ? 0.01 : 1;
    let freshness = 1;
    if (tipBlock && e.lastBlockSeen > 0 && e.lastBlockSeenAt > nowMs() - 30_000) {
        const behind = tipBlock - e.lastBlockSeen;
        if (behind > staleThreshold) {
            freshness = Math.max(0.05, 1 / (1 + (behind - staleThreshold) * 0.5));
        }
    }
    return latScore * ok * healthy * freshness;
}

function weightedSample(arr: EndpointState[], k: number, tipBlock: number | undefined, staleThreshold: number): EndpointState[] {
    const items = arr.slice();
    const out: EndpointState[] = [];
    for (let i = 0; i < k && items.length; i++) {
        const total = items.reduce((s, it) => s + endpointScore(it, tipBlock, staleThreshold), 0);
        let r = Math.random() * total;
        let idx = 0;
        while (idx < items.length && (r -= endpointScore(items[idx], tipBlock, staleThreshold)) > 0) idx++;
        const [pick] = items.splice(Math.min(idx, items.length - 1), 1);
        out.push(pick);
    }
    return out;
}

// Browser-native DNS + TLS warmup via <link rel="preconnect">.
// No HTTP request is made — DevTools Network tab stays clean.
function prefetchDns(urls: string[]) {
    if (typeof document === "undefined") return;
    for (const url of urls) {
        try {
            const origin = new URL(url).origin;
            if (document.head.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
                continue;
            }
            const link = document.createElement("link");
            link.rel = "preconnect";
            link.href = origin;
            link.crossOrigin = "anonymous";
            document.head.appendChild(link);
        } catch {
            // ignore malformed URLs
        }
    }
}

function readUserRpc(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    try {
        const v = localStorage.getItem(key);
        if (!v) return null;
        const trimmed = v.trim();
        if (!trimmed.startsWith("http")) return null;
        return trimmed;
    } catch {
        return null;
    }
}

class RpcBalancer {
    private cfg: Required<Omit<BalancedTransportConfig, "chainIdHex" | "methodPerAttemptMs" | "methodFanout" | "onWin" | "onFail" | "onBreaker" | "pool">> & BalancedTransportConfig;
    private endpoints: EndpointState[];
    private stickyUrl: string | null = null;
    private stickyExpires = 0;
    private inflight = new Map<string, Promise<unknown>>();
    private tinyCache = new Map<string, { value: unknown; expires: number; block?: number }>();
    private lastBlock?: number;
    private lastBlockCheckedAt = 0;
    private userRpcUrl: string | null = null;
    private userRpcConsecutiveFails = 0;
    private userRpcSidelinedUntil = 0;

    constructor(cfg: BalancedTransportConfig) {
        this.cfg = { ...DEFAULTS, ...cfg } as typeof this.cfg;
        this.userRpcUrl = readUserRpc(this.cfg.userRpcKey);
        this.endpoints = cfg.pool.map(makeEndpoint);
        this.restoreBreakers();

        const warmList = this.userRpcUrl ? [this.userRpcUrl, ...cfg.pool] : cfg.pool;
        if (this.cfg.dnsWarmup) prefetchDns(warmList);
    }

    private restoreBreakers() {
        if (!this.cfg.persistKey || typeof localStorage === "undefined") return;
        try {
            const raw = localStorage.getItem(this.cfg.persistKey);
            if (!raw) return;
            const data = JSON.parse(raw) as Record<string, number>;
            const now = nowMs();
            for (const e of this.endpoints) {
                const until = data[e.url];
                if (typeof until === "number" && until > now) e.breakerUntil = until;
            }
        } catch {
            // ignore
        }
    }

    private persistBreakers() {
        if (!this.cfg.persistKey || typeof localStorage === "undefined") return;
        try {
            const data: Record<string, number> = {};
            const now = nowMs();
            for (const e of this.endpoints) {
                if (e.breakerUntil > now) data[e.url] = e.breakerUntil;
            }
            if (Object.keys(data).length === 0) {
                localStorage.removeItem(this.cfg.persistKey);
            } else {
                localStorage.setItem(this.cfg.persistKey, JSON.stringify(data));
            }
        } catch {
            // ignore
        }
    }

    private userRpcAvailable(): boolean {
        return !!this.userRpcUrl && this.userRpcSidelinedUntil <= nowMs();
    }

    private async tryUserRpc(method: string, params: unknown[]): Promise<unknown> {
        const url = this.userRpcUrl!;
        const body = { jsonrpc: "2.0", id: Math.floor(Math.random() * 1e12), method, params };
        const controller = new AbortController();
        const t0 = nowMs();
        try {
            const res = await this.fetchWithTimeout(url, body, this.cfg.userRpcTimeoutMs, controller);
            this.userRpcConsecutiveFails = 0;
            this.cfg.onWin?.({ url, ms: nowMs() - t0, method, tier: "user" });
            return res;
        } catch (e) {
            this.userRpcConsecutiveFails++;
            this.cfg.onFail?.({ url, err: e, method, tier: "user" });
            const rateLimited = (e as { __rateLimited?: boolean }).__rateLimited;
            const retryMs = (e as { __retryMs?: number }).__retryMs;
            if (rateLimited && typeof retryMs === "number") {
                this.userRpcSidelinedUntil = nowMs() + Math.min(retryMs, MAX_RATE_LIMIT_COOLDOWN_MS);
            } else if (this.userRpcConsecutiveFails >= this.cfg.userRpcFailThreshold) {
                this.userRpcSidelinedUntil = nowMs() + this.cfg.userRpcCooldownMs;
                this.userRpcConsecutiveFails = 0;
            }
            throw e;
        }
    }

    private inWarm(): boolean {
        if (!this.stickyUrl) return false;
        const e = this.endpoints.find((x) => x.url === this.stickyUrl);
        return !!e && e.wins >= this.cfg.promoteWins && this.stickyExpires > nowMs();
    }

    private recordWin(url: string, ms: number, method: string) {
        const e = this.endpoints.find((x) => x.url === url);
        if (e) {
            e.latEwma = ewma(e.latEwma, ms, this.cfg.ewmaAlpha);
            e.errEwma = ewma(e.errEwma, 0, this.cfg.ewmaAlpha);
            e.wins = this.stickyUrl === url ? e.wins + 1 : 1;
            if (e.breakerUntil) {
                this.cfg.onBreaker?.({ url, open: false });
                e.breakerUntil = 0;
                this.persistBreakers();
            }
        }
        this.stickyUrl = url;
        this.stickyExpires = nowMs() + this.cfg.stickyTtlMs;
        this.cfg.onWin?.({ url, ms, method, tier: "pool" });
    }

    private recordFail(url: string, method: string, err: unknown) {
        const reason =
            (err as { __abortReason?: string })?.__abortReason ??
            (err as { code?: string })?.code ??
            (err as { name?: string })?.name;
        if (reason === "winner" || reason === "budget") return;

        const e = this.endpoints.find((x) => x.url === url);
        if (e) {
            e.errEwma = ewma(e.errEwma, 1, this.cfg.ewmaAlpha);
            e.wins = 0;
            const rateLimited = (err as { __rateLimited?: boolean }).__rateLimited;
            const retryMs = (err as { __retryMs?: number }).__retryMs;
            if (rateLimited && typeof retryMs === "number") {
                e.breakerUntil = nowMs() + Math.min(retryMs, MAX_RATE_LIMIT_COOLDOWN_MS);
                this.cfg.onBreaker?.({ url, open: true });
                this.persistBreakers();
            } else if (e.errEwma >= this.cfg.unhealthyThreshold) {
                e.breakerUntil = nowMs() + this.cfg.cooldownMs;
                this.cfg.onBreaker?.({ url, open: true });
                this.persistBreakers();
            }
        }
        if (this.stickyUrl === url) this.stickyUrl = null;
        this.cfg.onFail?.({ url, err, method, tier: "pool" });
    }

    private recordBlockFromResponse(url: string, method: string, result: unknown) {
        if (method === "eth_blockNumber" && typeof result === "string") {
            const e = this.endpoints.find((x) => x.url === url);
            if (e) {
                const n = parseInt(result, 16);
                if (!isNaN(n)) {
                    e.lastBlockSeen = n;
                    e.lastBlockSeenAt = nowMs();
                }
            }
        }
    }

    private chooseFanout(method: string): EndpointState[] {
        const warm = this.inWarm();
        const override = this.cfg.methodFanout?.[method];
        const base = override ?? (warm ? this.cfg.warmFanout : this.cfg.coldFanout);
        const tipBlock = this.lastBlock;
        const stale = this.cfg.stalenessBlockPenalty;

        const healthy = this.endpoints.filter((e) => e.breakerUntil <= nowMs());
        if (!healthy.length) {
            return weightedSample(this.endpoints, Math.min(base, this.endpoints.length), tipBlock, stale);
        }

        if (warm && this.stickyUrl) {
            const sticky = healthy.find((e) => e.url === this.stickyUrl);
            const rest = healthy.filter((e) => e.url !== this.stickyUrl);
            const picks = [
                sticky,
                ...weightedSample(rest, Math.max(0, base - 1), tipBlock, stale),
            ].filter(Boolean) as EndpointState[];
            return picks.length
                ? picks
                : weightedSample(healthy, Math.min(base, healthy.length), tipBlock, stale);
        }
        return weightedSample(healthy, Math.min(base, healthy.length), tipBlock, stale);
    }

    private perAttempt(method: string): number {
        return this.cfg.methodPerAttemptMs?.[method] ?? this.cfg.perAttemptMs;
    }

    private fetchWithTimeout(url: string, body: unknown, timeoutMs: number, controller: AbortController): Promise<unknown> {
        const t = setTimeout(() => controller.abort("timeout"), timeoutMs);
        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
        })
            .then(async (r) => {
                clearTimeout(t);
                if (r.status === 429) {
                    const ra = r.headers.get("Retry-After");
                    let retryMs = 60_000;
                    if (ra) {
                        const n = parseInt(ra, 10);
                        if (!isNaN(n) && n > 0) retryMs = n * 1000;
                    }
                    const err = new Error(`HTTP 429 (rate limited)`) as Error & {
                        __rateLimited?: boolean;
                        __retryMs?: number;
                    };
                    err.__rateLimited = true;
                    err.__retryMs = retryMs;
                    throw err;
                }
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const j = (await r.json()) as { result?: unknown; error?: { message?: string } };
                if (j.error) throw new Error(j.error.message || "RPC Error");
                return j.result;
            })
            .catch((e) => {
                clearTimeout(t);
                try {
                    (e as { __abortReason?: unknown }).__abortReason = (controller.signal as { reason?: unknown })?.reason;
                } catch {
                    // ignore
                }
                throw e;
            });
    }

    private pruneTinyCache() {
        const ceiling = this.cfg.maxCacheEntries;
        if (this.tinyCache.size <= ceiling) return;
        const now = nowMs();
        for (const [k, v] of this.tinyCache) {
            if (v.expires <= now) this.tinyCache.delete(k);
        }
        if (this.tinyCache.size > ceiling) {
            let n = this.tinyCache.size - ceiling;
            for (const k of this.tinyCache.keys()) {
                this.tinyCache.delete(k);
                if (--n <= 0) break;
            }
        }
    }

    private async racePool(method: string, params: unknown[]): Promise<unknown> {
        const startTotal = nowMs();
        const budget = this.cfg.totalBudgetMs;
        const maxRetries = this.cfg.maxRetries;

        let attempt = 0;
        let lastErr: unknown;

        while (attempt < maxRetries) {
            const remaining = budget - (nowMs() - startTotal);
            if (remaining <= 0) break;

            if (attempt > 0) {
                const j = jitter(this.cfg.jitterMinMs, this.cfg.jitterMaxMs);
                const wait = Math.min(j, remaining - 50);
                if (wait > 0) await sleep(wait);
                if (budget - (nowMs() - startTotal) <= 0) break;
            }
            attempt++;

            const racers = this.chooseFanout(method);
            if (!racers.length) throw new Error("No healthy RPC endpoints available");

            const body = { jsonrpc: "2.0", id: Math.floor(Math.random() * 1e12), method, params };
            const controllers = racers.map(() => new AbortController());
            const remainingNow = budget - (nowMs() - startTotal);
            const timeout = Math.max(50, Math.min(this.perAttempt(method), remainingNow));

            const budgetTimer = setTimeout(() => {
                controllers.forEach((c) => c.abort("budget"));
            }, remainingNow);

            const promises = racers.map((ep, i) =>
                (async () => {
                    const t0 = nowMs();
                    try {
                        const res = await this.fetchWithTimeout(ep.url, body, timeout, controllers[i]);
                        this.recordWin(ep.url, nowMs() - t0, method);
                        this.recordBlockFromResponse(ep.url, method, res);
                        controllers.forEach((c, j) => j !== i && c.abort("winner"));
                        return res;
                    } catch (e) {
                        this.recordFail(ep.url, method, e);
                        throw e;
                    }
                })()
            );

            try {
                const result = await Promise.any(promises);
                clearTimeout(budgetTimer);
                return result;
            } catch (e) {
                clearTimeout(budgetTimer);
                lastErr = e;
            }
        }

        throw lastErr ?? new Error("All endpoints failed within budget");
    }

    private async safeBlock(): Promise<number> {
        try {
            const now = nowMs();
            if (this.lastBlock && now - this.lastBlockCheckedAt < 1000) return this.lastBlock;
            const hex = (await this.dispatch("eth_blockNumber", [])) as string;
            const n = parseInt(hex, 16);
            const prev = this.lastBlock;
            this.lastBlock = n;
            this.lastBlockCheckedAt = now;
            if (prev !== undefined && n !== prev) this.tinyCache.clear();
            return n;
        } catch {
            return -1;
        }
    }

    private async dispatch(method: string, params: unknown[]): Promise<unknown> {
        if (this.userRpcAvailable()) {
            try {
                return await this.tryUserRpc(method, params);
            } catch {
                // fall through
            }
        }
        return this.racePool(method, params);
    }

    async request(method: string, params: unknown[]): Promise<unknown> {
        if (NEVER_CACHE.has(method)) {
            return this.dispatch(method, params);
        }

        const blockTag = this.cfg.blockAwareCache ? await this.safeBlock() : undefined;
        const key = fastCacheKey(method, params, blockTag);

        const cached = this.tinyCache.get(key);
        if (cached && cached.expires > nowMs()) return cached.value;

        const pending = this.inflight.get(key);
        if (pending) return pending;

        const run = this.dispatch(method, params)
            .then((val) => {
                this.tinyCache.set(key, {
                    value: val,
                    expires: nowMs() + this.cfg.callTtlMs,
                    block: blockTag,
                });
                this.pruneTinyCache();
                this.inflight.delete(key);
                return val;
            })
            .catch((e) => {
                this.inflight.delete(key);
                throw e;
            });

        this.inflight.set(key, run);
        return run;
    }
}

export function balancedTransport(config: BalancedTransportConfig): Transport {
    const balancer = new RpcBalancer(config);
    return custom({
        async request({ method, params }: { method: string; params?: unknown }) {
            return balancer.request(method, (params as unknown[]) ?? []);
        },
    } as { request: EIP1193RequestFn });
}
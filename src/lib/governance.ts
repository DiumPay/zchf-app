/**
 * Grenadier governance client.
 *
 * One fetch per page-load via a module-level promise — every component that
 * imports `loadGovernance()` shares the same in-flight request. No HTTP
 * thundering herd, no localStorage (governance data changes upstream every
 * 5min anyway, and we want the freshest read on each navigation).
 */

const GRENADIER_BASE = import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://grenadier.frankencoin.win";

// ---------- shapes match grenadier's /governance response ----------

export type Minter = {
    chainId: number;
    txHash: string;
    minter: string;
    applicationPeriod: number;
    applicationFee: string;
    applyMessage: string;
    applyDate: number;
    suggestor: string;
    denyMessage?: string;
    denyDate?: number;
    denyTxHash?: string;
    vetor?: string;
};

export type LeadrateApproved = {
    chainId: number;
    module: string;
    count: number;
    created: number;
    blockheight: number;
    txHash: string;
    approvedRate: number; // PPM
};

export type LeadrateProposed = {
    chainId: number;
    module: string;
    count: number;
    created: number;
    blockheight: number;
    txHash: string;
    proposer: string;
    nextChange: number;
    nextRate: number; // PPM
};

export type FPSHolder = {
    account: string;
    balance: string; // bigint string, 18dp
    updated: number;
};

export type EquityDelegation = {
    owner: string;
    delegatedTo: string;
};

export type GovernanceData = {
    minters: { num: number; list: Minter[] };
    leadrate: {
        approved: { num: number; list: LeadrateApproved[] };
        proposed: { num: number; list: LeadrateProposed[] };
    };
    fpsHolders: { num: number; list: FPSHolder[] };
    delegations: { num: number; list: EquityDelegation[] };
};

let inFlight: Promise<GovernanceData> | null = null;

/**
 * Returns the deduplicated promise for the governance payload. First caller
 * triggers the fetch, all subsequent callers wait on the same promise. On
 * failure the cache is cleared so the next call retries.
 */
export function loadGovernance(): Promise<GovernanceData> {
    if (inFlight) return inFlight;
    inFlight = fetch(`${GRENADIER_BASE}/governance`, {
        headers: { Accept: "application/json" },
    })
        .then(async (r) => {
            if (!r.ok) throw new Error(`grenadier governance: ${r.status}`);
            return (await r.json()) as GovernanceData;
        })
        .catch((err) => {
            inFlight = null; // allow retry on next call
            throw err;
        });
    return inFlight;
}
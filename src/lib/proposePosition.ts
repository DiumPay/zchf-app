import {
    type Address,
    type Hex,
    decodeEventLog,
    erc20Abi,
    isAddress,
    maxUint256,
    type WalletClient,
    type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { ADDRESSES } from "@config/addresses";
import { MINTING_HUB_V2_ABI } from "@abi/mintingHub";

// Protocol limits
export const PROPOSAL_FEE_ZCHF = 1000n * 10n ** 18n;
export const MIN_INIT_PERIOD_DAYS = 3n;
export const MIN_COLL_VALUE_ZCHF = 5000n;
export const RECOMMENDED_COLL_VALUE_ZCHF = 7500n;

// Reserve / risk premium are PPM (uint24, max 1_000_000 = 100%)
// Contract floor: CHALLENGER_REWARD (20000 = 2%). UI recommends 20%.
export const PPM_DECIMALS = 4;
export const MIN_RESERVE_PPM = 20_000n;
export const MAX_RESERVE_PPM = 1_000_000n;
export const RECOMMENDED_RESERVE_PPM = 200_000n;
export const MAX_INTEREST_PPM = 1_000_000n;

export const MIN_AUCTION_HOURS = 12n;
export const RECOMMENDED_AUCTION_HOURS = 24n;
export const RECOMMENDED_MAX_LIMIT_ZCHF = 2_500_000n;

export interface ProposalForm {
    collateralAddress: string;
    minCollateral: bigint;
    initialCollateral: bigint;
    limitZchf: bigint;
    interestPPM: bigint;
    maturityMonths: bigint;
    initPeriodDays: bigint;
    liqPrice: bigint;
    reservePPM: bigint;
    auctionHours: bigint;
}

export function emptyProposalForm(): ProposalForm {
    return {
        collateralAddress: "",
        minCollateral: 0n,
        initialCollateral: 0n,
        limitZchf: 1_000_000n * 10n ** 18n,
        interestPPM: 30_000n,
        maturityMonths: 12n,
        initPeriodDays: 5n,
        liqPrice: 0n,
        reservePPM: RECOMMENDED_RESERVE_PPM,
        auctionHours: 48n,
    };
}

export interface CollTokenInfo {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    userBalance: bigint;
    userAllowance: bigint;
}

export async function readCollateralInfo(
    client: PublicClient,
    collateral: Address,
    user: Address,
): Promise<CollTokenInfo | null> {
    const mintingHub = ADDRESSES.ethereum.mintingHubV2 as Address;
    try {
        const [name, symbol, decimals, balance, allowance] = await client.multicall({
            allowFailure: false,
            contracts: [
                { address: collateral, abi: erc20Abi, functionName: "name" },
                { address: collateral, abi: erc20Abi, functionName: "symbol" },
                { address: collateral, abi: erc20Abi, functionName: "decimals" },
                { address: collateral, abi: erc20Abi, functionName: "balanceOf", args: [user] },
                { address: collateral, abi: erc20Abi, functionName: "allowance", args: [user, mintingHub] },
            ],
        });
        return {
            address: collateral,
            name: name as string,
            symbol: symbol as string,
            decimals: Number(decimals as number),
            userBalance: balance as bigint,
            userAllowance: allowance as bigint,
        };
    } catch {
        return null;
    }
}

export interface FieldStatus {
    error: string | null;
    warning: string | null;
}

const ok = (): FieldStatus => ({ error: null, warning: null });
const err = (m: string): FieldStatus => ({ error: m, warning: null });
const warn = (m: string): FieldStatus => ({ error: null, warning: m });

export function validateCollateralAddress(addr: string, info: CollTokenInfo | null): FieldStatus {
    if (!addr) return ok();
    if (!isAddress(addr)) return err("Invalid contract address");
    if (!info) return err("Could not read token data");
    if (info.decimals > 24) return err("Token decimals must be ≤ 24");
    return ok();
}

export function validateCollateralValue(minColl: bigint, liqPrice: bigint): FieldStatus {
    if (minColl === 0n || liqPrice === 0n) return ok();
    const value = minColl * liqPrice;
    const floor = MIN_COLL_VALUE_ZCHF * 10n ** 36n;
    const recommended = RECOMMENDED_COLL_VALUE_ZCHF * 10n ** 36n;
    if (value < floor) return err(`Collateral value must be ≥ ${MIN_COLL_VALUE_ZCHF} ZCHF`);
    if (value < recommended) return warn(`Recommended: ≥ ${RECOMMENDED_COLL_VALUE_ZCHF} ZCHF`);
    return ok();
}

export function validateInitialCollateral(
    initial: bigint,
    minColl: bigint,
    info: CollTokenInfo | null,
): FieldStatus {
    if (initial === 0n) return ok();
    if (initial < minColl) return err("Must be at least the minimum amount");
    if (info && initial > info.userBalance) return err(`Not enough ${info.symbol} in your wallet`);
    return ok();
}

export function validateLimit(limit: bigint): FieldStatus {
    if (limit === 0n) return err("Limit must be > 0");
    const recommended = RECOMMENDED_MAX_LIMIT_ZCHF * 10n ** 18n;
    if (limit > recommended) return warn(`Recommended: ≤ ${RECOMMENDED_MAX_LIMIT_ZCHF.toLocaleString()} ZCHF`);
    return ok();
}

export function validateInterest(ppm: bigint): FieldStatus {
    if (ppm > MAX_INTEREST_PPM) return err("Annual interest must be < 100%");
    return ok();
}

export function validateInitPeriod(days: bigint): FieldStatus {
    if (days < MIN_INIT_PERIOD_DAYS) return err(`Initialization period must be ≥ ${MIN_INIT_PERIOD_DAYS} days`);
    return ok();
}

export function validateReserve(ppm: bigint): FieldStatus {
    if (ppm > MAX_RESERVE_PPM) return err("Buffer cannot exceed 100%");
    if (ppm < MIN_RESERVE_PPM) return err("Buffer must be at least 2%");
    if (ppm < RECOMMENDED_RESERVE_PPM) return warn("Recommended: ≥ 20%");
    return ok();
}

export function validateAuctionDuration(hours: bigint): FieldStatus {
    if (hours < MIN_AUCTION_HOURS) return err(`Duration must be ≥ ${MIN_AUCTION_HOURS}h`);
    if (hours < RECOMMENDED_AUCTION_HOURS) return warn(`Recommended: ≥ ${RECOMMENDED_AUCTION_HOURS}h`);
    return ok();
}

export function validateMaturity(months: bigint): FieldStatus {
    if (months <= 0n) return err("Maturity must be > 0");
    return ok();
}

export function validateZchfBalance(userZchf: bigint): FieldStatus {
    if (userZchf < PROPOSAL_FEE_ZCHF) return err("Not enough ZCHF for proposal fee");
    return ok();
}

export interface FormStatus {
    collateral: FieldStatus;
    initialCollateral: FieldStatus;
    minCollateralValue: FieldStatus;
    limit: FieldStatus;
    interest: FieldStatus;
    initPeriod: FieldStatus;
    maturity: FieldStatus;
    reserve: FieldStatus;
    auction: FieldStatus;
    zchfBalance: FieldStatus;
    hasBlockingError: boolean;
}

export function validateForm(
    form: ProposalForm,
    info: CollTokenInfo | null,
    userZchfBalance: bigint,
): FormStatus {
    const out: Omit<FormStatus, "hasBlockingError"> = {
        collateral: validateCollateralAddress(form.collateralAddress, info),
        initialCollateral: validateInitialCollateral(form.initialCollateral, form.minCollateral, info),
        minCollateralValue: validateCollateralValue(form.minCollateral, form.liqPrice),
        limit: validateLimit(form.limitZchf),
        interest: validateInterest(form.interestPPM),
        initPeriod: validateInitPeriod(form.initPeriodDays),
        maturity: validateMaturity(form.maturityMonths),
        reserve: validateReserve(form.reservePPM),
        auction: validateAuctionDuration(form.auctionHours),
        zchfBalance: validateZchfBalance(userZchfBalance),
    };
    const hasBlockingError = Object.values(out).some(s => s.error !== null);
    return { ...out, hasBlockingError };
}

export function needsApproval(form: ProposalForm, info: CollTokenInfo | null): boolean {
    if (!info) return false;
    if (form.initialCollateral === 0n) return false;
    return info.userAllowance < form.initialCollateral;
}

export async function approveCollateral(
    walletClient: WalletClient,
    publicClient: PublicClient,
    collateral: Address,
    account: Address,
): Promise<Hex> {
    const mintingHub = ADDRESSES.ethereum.mintingHubV2 as Address;
    const hash = await walletClient.writeContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "approve",
        args: [mintingHub, maxUint256],
        account,
        chain: mainnet,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}

export async function openPosition(
    walletClient: WalletClient,
    publicClient: PublicClient,
    form: ProposalForm,
    collateralDecimals: number,
    account: Address,
): Promise<Hex> {
    const mintingHub = ADDRESSES.ethereum.mintingHubV2 as Address;

    const initSeconds = form.initPeriodDays * 24n * 60n * 60n;
    const expirationSeconds = form.maturityMonths * 30n * 24n * 60n * 60n;
    const auctionSeconds = form.auctionHours * 60n * 60n;

    const hash = await walletClient.writeContract({
        address: mintingHub,
        abi: MINTING_HUB_V2_ABI,
        functionName: "openPosition",
        args: [
            form.collateralAddress as Address,
            form.minCollateral,
            form.initialCollateral,
            form.limitZchf,
            Number(initSeconds),
            Number(expirationSeconds),
            Number(auctionSeconds),
            Number(form.interestPPM),
            form.liqPrice,
            Number(form.reservePPM),
        ],
        account,
        chain: mainnet,
        gas: 3_000_000n,
    });
    return hash;
}

export function extractDeployedPosition(logs: { data: Hex; topics: [Hex, ...Hex[]] }[]): Address | null {
    for (const log of logs) {
        try {
            const decoded = decodeEventLog({
                abi: MINTING_HUB_V2_ABI,
                data: log.data,
                topics: log.topics,
            });
            if (decoded.eventName === "PositionOpened") {
                return decoded.args.position as Address;
            }
        } catch {
            continue;
        }
    }
    return null;
}

export interface ExistingPositionTerms {
    collateral: Address;
    minimumCollateral: bigint;
    limitForClones: bigint;
    riskPremiumPPM: number;
    price: bigint;
    reserveContribution: number;
    challengePeriodSeconds: number;
}

export function prefillFromExisting(p: ExistingPositionTerms): ProposalForm {
    const base = emptyProposalForm();
    return {
        ...base,
        collateralAddress: p.collateral,
        minCollateral: p.minimumCollateral,
        initialCollateral: p.minimumCollateral,
        limitZchf: p.limitForClones,
        interestPPM: BigInt(p.riskPremiumPPM),
        liqPrice: p.price,
        reservePPM: BigInt(p.reserveContribution),
        auctionHours: BigInt(p.challengePeriodSeconds) / 3600n,
    };
}
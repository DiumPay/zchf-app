

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { erc20Abi, type Address } from "viem";
import { getPublicClient } from "@lib/client";
import { POSITION_V2_ABI } from "@abi/position";

// 13 originals (clones and VNX excluded).
const POSITION_ADDRESSES: Address[] = [
    "0x44Bfc2a260f091f8365ba8b240cD9491903467b9", // BOSS
    "0x5F2c10f779B7f0C44ee80128A3d7ac75B255bb95", // cbBTC
    "0xC862bDC0417eC73980ee79AAE0eEFDEA68f88615", // CRV
    "0x0C98db77782c4CB8B96479719e695b524AFEAd59", // GNO
    "0x224Bc870A661cC77742d63B6C1Fe82dF1841e0D5", // LENDS
    "0xAe4bE19e25a10ce9B67d76DC2c8C774F4850B215", // LsETH
    "0x3484c2aaF6Cb7c27AA68c89edCDAc878020A4DA7", // PAXG
    "0x9cf4E932285474e72b82b288C4064054223bA502", // REALU
    "0x6880881AE5a79F0C2657162A0F64072C075A60Ce", // SPYon
    "0x8E2Dc1eD2ecF29def3a5c436455162d0639E2cf8", // WBTC
    "0xabe499cdb61a76a8bFAa49822035DbE9a04aEDCf", // WETH (clone)
    "0x826C54287c0C1E2A4D0fbF81E2e734c85C48d3f4", // wstETH
    "0x7ae56A1bE4979A05E58F55634E0698d18C1bED99", // XAUt (clone)
    "0xe8017Ad9a703BAaE37C23549B3B30841cAF3e873", // ysyBOLD
];

const OUTPUT_PATH = "src/data/positions-snapshot.json";

interface PositionSnapshot {
    address: Address;
    original: Address;
    isOriginal: boolean;
    collateral: Address;
    collateralName: string;
    collateralSymbol: string;
    collateralDecimals: number;
    limit: string;
    minimumCollateral: string;
    expiration: number;
    start: number;
    challengePeriod: number;
    riskPremiumPPM: number;
    reserveContribution: number;
}

interface SnapshotFile {
    snapshotBlock: number;
    snapshotDate: string;
    chain: "ethereum";
    positions: PositionSnapshot[];
}

async function main() {
    const client = getPublicClient("ethereum");
    const blockNumber = await client.getBlockNumber();

    console.log(`Snapshotting at block ${blockNumber}...`);

    // Step 1: read all position immutable fields in one multicall.
    const positionCalls = POSITION_ADDRESSES.flatMap(addr => [
        { address: addr, abi: POSITION_V2_ABI, functionName: "collateral" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "original" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "limit" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "minimumCollateral" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "expiration" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "start" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "challengePeriod" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "riskPremiumPPM" as const },
        { address: addr, abi: POSITION_V2_ABI, functionName: "reserveContribution" as const },
    ]);

    const positionResults = await client.multicall({
        contracts: positionCalls,
        allowFailure: false,
    });

    // Step 2: extract collateral addresses, batch-fetch their token metadata.
    const collaterals = POSITION_ADDRESSES.map((_, i) => positionResults[i * 9] as Address);

    const tokenCalls = collaterals.flatMap(c => [
        { address: c, abi: erc20Abi, functionName: "name" as const },
        { address: c, abi: erc20Abi, functionName: "symbol" as const },
        { address: c, abi: erc20Abi, functionName: "decimals" as const },
    ]);

    const tokenResults = await client.multicall({
        contracts: tokenCalls,
        allowFailure: false,
    });

    // Step 3: assemble per-position records.
    const positions: PositionSnapshot[] = POSITION_ADDRESSES.map((addr, i) => {
        const pBase = i * 9;
        const tBase = i * 3;
        const original = positionResults[pBase + 1] as Address;
        return {
            address: addr,
            original,
            isOriginal: original.toLowerCase() === addr.toLowerCase(),
            collateral: positionResults[pBase + 0] as Address,
            collateralName: tokenResults[tBase + 0] as string,
            collateralSymbol: tokenResults[tBase + 1] as string,
            collateralDecimals: Number(tokenResults[tBase + 2]),
            limit: (positionResults[pBase + 2] as bigint).toString(),
            minimumCollateral: (positionResults[pBase + 3] as bigint).toString(),
            expiration: Number(positionResults[pBase + 4]),
            start: Number(positionResults[pBase + 5]),
            challengePeriod: Number(positionResults[pBase + 6]),
            riskPremiumPPM: Number(positionResults[pBase + 7]),
            reserveContribution: Number(positionResults[pBase + 8]),
        };
    });

    const snapshot: SnapshotFile = {
        snapshotBlock: Number(blockNumber),
        snapshotDate: new Date().toISOString().slice(0, 10),
        chain: "ethereum",
        positions,
    };

    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot, null, 2));

    console.log(`Wrote ${positions.length} positions to ${OUTPUT_PATH}`);
    positions.forEach(p => {
        console.log(`  ${p.collateralSymbol.padEnd(10)} ${p.address}  (limit ${p.limit})`);
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

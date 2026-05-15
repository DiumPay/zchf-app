import type { ChainKey } from "@config/network";

export interface ChainAddresses {
    /** Current Savings module (SavingsReferral on mainnet) — represents the SAVE rate. */
    savings: `0x${string}`;
    /** Legacy Savings module on mainnet — represents the MINT rate. */
    savingsV2?: `0x${string}`;
    zchf: `0x${string}`;
    mintingHubV2?: `0x${string}`;
    cloneHelper?: `0x${string}`;
    positionRollerV2?: `0x${string}`;
    /** CHFAU stablecoin (Tradable Swiss Franc, AlpenChain). */
    chfau?: `0x${string}`;
    /** Bridge for 1:1 CHFAU ↔ ZCHF swaps. */
    chfauBridge?: `0x${string}`;
    /** TransferReference contract (with CCIP cross-chain transfers). */
    transferReference?: `0x${string}`;
    equity?: `0x${string}`;
    /** FPSWrapper (WFPS) — ERC20 wrapper for FPS, preserves holding duration on transfer. */
    fpsWrapper?: `0x${string}`;
    mintingHub?: `0x${string}`;
    positionFactory?: `0x${string}`;
    /** Chainlink CCIP burn/mint token pool for ZCHF. */
    ccipTokenPool?: `0x${string}`;
    /** CCIP chain selector (Chainlink's 64-bit chain id). */
    ccipSelector?: bigint;
    /** Mainnet only — sends voting power to L2s via CCIP. */
    ccipGovernanceSender?: `0x${string}`;
    /** L2 only — receives + stores synced voting power. */
    ccipBridgedGovernance?: `0x${string}`;
}

const BRIDGED_ZCHF: `0x${string}` = "0xD4dD9e2F021BB459D5A5f6c24C12fE09c5D45553";

export const ADDRESSES: Record<ChainKey, ChainAddresses> = {
    ethereum: {
        savings: "0x27d9AD987BdE08a0d083ef7e0e4043C857A17B38",
        savingsV2: "0x3BF301B0e2003E75A3e86AB82bD1EFF6A9dFB2aE",
        zchf: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
        mintingHubV2: "0xDe12B620A8a714476A97EfD14E6F7180Ca653557",
        cloneHelper:  "0x55cD2820735Db56ca0965BE224D71994265F8bee",
        positionRollerV2: "0xAD0107D3Da540Fd54b1931735b65110C909ea6B6",
        chfau:        "0xBD4DfC058eb95b8De5ceAF39966A1a70F5556F78",
        chfauBridge:  "0x3e445ff4ddDf0ff8aE7458c9746eD80bD664F6C1",
        transferReference: "0xf98c221661F51578f5E5236B189a493E2a8a1916",
        equity: "0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2",
        fpsWrapper: "0x5052D3Cc819f53116641e89b96Ff4cD1EE80B182",
        ccipTokenPool: "0x9359cd75549DaE00Cdd8D22297BC9B13FbBe4B79",
        ccipSelector: 5009297550715157269n,
        ccipGovernanceSender: "0xFD23272DfcB13Dc3Fabd8DB851fCD4827Af876EB",
    },
    arbitrum: {
        savings: "0xb41715e54e9f0827821A149AE8eC1aF70aa70180",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF, // ← bridged token IS the bridge
        ccipTokenPool: "0x7CBac118B3F299f8BE1C3DBA66368D96B37D7743",
        ccipSelector: 4949039107694359620n,
        ccipBridgedGovernance: "0x4fF458f3Aa2c5cd970891909d72CF029939313ab",
    },
    avalanche: {
        savings: "0x8e7c2a697751a1cE7a8DB51f01B883A27c5c8325",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
        ccipTokenPool: "0x7CBac118B3F299f8BE1C3DBA66368D96B37D7743",
        ccipSelector: 6433500567565415381n,
        ccipBridgedGovernance: "0x4fF458f3Aa2c5cd970891909d72CF029939313ab",
    },
    base: {
        savings: "0x6426324Af1b14Df3cd03b2d500529083c5ea61BC",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
        ccipTokenPool: "0x7CBac118B3F299f8BE1C3DBA66368D96B37D7743",
        ccipSelector: 15971525489660198786n,
        ccipBridgedGovernance: "0x4fF458f3Aa2c5cd970891909d72CF029939313ab",
    },
    gnosis: {
        savings: "0xbF594D0feD79AE56d910Cb01b5dD4f4c57B04402",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
        ccipTokenPool: "0x7CBac118B3F299f8BE1C3DBA66368D96B37D7743",
        ccipSelector: 465200170687744372n,
        ccipBridgedGovernance: "0x4fF458f3Aa2c5cd970891909d72CF029939313ab",
    },
    optimism: {
        savings: "0x6426324Af1b14Df3cd03b2d500529083c5ea61BC",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
        ccipTokenPool: "0x7CBac118B3F299f8BE1C3DBA66368D96B37D7743",
        ccipSelector: 3734403246176062136n,
        ccipBridgedGovernance: "0x4fF458f3Aa2c5cd970891909d72CF029939313ab",
    },
    polygon: {
        savings: "0xB519BAE359727e69990C27241Bef29b394A0ACbD",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
        ccipTokenPool: "0x7CBac118B3F299f8BE1C3DBA66368D96B37D7743",
        ccipSelector: 4051577828743386545n,
        ccipBridgedGovernance: "0x4fF458f3Aa2c5cd970891909d72CF029939313ab",
    },
    sonic: {
        savings: "0x4E104918908293cd6A93E1A9bbe06C345d751235",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
        ccipTokenPool: "0x7CBac118B3F299f8BE1C3DBA66368D96B37D7743",
        ccipSelector: 1673871237479749969n,
        ccipBridgedGovernance: "0x4fF458f3Aa2c5cd970891909d72CF029939313ab",
    },
    sepolia: {
        savings: "0x0000000000000000000000000000000000000000",
        zchf: "0x0000000000000000000000000000000000000000",
    },
};
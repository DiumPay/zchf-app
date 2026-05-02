import type { ChainKey } from "@config/network";

export interface ChainAddresses {
    savings: `0x${string}`;
    zchf: `0x${string}`;
    mintingHubV2?: `0x${string}`;
    cloneHelper?: `0x${string}`;
    /** TransferReference contract (with CCIP cross-chain transfers). */
    transferReference?: `0x${string}`;
    equity?: `0x${string}`;
    mintingHub?: `0x${string}`;
    positionFactory?: `0x${string}`;
}

const BRIDGED_ZCHF: `0x${string}` = "0xD4dD9e2F021BB459D5A5f6c24C12fE09c5D45553";

export const ADDRESSES: Record<ChainKey, ChainAddresses> = {
    ethereum: {
        savings: "0x27d9AD987BdE08a0d083ef7e0e4043C857A17B38",
        zchf: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
        mintingHubV2: "0xDe12B620A8a714476A97EfD14E6F7180Ca653557",
        cloneHelper:  "0x55cD2820735Db56ca0965BE224D71994265F8bee",
        transferReference: "0xf98c221661F51578f5E5236B189a493E2a8a1916",
        equity: "0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2",
    },
    arbitrum: {
        savings: "0xb41715e54e9f0827821A149AE8eC1aF70aa70180",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF, // ← bridged token IS the bridge
    },
    avalanche: {
        savings: "0x8e7c2a697751a1cE7a8DB51f01B883A27c5c8325",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
    },
    base: {
        savings: "0x6426324Af1b14Df3cd03b2d500529083c5ea61BC",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
    },
    gnosis: {
        savings: "0xbF594D0feD79AE56d910Cb01b5dD4f4c57B04402",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
    },
    optimism: {
        savings: "0x6426324Af1b14Df3cd03b2d500529083c5ea61BC",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
    },
    polygon: {
        savings: "0xB519BAE359727e69990C27241Bef29b394A0ACbD",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
    },
    sonic: {
        savings: "0x4E104918908293cd6A93E1A9bbe06C345d751235",
        zchf: BRIDGED_ZCHF,
        transferReference: BRIDGED_ZCHF,
    },
    sepolia: {
        savings: "0x0000000000000000000000000000000000000000",
        zchf: "0x0000000000000000000000000000000000000000",
    },
};
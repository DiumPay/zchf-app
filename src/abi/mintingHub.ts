import { parseAbi } from "viem";

export const MINTING_HUB_V2_ABI = parseAbi([
    // Position creation
    "function openPosition(address _collateralAddress, uint256 _minCollateral, uint256 _initialCollateral, uint256 _mintingMaximum, uint40 _initPeriodSeconds, uint40 _expirationSeconds, uint40 _challengeSeconds, uint24 _riskPremiumPPM, uint256 _liqPrice, uint24 _reservePPM) external returns (address)",

    // Cloning
    "function clone(address parent, uint256 _initialCollateral, uint256 _initialMint, uint40 expiration) external returns (address)",
    "function clone(address owner, address parent, uint256 _initialCollateral, uint256 _initialMint, uint40 expiration) external returns (address)",

    // Governance
    "function denyPosition(address position, address[] helpers, string message) external",

    // Liquidation auctions
    "function challenge(address _positionAddr, uint256 _collateralAmount, uint256 expectedPrice) external returns (uint256)",
    "function bid(uint32 _challengeNumber, uint256 size, bool postpone) external",
    "function postPonePendingChallenge(uint32 _challengeNumber) external",
    "function price(uint32 _challengeNumber) external view returns (uint256)",

    // State readers
    "function challenges(uint256) external view returns (address challenger, uint40 start, address position, uint256 size)",
    "function pendingChallenges(uint256) external view returns (uint256)",
    "function OPENING_FEE() external view returns (uint256)",
    "function CHALLENGER_REWARD() external view returns (uint32)",

    // Events
    "event PositionOpened(address indexed owner, address indexed position, address original, address collateral, uint256 price)",
    "event PositionDenied(address indexed sender, string message)",
    "event ChallengeStarted(address indexed challenger, address indexed position, uint256 size, uint256 number)",
    "event ChallengeAverted(address indexed position, uint256 number, uint256 size)",
    "event ChallengeSucceeded(address indexed position, uint256 number, uint256 bid, uint256 acquiredCollateral, uint256 challengeSize)",
    "event PostPonedReturn(address collateral, address indexed beneficiary, uint256 amount)",
]);

export const MINTING_HUB_ABI = MINTING_HUB_V2_ABI;
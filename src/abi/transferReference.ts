import { parseAbi } from "viem";

export const TRANSFER_REF_ABI = parseAbi([
    "function transfer(address recipient, uint256 amount, string ref) returns (bool)",
    "function crossTransfer(uint64 targetChain, address recipient, uint256 amount, string ref) payable returns (bool)",
    "function getCCIPFee(uint64 targetChain, address target, uint256 amount, bool nativeToken) view returns (uint256)",
    "function zchf() view returns (address)",
    "function LINK() view returns (address)",
    "function ROUTER() view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 amount, string ref)",
    "event CrossTransfer(address indexed sender, address indexed from, uint64 toChain, bytes indexed to, uint256 amount, string ref)",
]);
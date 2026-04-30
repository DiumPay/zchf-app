// Turns viem's noisy errors into clean, user-friendly messages.
//
// Why: viem errors include the full request body, docs URL, viem version,
// and stack — fine for logs, terrible for a toast. This module extracts
// the one-line summary and flags benign cases (user rejected the popup).

import { BaseError, UserRejectedRequestError } from "viem";

export interface FriendlyError {
    /** One-line readable message suitable for a toast */
    message: string;
    /** True if the user cancelled in their wallet (not a real failure) */
    isUserCancel: boolean;
}

export function friendlyError(e: unknown): FriendlyError {
    if (e instanceof BaseError) {
        // walk() searches the error chain for a matching cause
        const rejected = e.walk((err) => err instanceof UserRejectedRequestError);
        if (rejected) {
            return { message: "Transaction rejected", isUserCancel: true };
        }
        // viem stores a clean one-liner here
        const short = (e as BaseError).shortMessage ?? e.message.split("\n")[0];
        return { message: short, isUserCancel: false };
    }

    if (e instanceof Error) {
        return { message: e.message.split("\n")[0], isUserCancel: false };
    }

    return { message: String(e), isUserCancel: false };
}

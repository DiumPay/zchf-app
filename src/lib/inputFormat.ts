/**
 * Pure formatting + bigint <-> decimal helpers used across input forms.
 * No DOM dependencies except the `applyClamp` / `guardKeystrokes` pair which
 * take an HTMLInputElement explicitly.
 */

export const fmt = (n: number, min = 2, max = 2) =>
    n.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });

export const fmtPlain = (n: number, max = 8) =>
    n.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: max });

export const parseNum = (s: string) => {
    const n = parseFloat(s.trim().replace(/,/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const toBig = (n: number, dec: number): bigint => {
    if (n <= 0) return 0n;
    const [whole, frac = ""] = n.toString().split(".");
    return BigInt(whole + (frac + "0".repeat(dec)).slice(0, dec));
};

export const fromBig = (v: bigint, dec: number) => Number(v) / Math.pow(10, dec);

export const isValidPartial = (next: string, dec: number): boolean => {
    if (next === "") return true;
    const re = dec === 0 ? /^\d*$/ : new RegExp(`^\\d*(\\.\\d{0,${dec}})?$`);
    return re.test(next);
};

export function clampDecimals(raw: string, dec: number): string {
    let s = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
        s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
        const [whole, frac = ""] = s.split(".");
        s = dec === 0 ? whole : whole + "." + frac.slice(0, dec);
    }
    return s;
}

export function applyClamp(input: HTMLInputElement, dec: number): string {
    const trimmed = clampDecimals(input.value, dec);
    if (trimmed !== input.value) {
        const pos = input.selectionStart;
        input.value = trimmed;
        if (pos !== null) {
            const caret = Math.min(pos, trimmed.length);
            input.setSelectionRange(caret, caret);
        }
    }
    return trimmed;
}

export function guardKeystrokes(input: HTMLInputElement, dec: number) {
    input.addEventListener("beforeinput", (ev) => {
        const ie = ev as InputEvent;
        if (!ie.data) return;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const insert = ie.data.replace(/,/g, ".");
        const next = input.value.slice(0, start) + insert + input.value.slice(end);
        if (!isValidPartial(next, dec)) ie.preventDefault();
    });
}
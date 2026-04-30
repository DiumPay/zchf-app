// Lightweight toast notification system.
// SSR-safe: no-ops on server. Picks up theme via CSS variables.
//
// Two tiers:
//  - toast(...)       → user-facing. Always renders.
//  - debugToast(...)  → infra/debug noise. Only renders if debug mode is on,
//                       otherwise just console.log/warn.
//
// Enable debug mode (any of these works):
//   • Add ?debug=1 to the URL
//   • In devtools: localStorage.setItem("debug", "1")
// Disable: localStorage.removeItem("debug") or remove the URL flag.

export type ToastType = "info" | "success" | "warning" | "error";

interface TypeStyle {
    bar: string;
}

const TYPE_STYLES: Record<ToastType, TypeStyle> = {
    info: { bar: "#6B7280" },
    success: { bar: "#10B981" },
    warning: { bar: "#F59E0B" },
    error: { bar: "var(--color-primary)" },
};

const CONTAINER_ID = "toast-container";

export function isDebugMode(): boolean {
    if (typeof window === "undefined") return false;
    try {
        if (new URLSearchParams(window.location.search).get("debug") === "1") return true;
        if (window.localStorage.getItem("debug") === "1") return true;
    } catch {
        // ignore (e.g. localStorage blocked)
    }
    return false;
}

function ensureContainer(): HTMLDivElement | null {
    if (typeof document === "undefined") return null;

    const existing = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
    if (existing) return existing;

    const c = document.createElement("div");
    c.id = CONTAINER_ID;
    Object.assign(c.style, {
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: "9999",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "360px",
        pointerEvents: "none",
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(c);
    return c;
}

function dismiss(el: HTMLElement) {
    el.style.opacity = "0";
    el.style.transform = "translateX(20px)";
    setTimeout(() => el.remove(), 250);
}

function render(message: string, type: ToastType, durationMs: number, debug: boolean): void {
    const c = ensureContainer();
    if (!c) return;

    const styles = TYPE_STYLES[type];

    const el = document.createElement("div");
    Object.assign(el.style, {
        background: "var(--color-muted)",
        color: "var(--color-foreground)",
        borderLeft: `4px solid ${styles.bar}`,
        padding: "12px 16px",
        fontSize: "14px",
        fontFamily: "var(--font-sans), sans-serif",
        boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
        borderRadius: "6px",
        pointerEvents: "auto",
        cursor: "pointer",
        opacity: "0",
        transform: "translateX(20px)",
        transition: "opacity 200ms ease, transform 200ms ease",
        wordBreak: "break-word",
        // Slight visual hint for debug toasts so they're distinguishable
        ...(debug ? { fontFamily: "var(--font-mono), monospace", opacity: "0.92" } : {}),
    } as Partial<CSSStyleDeclaration>);
    el.textContent = debug ? `[debug] ${message}` : message;

    el.addEventListener("click", () => dismiss(el));
    c.appendChild(el);

    requestAnimationFrame(() => {
        el.style.opacity = debug ? "0.92" : "1";
        el.style.transform = "translateX(0)";
    });

    setTimeout(() => dismiss(el), durationMs);
}

/** User-facing toast. Always renders. */
export function toast(
    message: string,
    type: ToastType = "info",
    durationMs = 4500
): void {
    render(message, type, durationMs, false);
}

/**
 * Developer/infra toast. Only renders when debug mode is on.
 * Always console.log/warn so devs can find it later in the console.
 */
export function debugToast(
    message: string,
    type: ToastType = "info",
    durationMs = 4500
): void {
    // Always log to console regardless of debug mode
    if (type === "error") console.warn(`[debug] ${message}`);
    else if (type === "warning") console.warn(`[debug] ${message}`);
    else console.log(`[debug] ${message}`);

    if (!isDebugMode()) return;
    render(message, type, durationMs, true);
}
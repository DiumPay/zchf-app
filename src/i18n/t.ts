// Translation helpers. Works on both server (Astro frontmatter) and client.
// Locale is detected from URL path prefix — same logic both sides.

import { messages, type Locale, type MessageKey } from "@i18n/messages";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "de", "fr", "it", "es"];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Detect locale from a pathname like "/de/earn" → "de", "/" → "en".
 *
 * Strips ".html" first because astro.config uses build.format:"file", so at
 * SSG time `Astro.url.pathname` is the FILE path — `/es.html`, not `/es`.
 * Without the strip:
 *   "/es.html".split("/")[1] === "es.html"  → not in SUPPORTED_LOCALES
 *   → falls through to "en" → dist/es.html ends up rendered in English.
 * Dev mode worked because Astro serves URLs without ".html".
 */
export function detectLocaleFromPath(pathname: string): Locale {
    const cleaned = pathname.replace(/\.html$/, "");
    const seg = cleaned.split("/")[1];
    if (seg && (SUPPORTED_LOCALES as readonly string[]).includes(seg)) {
        return seg as Locale;
    }
    return DEFAULT_LOCALE;
}

/** Convenience: get current locale from a URL or pathname. */
export function getLocale(urlOrPath: URL | string): Locale {
    const path = typeof urlOrPath === "string" ? urlOrPath : urlOrPath.pathname;
    return detectLocaleFromPath(path);
}

/**
 * Returns a translation function bound to the current URL/locale.
 *   const tt = t(Astro.url);
 *   tt("nav_borrow")  →  "Leihen" (if locale is de)
 */
export function t(urlOrPath: URL | string) {
    const locale = getLocale(urlOrPath);
    return (key: MessageKey): string =>
        messages[locale]?.[key] ?? messages[DEFAULT_LOCALE][key];
}

/**
 * Build the locale-prefixed version of a default-locale path.
 * Example: localePath("de", "/earn") → "/de/earn"
 *          localePath("en", "/earn") → "/earn"  (default has no prefix)
 *          localePath("de", "#")     → "#"      (anchors untouched)
 */
export function localePath(locale: Locale, defaultPath: string): string {
    if (defaultPath.startsWith("#") || defaultPath.startsWith("http")) {
        return defaultPath;
    }
    if (locale === DEFAULT_LOCALE) return defaultPath;
    if (defaultPath === "/") return `/${locale}`;
    return `/${locale}${defaultPath}`;
}

/**
 * Take the current URL and return the same page in a different locale.
 * Used by the language selector.
 *
 * Two SSG quirks we have to undo before remapping:
 *   1. build.format:"file" adds a ".html" suffix at SSG time —
 *      `Astro.url.pathname` is `/es.html` not `/es`. Without stripping,
 *      locale-prefix detection misses and we get stacks like `/fr/es.html`.
 *   2. The homepage builds as `/index.html` → after `.html` strip we'd have
 *      `/index`, and switching to `de` produced `/de/index`. Strip the
 *      trailing `/index` so the homepage maps to `/` first.
 *
 * Also preserves the query string and hash so e.g. `?address=0x...` survives
 * a language switch on routes like /mypositions.
 */
export function switchLocaleUrl(currentUrl: URL | string, target: Locale): string {
    const url = typeof currentUrl === "string"
        ? new URL(currentUrl, "http://_local")
        : currentUrl;
    const currentPath = url.pathname;

    // Normalize SSG file paths back to URL-shaped paths.
    let stripped = currentPath.replace(/\.html$/, "");
    if (stripped === "/index") stripped = "/";
    else if (stripped.endsWith("/index")) stripped = stripped.slice(0, -"/index".length);

    // Strip the current locale prefix to get the default-locale path.
    for (const l of SUPPORTED_LOCALES) {
        if (l === DEFAULT_LOCALE) continue;
        if (stripped === `/${l}` || stripped.startsWith(`/${l}/`)) {
            stripped = stripped.slice(l.length + 1) || "/";
            break;
        }
    }

    // Preserve query string (?address=0x...) and hash (#section)
    return localePath(target, stripped) + url.search + url.hash;
}
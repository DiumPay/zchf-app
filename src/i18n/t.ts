// Translation helpers. Works on both server (Astro frontmatter) and client.
// Locale is detected from URL path prefix — same logic both sides.

import { messages, type Locale, type MessageKey } from "@i18n/messages";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "de", "fr", "it", "es"];
export const DEFAULT_LOCALE: Locale = "en";

/** Detect locale from a pathname like "/de/earn" → "de", "/" → "en". */
export function detectLocaleFromPath(pathname: string): Locale {
    const seg = pathname.split("/")[1];
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
 */
export function switchLocaleUrl(currentUrl: URL | string, target: Locale): string {
    const currentPath = typeof currentUrl === "string" ? currentUrl : currentUrl.pathname;

    // Strip current locale prefix (if any) to get the default-locale path
    let stripped = currentPath;
    for (const l of SUPPORTED_LOCALES) {
        if (l === DEFAULT_LOCALE) continue;
        if (stripped === `/${l}` || stripped.startsWith(`/${l}/`)) {
            stripped = stripped.slice(l.length + 1) || "/";
            break;
        }
    }

    return localePath(target, stripped);
}

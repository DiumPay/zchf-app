//
// Merges all per-page locale files into a single `messages` export.
// To add a new page:
//   1. Create src/i18n/locales/<page>.ts following the same pattern
//   2. Import it here and spread it into each locale below

import { shared } from "./locales/shared";
import { earn } from "./locales/earn";

export const messages = {
    en: { ...shared.en, ...earn.en },
    de: { ...shared.de, ...earn.de },
    fr: { ...shared.fr, ...earn.fr },
    it: { ...shared.it, ...earn.it },
    es: { ...shared.es, ...earn.es },
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof typeof messages.en;
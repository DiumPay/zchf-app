//
// Merges all per-page locale files into a single `messages` export.
// To add a new page:
//   1. Create src/i18n/locales/<page>.ts following the same pattern
//   2. Import it here and spread it into each locale below

import { shared } from "./locales/shared";
import { earn } from "./locales/earn";
import { transfer } from "./locales/transfer"
import { borrow } from "./locales/borrow"

export const messages = {
    en: { ...shared.en, ...earn.en, ...transfer.en, ...borrow.en },
    de: { ...shared.de, ...earn.de, ...transfer.de, ...borrow.de },
    fr: { ...shared.fr, ...earn.fr, ...transfer.fr, ...borrow.fr },
    it: { ...shared.it, ...earn.it, ...transfer.it, ...borrow.it},
    es: { ...shared.es, ...earn.es, ...transfer.es, ...borrow.es },
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof typeof messages.en;
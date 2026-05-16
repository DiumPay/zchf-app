//
// Merges all per-page locale files into a single `messages` export.
// To add a new page:
//   1. Create src/i18n/locales/<page>.ts following the same pattern
//   2. Import it here and spread it into each locale below
import { shared } from "./locales/shared";
import { earn } from "./locales/earn";
import { transfer } from "./locales/transfer";
import { borrow } from "./locales/borrow";
import { mint } from "./locales/mint";
import { mypositions } from "./locales/mypositions";
import { create } from "./locales/create";
import { swap } from "./locales/swap";
import { equity } from "./locales/equity";
import { governance } from "./locales/governance";
import { monitoring } from "./locales/monitoring";

export const messages = {
    en: { ...shared.en, ...earn.en, ...transfer.en, ...borrow.en, ...mint.en, ...mypositions.en, ...create.en, ...swap.en, ...equity.en, ...governance.en, ...monitoring.en },
    de: { ...shared.de, ...earn.de, ...transfer.de, ...borrow.de, ...mint.de, ...mypositions.de, ...create.de, ...swap.de, ...equity.de, ...governance.de, ...monitoring.de },
    fr: { ...shared.fr, ...earn.fr, ...transfer.fr, ...borrow.fr, ...mint.fr, ...mypositions.fr, ...create.fr, ...swap.fr, ...equity.fr, ...governance.fr, ...monitoring.fr },
    it: { ...shared.it, ...earn.it, ...transfer.it, ...borrow.it, ...mint.it, ...mypositions.it, ...create.it, ...swap.it, ...equity.it, ...governance.it, ...monitoring.it },
    es: { ...shared.es, ...earn.es, ...transfer.es, ...borrow.es, ...mint.es, ...mypositions.es, ...create.es, ...swap.es, ...equity.es, ...governance.es, ...monitoring.es },
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof typeof messages.en;
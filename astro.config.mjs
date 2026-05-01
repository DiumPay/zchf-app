// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { i18n } from "astro-i18n-aut/integration";

const defaultLocale = "en";
const locales = {
    en: "en-US",
    de: "de-CH", // Swiss German — primary audience
    fr: "fr-CH", // Swiss French
    it: "it-CH", // Swiss Italian
    es: "es-ES",
};

// https://astro.build/config
export default defineConfig({
    trailingSlash: "never",
    build: {
        format: "file",
    },
    integrations: [
        i18n({
            locales,
            defaultLocale,
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
    },
});
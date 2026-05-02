// Strings used across multiple pages: nav, wallet, common, menu, footer.
// Anything page-specific belongs in its own file (earn.ts, borrow.ts, ...).
export const shared = {
  en: {
    // Nav
    nav_borrow: "Borrow",
    nav_earn: "Earn",
    nav_my_positions: "My Positions",
    nav_transfer: "Transfer",

    // Wallet
    wallet_connect: "Connect",
    wallet_disconnect_confirm: "Are you sure you want to disconnect your wallet?",
    wallet_not_connected: "Wallet not connected",

    // Common
    common_cancelled: "Cancelled",
    common_amount_positive: "Amount must be greater than 0",

    // Menu
    menu_toggle: "Toggle menu",
    theme_toggle: "Toggle color theme",

    // Footer
    footer_attribution_pre: "Independent open-source frontend by",
    footer_attribution_post: "built on Frankencoin smart contracts.",
    footer_twitter: "X (Twitter)",
    footer_telegram: "Telegram",
    footer_forum: "GitHub Discussions",
    footer_github: "Source on GitHub",
    footer_docs: "Documentation",
  },

  de: {
    // Nav
    nav_borrow: "Leihen",
    nav_earn: "Sparen",
    nav_my_positions: "Übersicht",
    nav_transfer: "Übertragen",

    // Wallet
    wallet_connect: "Verbinden",
    wallet_disconnect_confirm: "Möchten Sie Ihre Wallet wirklich trennen?",
    wallet_not_connected: "Wallet nicht verbunden",

    // Common
    common_cancelled: "Abgebrochen",
    common_amount_positive: "Betrag muss grösser als 0 sein",

    // Menu
    menu_toggle: "Menü umschalten",
    theme_toggle: "Farbschema umschalten",

    // Footer
    footer_attribution_pre: "Unabhängiges Open-Source-Frontend von",
    footer_attribution_post: "basierend auf Frankencoin Smart Contracts.",
    footer_twitter: "X (Twitter)",
    footer_telegram: "Telegram",
    footer_forum: "GitHub-Diskussionen",
    footer_github: "Quellcode auf GitHub",
    footer_docs: "Dokumentation",
  },

  fr: {
    // Nav
    nav_borrow: "Emprunter",
    nav_earn: "Épargner",
    nav_my_positions: "Tableau de bord",
    nav_transfer: "Transférer",

    // Wallet
    wallet_connect: "Connecter",
    wallet_disconnect_confirm: "Êtes-vous sûr de vouloir déconnecter votre portefeuille ?",
    wallet_not_connected: "Portefeuille non connecté",

    // Common
    common_cancelled: "Annulé",
    common_amount_positive: "Le montant doit être supérieur à 0",

    // Menu
    menu_toggle: "Basculer le menu",
    theme_toggle: "Changer le thème",

    // Footer
    footer_attribution_pre: "Frontend open source indépendant par",
    footer_attribution_post: "construit sur les smart contracts Frankencoin.",
    footer_twitter: "X (Twitter)",
    footer_telegram: "Telegram",
    footer_forum: "Discussions GitHub",
    footer_github: "Code source sur GitHub",
    footer_docs: "Documentation",
  },

  it: {
    // Nav
    nav_borrow: "Prestiti",
    nav_earn: "Risparmi",
    nav_my_positions: "Pannello",
    nav_transfer: "Trasferisci",

    // Wallet
    wallet_connect: "Connetti",
    wallet_disconnect_confirm: "Sei sicuro di voler disconnettere il tuo wallet?",
    wallet_not_connected: "Wallet non connesso",

    // Common
    common_cancelled: "Annullato",
    common_amount_positive: "L'importo deve essere maggiore di 0",

    // Menu
    menu_toggle: "Apri/chiudi menu",
    theme_toggle: "Cambia tema",

    // Footer
    footer_attribution_pre: "Frontend open source indipendente da",
    footer_attribution_post: "basato su smart contract Frankencoin.",
    footer_twitter: "X (Twitter)",
    footer_telegram: "Telegram",
    footer_forum: "Discussioni GitHub",
    footer_github: "Codice sorgente su GitHub",
    footer_docs: "Documentazione",
  },

  es: {
    // Nav
    nav_borrow: "Préstamos",
    nav_earn: "Ahorros",
    nav_my_positions: "Panel",
    nav_transfer: "Transferir",

    // Wallet
    wallet_connect: "Conectar",
    wallet_disconnect_confirm: "¿Seguro que quieres desconectar tu wallet?",
    wallet_not_connected: "Wallet no conectada",

    // Common
    common_cancelled: "Cancelado",
    common_amount_positive: "El importe debe ser mayor que 0",

    // Menu
    menu_toggle: "Alternar menú",
    theme_toggle: "Cambiar tema",

    // Footer
    footer_attribution_pre: "Frontend de código abierto independiente de",
    footer_attribution_post: "construido con smart contracts de Frankencoin.",
    footer_twitter: "X (Twitter)",
    footer_telegram: "Telegram",
    footer_forum: "Discusiones de GitHub",
    footer_github: "Código fuente en GitHub",
    footer_docs: "Documentación",
  },
} as const;
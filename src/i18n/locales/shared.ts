// Strings used across multiple pages: nav, wallet, common, menu.
// Anything page-specific belongs in its own file (earn.ts, borrow.ts, ...).

export const shared = {
    en: {
        // Nav
        nav_borrow: "Borrow",
        nav_earn: "Earn",
        nav_dashboard: "Dashboard",
        nav_bridge: "Bridge",

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
    },

    de: {
        nav_borrow: "Leihen",
        nav_earn: "Sparen",
        nav_dashboard: "Übersicht",
        nav_bridge: "Brücke",

        wallet_connect: "Verbinden",
        wallet_disconnect_confirm: "Möchten Sie Ihre Wallet wirklich trennen?",
        wallet_not_connected: "Wallet nicht verbunden",

        common_cancelled: "Abgebrochen",
        common_amount_positive: "Betrag muss grösser als 0 sein",

        menu_toggle: "Menü umschalten",
        theme_toggle: "Farbschema umschalten",
    },

    fr: {
        nav_borrow: "Emprunter",
        nav_earn: "Épargner",
        nav_dashboard: "Tableau de bord",
        nav_bridge: "Pont",

        wallet_connect: "Connecter",
        wallet_disconnect_confirm: "Êtes-vous sûr de vouloir déconnecter votre portefeuille ?",
        wallet_not_connected: "Portefeuille non connecté",

        common_cancelled: "Annulé",
        common_amount_positive: "Le montant doit être supérieur à 0",

        menu_toggle: "Basculer le menu",
        theme_toggle: "Changer le thème",
    },

    it: {
        nav_borrow: "Prestiti",
        nav_earn: "Risparmi",
        nav_dashboard: "Pannello",
        nav_bridge: "Ponte",

        wallet_connect: "Connetti",
        wallet_disconnect_confirm: "Sei sicuro di voler disconnettere il tuo wallet?",
        wallet_not_connected: "Wallet non connesso",

        common_cancelled: "Annullato",
        common_amount_positive: "L'importo deve essere maggiore di 0",

        menu_toggle: "Apri/chiudi menu",
        theme_toggle: "Cambia tema",
    },

    es: {
        nav_borrow: "Préstamos",
        nav_earn: "Ahorros",
        nav_dashboard: "Panel",
        nav_bridge: "Puente",

        wallet_connect: "Conectar",
        wallet_disconnect_confirm: "¿Seguro que quieres desconectar tu wallet?",
        wallet_not_connected: "Wallet no conectada",

        common_cancelled: "Cancelado",
        common_amount_positive: "El importe debe ser mayor que 0",

        menu_toggle: "Alternar menú",
        theme_toggle: "Cambiar tema",
    },
} as const;
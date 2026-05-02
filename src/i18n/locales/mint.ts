export const mint = {
    en: {
        // Header
        mint_meta_position: "Position contract",
        mint_meta_token: "{symbol} token",
        mint_status_active: "Active",
        mint_badge_clone: "Clone",

        // Card
        mint_card_title: "Mint Frankencoins",

        // Linked inputs
        mint_input_deposit: "Deposit",
        mint_input_mint_now: "Mint now",
        mint_input_max: "Max",
        mint_input_balance: "Balance",
        mint_input_mintable: "Mintable",
        mint_input_pool_capacity: "Max mintable",

        // Slider
        mint_slider_label: "Liquidation Price",
        mint_slider_reference: "Reference",
        mint_slider_ltv: "LTV",
        mint_slider_cooldown_warning: "⚠ 3-day cooldown above reference",
        mint_slider_no_oracle_title: "Liquidation Price",
        mint_slider_no_oracle_text: "No public market price feed for this collateral. Price adjustment is unavailable.",

        // Expiration picker
        mint_expiry_label: "Repay by",
        mint_expiry_max: "Max",

        // Outcome breakdown
        mint_outcome_minted: "Minted",
        mint_outcome_reserve: "Retained reserve",
        mint_outcome_repaid: "To be repaid in the end",
        mint_outcome_interest: "Upfront interest",
        mint_outcome_per_year: "{rate}% per year",
        mint_outcome_sent: "Sent to your wallet",

        // Actions
        mint_action_approve: "Approve {symbol}",
        mint_action_mint: "Mint",

        mint_action_switch_chain: "Switch to Ethereum",
        mint_action_switching: "Switching network…",

        mint_expiry_hint: "Loan expires {date} at {time}, your local time",

        mint_action_approving: "Approving {symbol}…",
        mint_action_minting: "Minting…",
        mint_action_approve_required: "Approve {symbol}",
        mint_err_amount_required: "Enter an amount",
        mint_err_min_collateral: "Minimum {amount} {symbol} required",
        mint_err_balance_low: "Not enough {symbol} in your wallet",
        mint_err_exceeds_pool: "Mint amount exceeds the pool capacity",
        mint_err_exceeds_collateral: "Mint amount exceeds the collateral's value at this price",
        mint_toast_approved: "{symbol} approved",
        mint_toast_minted: "Position created",
        mint_status_pending: "This position is pending governance approval.",
        mint_status_cooldown: "This position is in a cooldown period.",

        mint_err_rpc_title: "Your wallet's network isn't responding",
        mint_err_rpc_body: "Your wallet returned a JSON-RPC error. The RPC endpoint configured for your current network is offline, rate-limited, or misconfigured.",
        mint_err_rpc_help: "Try one of these: (1) switch to a different network in your wallet and back, (2) edit your current network and replace the RPC URL with a working one (see chainlist.org), or (3) restart your wallet.",
    },

    de: {
        mint_meta_position: "Positionsvertrag",
        mint_meta_token: "{symbol}-Token",
        mint_status_active: "Aktiv",
        mint_badge_clone: "Klon",

        mint_card_title: "Frankencoins prägen",

        mint_input_deposit: "Einzahlung",
        mint_input_mint_now: "Jetzt prägen",
        mint_input_max: "Max",
        mint_input_balance: "Guthaben",
        mint_input_mintable: "Prägbar",
        mint_input_pool_capacity: "Maximal prägbar",

        mint_slider_label: "Liquidationspreis",
        mint_slider_reference: "Referenz",
        mint_slider_ltv: "LTV",
        mint_slider_cooldown_warning: "⚠ 3-tägige Wartezeit oberhalb der Referenz",
        mint_slider_no_oracle_title: "Liquidationspreis",
        mint_slider_no_oracle_text: "Für diese Sicherheit gibt es keinen öffentlichen Marktpreis. Eine Anpassung ist nicht möglich.",

        mint_expiry_label: "Rückzahlung bis",
        mint_expiry_max: "Max",

        mint_outcome_minted: "Geprägt",
        mint_outcome_reserve: "Einbehaltene Reserve",
        mint_outcome_repaid: "Am Ende rückzuzahlen",
        mint_outcome_interest: "Vorauszinsen",
        mint_outcome_per_year: "{rate}% pro Jahr",
        mint_outcome_sent: "An Ihre Wallet gesendet",

        mint_action_approve: "{symbol} freigeben",
        mint_action_mint: "Prägen",

        mint_action_switch_chain: "Zu Ethereum wechseln",
        mint_action_switching: "Netzwerk wird gewechselt…",

        mint_expiry_hint: "Kredit läuft ab am {date} um {time}, Ihre Ortszeit",

        mint_action_approving: "{symbol} wird freigegeben…",
        mint_action_minting: "Wird geprägt…",
        mint_action_approve_required: "{symbol} freigeben",
        mint_err_amount_required: "Bitte Betrag eingeben",
        mint_err_min_collateral: "Mindestens {amount} {symbol} erforderlich",
        mint_err_balance_low: "Nicht genug {symbol} in Ihrer Wallet",
        mint_err_exceeds_pool: "Prägebetrag überschreitet die Pool-Kapazität",
        mint_err_exceeds_collateral: "Prägebetrag überschreitet den Sicherheitenwert bei diesem Preis",
        mint_toast_approved: "{symbol} freigegeben",
        mint_toast_minted: "Position erstellt",
        mint_status_pending: "Diese Position wartet auf die Governance-Genehmigung.",
        mint_status_cooldown: "Diese Position befindet sich in einer Wartezeit.",

        mint_err_rpc_title: "Ihr Wallet-Netzwerk antwortet nicht",
        mint_err_rpc_body: "Ihre Wallet hat einen JSON-RPC-Fehler zurückgegeben. Der für Ihr aktuelles Netzwerk konfigurierte RPC-Endpunkt ist offline, durch Rate-Limiting blockiert oder falsch konfiguriert.",
        mint_err_rpc_help: "Versuchen Sie eine dieser Optionen: (1) wechseln Sie in Ihrer Wallet zu einem anderen Netzwerk und wieder zurück, (2) bearbeiten Sie das aktuelle Netzwerk und ersetzen Sie die RPC-URL durch eine funktionierende (siehe chainlist.org), oder (3) starten Sie Ihre Wallet neu.",
    },

    fr: {
        mint_meta_position: "Contrat de position",
        mint_meta_token: "Jeton {symbol}",
        mint_status_active: "Actif",
        mint_badge_clone: "Clone",

        mint_card_title: "Émettre des Frankencoins",

        mint_input_deposit: "Dépôt",
        mint_input_mint_now: "Émettre maintenant",
        mint_input_max: "Max",
        mint_input_balance: "Solde",
        mint_input_mintable: "Émissible",
        mint_input_pool_capacity: "Émissible maximum",

        mint_slider_label: "Prix de liquidation",
        mint_slider_reference: "Référence",
        mint_slider_ltv: "LTV",
        mint_slider_cooldown_warning: "⚠ Délai de 3 jours au-dessus de la référence",
        mint_slider_no_oracle_title: "Prix de liquidation",
        mint_slider_no_oracle_text: "Aucune source de prix de marché publique pour cette garantie. L'ajustement du prix n'est pas disponible.",

        mint_expiry_label: "Rembourser avant",
        mint_expiry_max: "Max",

        mint_outcome_minted: "Émis",
        mint_outcome_reserve: "Réserve retenue",
        mint_outcome_repaid: "À rembourser à la fin",
        mint_outcome_interest: "Intérêts d'avance",
        mint_outcome_per_year: "{rate}% par an",
        mint_outcome_sent: "Envoyé à votre portefeuille",

        mint_action_approve: "Autoriser {symbol}",
        mint_action_mint: "Émettre",

        mint_action_switch_chain: "Passer à Ethereum",
        mint_action_switching: "Changement de réseau…",

        mint_expiry_hint: "Le prêt expire le {date} à {time}, heure locale",

        mint_action_approving: "Autorisation de {symbol}…",
        mint_action_minting: "Émission en cours…",
        mint_action_approve_required: "Autoriser {symbol}",
        mint_err_amount_required: "Entrer un montant",
        mint_err_min_collateral: "Minimum de {amount} {symbol} requis",
        mint_err_balance_low: "{symbol} insuffisant dans votre portefeuille",
        mint_err_exceeds_pool: "Le montant dépasse la capacité du pool",
        mint_err_exceeds_collateral: "Le montant dépasse la valeur de la garantie à ce prix",
        mint_toast_approved: "{symbol} autorisé",
        mint_toast_minted: "Position créée",
        mint_status_pending: "Cette position est en attente d'approbation de la gouvernance.",
        mint_status_cooldown: "Cette position est en période de cooldown.",

        mint_err_rpc_title: "Le réseau de votre portefeuille ne répond pas",
        mint_err_rpc_body: "Votre portefeuille a renvoyé une erreur JSON-RPC. Le point de terminaison RPC configuré pour votre réseau actuel est hors ligne, limité en débit ou mal configuré.",
        mint_err_rpc_help: "Essayez l'une de ces solutions : (1) basculez vers un autre réseau dans votre portefeuille puis revenez, (2) modifiez votre réseau actuel et remplacez l'URL RPC par une qui fonctionne (voir chainlist.org), ou (3) redémarrez votre portefeuille.",
    },

    it: {
        mint_meta_position: "Contratto della posizione",
        mint_meta_token: "Token {symbol}",
        mint_status_active: "Attivo",
        mint_badge_clone: "Clone",

        mint_card_title: "Conia Frankencoin",

        mint_input_deposit: "Deposito",
        mint_input_mint_now: "Conia ora",
        mint_input_max: "Max",
        mint_input_balance: "Saldo",
        mint_input_mintable: "Coniabile",
        mint_input_pool_capacity: "Massimo coniabile",

        mint_slider_label: "Prezzo di liquidazione",
        mint_slider_reference: "Riferimento",
        mint_slider_ltv: "LTV",
        mint_slider_cooldown_warning: "⚠ Attesa di 3 giorni sopra il riferimento",
        mint_slider_no_oracle_title: "Prezzo di liquidazione",
        mint_slider_no_oracle_text: "Nessuna fonte pubblica del prezzo di mercato per questo collaterale. La modifica del prezzo non è disponibile.",

        mint_expiry_label: "Rimborsa entro",
        mint_expiry_max: "Max",

        mint_outcome_minted: "Coniato",
        mint_outcome_reserve: "Riserva trattenuta",
        mint_outcome_repaid: "Da rimborsare alla fine",
        mint_outcome_interest: "Interessi anticipati",
        mint_outcome_per_year: "{rate}% all'anno",
        mint_outcome_sent: "Inviato al tuo wallet",

        mint_action_approve: "Approva {symbol}",
        mint_action_mint: "Conia",

        mint_action_switch_chain: "Passa a Ethereum",
        mint_action_switching: "Cambio di rete in corso…",

        mint_expiry_hint: "Il prestito scade il {date} alle {time}, ora locale",

        mint_action_approving: "Approvazione di {symbol}…",
        mint_action_minting: "Coniazione in corso…",
        mint_action_approve_required: "Approva {symbol}",
        mint_err_amount_required: "Inserisci un importo",
        mint_err_min_collateral: "Minimo {amount} {symbol} richiesto",
        mint_err_balance_low: "{symbol} insufficiente nel tuo wallet",
        mint_err_exceeds_pool: "L'importo supera la capacità del pool",
        mint_err_exceeds_collateral: "L'importo supera il valore del collaterale a questo prezzo",
        mint_toast_approved: "{symbol} approvato",
        mint_toast_minted: "Posizione creata",
        mint_status_pending: "Questa posizione è in attesa di approvazione della governance.",
        mint_status_cooldown: "Questa posizione è in periodo di cooldown.",

        mint_err_rpc_title: "La rete del tuo wallet non risponde",
        mint_err_rpc_body: "Il tuo wallet ha restituito un errore JSON-RPC. L'endpoint RPC configurato per la tua rete attuale è offline, soggetto a rate limit o configurato male.",
        mint_err_rpc_help: "Prova una di queste soluzioni: (1) passa a una rete diversa nel tuo wallet e poi torna indietro, (2) modifica la rete attuale e sostituisci l'URL RPC con uno funzionante (vedi chainlist.org), oppure (3) riavvia il tuo wallet.",
    },

    es: {
        mint_meta_position: "Contrato de posición",
        mint_meta_token: "Token {symbol}",
        mint_status_active: "Activo",
        mint_badge_clone: "Clon",

        mint_card_title: "Emitir Frankencoins",

        mint_input_deposit: "Depósito",
        mint_input_mint_now: "Emitir ahora",
        mint_input_max: "Máx",
        mint_input_balance: "Saldo",
        mint_input_mintable: "Emisible",
        mint_input_pool_capacity: "Máximo emisible",

        mint_slider_label: "Precio de liquidación",
        mint_slider_reference: "Referencia",
        mint_slider_ltv: "LTV",
        mint_slider_cooldown_warning: "⚠ Espera de 3 días por encima de la referencia",
        mint_slider_no_oracle_title: "Precio de liquidación",
        mint_slider_no_oracle_text: "No hay fuente pública de precio de mercado para este colateral. El ajuste de precio no está disponible.",

        mint_expiry_label: "Devolver antes de",
        mint_expiry_max: "Máx",

        mint_outcome_minted: "Emitido",
        mint_outcome_reserve: "Reserva retenida",
        mint_outcome_repaid: "A devolver al final",
        mint_outcome_interest: "Interés por adelantado",
        mint_outcome_per_year: "{rate}% por año",
        mint_outcome_sent: "Enviado a tu wallet",

        mint_action_approve: "Autorizar {symbol}",
        mint_action_mint: "Emitir",

        mint_action_switch_chain: "Cambiar a Ethereum",
        mint_action_switching: "Cambiando de red…",

        mint_expiry_hint: "El préstamo expira el {date} a las {time}, hora local",

        mint_action_approving: "Autorizando {symbol}…",
        mint_action_minting: "Emitiendo…",
        mint_action_approve_required: "Autorizar {symbol}",
        mint_err_amount_required: "Introduce un importe",
        mint_err_min_collateral: "Mínimo {amount} {symbol} requerido",
        mint_err_balance_low: "{symbol} insuficiente en tu wallet",
        mint_err_exceeds_pool: "El importe supera la capacidad del pool",
        mint_err_exceeds_collateral: "El importe supera el valor del colateral a este precio",
        mint_toast_approved: "{symbol} autorizado",
        mint_toast_minted: "Posición creada",
        mint_status_pending: "Esta posición está pendiente de aprobación de la gobernanza.",
        mint_status_cooldown: "Esta posición está en periodo de cooldown.",

        mint_err_rpc_title: "La red de tu wallet no responde",
        mint_err_rpc_body: "Tu wallet devolvió un error JSON-RPC. El endpoint RPC configurado para tu red actual está fuera de línea, limitado por tasa o mal configurado.",
        mint_err_rpc_help: "Prueba una de estas opciones: (1) cambia a otra red en tu wallet y vuelve, (2) edita tu red actual y reemplaza la URL RPC con una que funcione (ver chainlist.org), o (3) reinicia tu wallet.",
    },
} as const;
export const mypositions = {
  en: {
    // Page chrome
    mypos_page_title: "My Positions",
    mypos_subtitle: "Manage your collateralized loans",
    mypos_empty: "You don't have any positions yet.",
    mypos_loading: "Loading your positions…",

    // Card (list)
    mypos_card_minted: "Minted",
    mypos_card_collateral: "Collateral",
    mypos_card_liq_price: "Liquidation price",
    mypos_card_expires: "Expires",

    // Status badges
    mypos_status_closed: "Closed",
    mypos_status_challenged: "Challenged",
    mypos_status_cooldown_short: "Cooldown",

    // Manage view
    mypos_manage_title: "Adjust position",
    mypos_back: "Back to positions",
    mypos_label_mint: "Minted amount",
    mypos_label_collateral: "Collateral",
    mypos_label_liq_price: "Liquidation price",
    mypos_label_maturity: "Maturity",
    mypos_label_interest: "Annual interest",

    // Actions
    mypos_action_adjust: "Adjust position",
    mypos_action_adjusting: "Adjusting…",

    // Outcome panel
    mypos_outcome_current: "Current minted",
    mypos_outcome_future: "Future minted",
    mypos_outcome_wallet: "To/from your wallet",
    mypos_outcome_reserve: "Reserve change",
    mypos_outcome_fee: "Upfront interest",

    // Errors
    mypos_err_cooldown: "Position is in cooldown",
    mypos_err_closed: "Position is closed",
    mypos_err_challenged: "Cannot reduce collateral while challenged",
    mypos_err_amount_limit: "Exceeds position limit",
    mypos_err_collateral_low: "Not enough collateral for this mint amount and price",
    mypos_err_balance_low_zchf: "Not enough ZCHF in your wallet to repay",
    mypos_err_price_locked: "Cannot increase mint while raising price (cooldown required first)",

    // Toasts
    mypos_toast_approved: "{symbol} approved",
    mypos_toast_adjusted: "Position adjusted",

    // Badges
    mypos_badge_v2: "V2",

    // Manage subtitle & sections
    mypos_manage_subtitle: "Manage your position.",
    mypos_section_adjustment: "Adjustment",
    mypos_section_wallet: "Connected Wallet",
    mypos_section_outcome: "Adjustment Outcome",

    // Labels
    mypos_label_amount: "Amount",
    mypos_label_expiration: "Expiration",
    mypos_label_balance_short: "Balance",
    mypos_label_min: "Min",
    mypos_label_max: "Max",

    // Wallet
    mypos_wallet_zchf: "Frankencoin Balance",
    mypos_wallet_coll: "Collateral Balance",

    // Outcome details
    mypos_outcome_current_amount: "Current minted amount",
    mypos_outcome_future_amount: "Future minted amount",
    mypos_outcome_wallet_inc: "Sent to your wallet",
    mypos_outcome_wallet_dec: "To be added from your wallet",
    mypos_outcome_reserve_add: "Added to reserve on your behalf",
    mypos_outcome_reserve_return: "Returned from reserve",

    // Links
    mypos_link_details: "Details",
    mypos_link_contract: "Contract",

    // Units
    mypos_unit_year: "yr",
    mypos_unit_month: "mo",
    mypos_unit_day: "d",

    // Status
    mypos_expired: "expired",

    mypos_section_details: "Position Details",
    mypos_label_reset: "Reset",
    mypos_note_coll_sent_back: "{amount} {symbol} sent back to your wallet",
    mypos_note_coll_taken: "{amount} {symbol} taken from your wallet",

    // Roller (renewal) — flash-mint refinance into a longer position
    mypos_roller_section: "Renewal",
    mypos_roller_intro: "Roll this position into a longer one with the same collateral. The owed amount will be increased by the upfront interest of the new position. Excess collateral is returned to your wallet.",
    mypos_roller_none: "No open positions available for rolling.",
    mypos_roller_loading: "Looking for renewal targets…",
    mypos_roller_col_target: "Target",
    mypos_roller_col_liq: "Liquidation Price",
    mypos_roller_col_interest: "Annual Interest",
    mypos_roller_col_maturity: "Maturity",
    mypos_roller_col_missing: "Additional Funds",
    mypos_roller_roll: "Roll",
    mypos_roller_merge: "Merge",
    mypos_roller_approve: "Approve {symbol}",
    mypos_roller_approving: "Approving…",
    mypos_roller_rolling: "Rolling…",
    mypos_roller_merging: "Merging…",
    mypos_roller_cooldown: "Cooldown",
    mypos_roller_toast_rolled: "Position rolled",
    mypos_roller_toast_merged: "Position merged",
    mypos_roller_err_balance: "Insufficient ZCHF to cover additional funds",

    // Public view — read-only mode when ?owner=… is in the URL
    mypos_public_banner: "Viewing positions of {owner}. Read-only.",
    mypos_public_close: "Close",
    mypos_public_empty: "This address has no open positions.",
    mypos_public_manage_notice: "Read-only view. Connect as the owner to manage this position.",
  },

  de: {
    // Page chrome
    mypos_page_title: "Meine Positionen",
    mypos_subtitle: "Verwalten Sie Ihre besicherten Kredite",
    mypos_empty: "Sie haben noch keine Positionen.",
    mypos_loading: "Ihre Positionen werden geladen…",

    // Card (list)
    mypos_card_minted: "Geprägt",
    mypos_card_collateral: "Sicherheit",
    mypos_card_liq_price: "Liquidationspreis",
    mypos_card_expires: "Läuft ab",

    // Status badges
    mypos_status_closed: "Geschlossen",
    mypos_status_challenged: "Angefochten",
    mypos_status_cooldown_short: "Wartezeit",

    // Manage view
    mypos_manage_title: "Position anpassen",
    mypos_back: "Zurück zu Positionen",
    mypos_label_mint: "Geprägter Betrag",
    mypos_label_collateral: "Sicherheit",
    mypos_label_liq_price: "Liquidationspreis",
    mypos_label_maturity: "Fälligkeit",
    mypos_label_interest: "Jahreszins",

    // Actions
    mypos_action_adjust: "Position anpassen",
    mypos_action_adjusting: "Wird angepasst…",

    // Outcome panel
    mypos_outcome_current: "Aktuell geprägt",
    mypos_outcome_future: "Zukünftig geprägt",
    mypos_outcome_wallet: "Aus/zu Ihrer Wallet",
    mypos_outcome_reserve: "Reserveänderung",
    mypos_outcome_fee: "Vorauszinsen",

    // Errors
    mypos_err_cooldown: "Position ist in Wartezeit",
    mypos_err_closed: "Position ist geschlossen",
    mypos_err_challenged: "Sicherheit kann während einer Anfechtung nicht reduziert werden",
    mypos_err_amount_limit: "Überschreitet das Positionslimit",
    mypos_err_collateral_low: "Nicht genug Sicherheit für diesen Prägebetrag und Preis",
    mypos_err_balance_low_zchf: "Nicht genug ZCHF in Ihrer Wallet zur Rückzahlung",
    mypos_err_price_locked: "Prägung kann nicht erhöht werden, während der Preis steigt (Wartezeit erforderlich)",

    // Toasts
    mypos_toast_approved: "{symbol} freigegeben",
    mypos_toast_adjusted: "Position angepasst",

    // Badges
    mypos_badge_v2: "V2",

    // Manage subtitle & sections
    mypos_manage_subtitle: "Verwalten Sie Ihre Position.",
    mypos_section_adjustment: "Anpassung",
    mypos_section_wallet: "Verbundene Wallet",
    mypos_section_outcome: "Anpassungsergebnis",

    // Labels
    mypos_label_amount: "Betrag",
    mypos_label_expiration: "Ablauf",
    mypos_label_balance_short: "Saldo",
    mypos_label_min: "Min",
    mypos_label_max: "Max",

    // Wallet
    mypos_wallet_zchf: "Frankencoin-Saldo",
    mypos_wallet_coll: "Sicherheitssaldo",

    // Outcome details
    mypos_outcome_current_amount: "Aktuell geprägter Betrag",
    mypos_outcome_future_amount: "Zukünftig geprägter Betrag",
    mypos_outcome_wallet_inc: "An Ihre Wallet gesendet",
    mypos_outcome_wallet_dec: "Aus Ihrer Wallet hinzuzufügen",
    mypos_outcome_reserve_add: "Zur Reserve hinzugefügt",
    mypos_outcome_reserve_return: "Aus Reserve zurückgegeben",

    // Links
    mypos_link_details: "Details",
    mypos_link_contract: "Kontrakt",

    // Units
    mypos_unit_year: "J",
    mypos_unit_month: "M",
    mypos_unit_day: "T",

    // Status
    mypos_expired: "abgelaufen",

    mypos_section_details: "Positionsdetails",
    mypos_label_reset: "Zurücksetzen",
    mypos_note_coll_sent_back: "{amount} {symbol} an Ihre Wallet zurückgesendet",
    mypos_note_coll_taken: "{amount} {symbol} aus Ihrer Wallet entnommen",

    // Roller (Erneuerung) — Flash-Mint Refinanzierung in eine längere Position
    mypos_roller_section: "Erneuerung",
    mypos_roller_intro: "Übertragen Sie diese Position in eine längere mit derselben Sicherheit. Der geschuldete Betrag wird um die Vorabzinsen der neuen Position erhöht. Überschüssige Sicherheit wird an Ihre Wallet zurückgegeben.",
    mypos_roller_none: "Keine offenen Positionen zum Übertragen verfügbar.",
    mypos_roller_loading: "Suche nach Erneuerungszielen…",
    mypos_roller_col_target: "Ziel",
    mypos_roller_col_liq: "Liquidationspreis",
    mypos_roller_col_interest: "Jahreszins",
    mypos_roller_col_maturity: "Fälligkeit",
    mypos_roller_col_missing: "Zusätzliche Mittel",
    mypos_roller_roll: "Übertragen",
    mypos_roller_merge: "Zusammenführen",
    mypos_roller_approve: "{symbol} genehmigen",
    mypos_roller_approving: "Wird genehmigt…",
    mypos_roller_rolling: "Wird übertragen…",
    mypos_roller_merging: "Wird zusammengeführt…",
    mypos_roller_cooldown: "Wartezeit",
    mypos_roller_toast_rolled: "Position übertragen",
    mypos_roller_toast_merged: "Position zusammengeführt",
    mypos_roller_err_balance: "Nicht genügend ZCHF zur Deckung der zusätzlichen Mittel",

    // Öffentliche Ansicht — schreibgeschützt bei ?owner=… in der URL
    mypos_public_banner: "Positionen von {owner} werden angezeigt. Schreibgeschützt.",
    mypos_public_close: "Schließen",
    mypos_public_empty: "Diese Adresse hat keine offenen Positionen.",
    mypos_public_manage_notice: "Schreibgeschützte Ansicht. Als Eigentümer verbinden, um diese Position zu verwalten.",
  },

  fr: {
    // Page chrome
    mypos_page_title: "Mes Positions",
    mypos_subtitle: "Gérez vos prêts collatéralisés",
    mypos_empty: "Vous n'avez encore aucune position.",
    mypos_loading: "Chargement de vos positions…",

    // Card (list)
    mypos_card_minted: "Émis",
    mypos_card_collateral: "Garantie",
    mypos_card_liq_price: "Prix de liquidation",
    mypos_card_expires: "Expire le",

    // Status badges
    mypos_status_closed: "Fermée",
    mypos_status_challenged: "Contestée",
    mypos_status_cooldown_short: "Délai",

    // Manage view
    mypos_manage_title: "Ajuster la position",
    mypos_back: "Retour aux positions",
    mypos_label_mint: "Montant émis",
    mypos_label_collateral: "Garantie",
    mypos_label_liq_price: "Prix de liquidation",
    mypos_label_maturity: "Échéance",
    mypos_label_interest: "Intérêt annuel",

    // Actions
    mypos_action_adjust: "Ajuster la position",
    mypos_action_adjusting: "Ajustement en cours…",

    // Outcome panel
    mypos_outcome_current: "Émis actuellement",
    mypos_outcome_future: "Émis après ajustement",
    mypos_outcome_wallet: "Vers/depuis votre portefeuille",
    mypos_outcome_reserve: "Variation de réserve",
    mypos_outcome_fee: "Intérêts d'avance",

    // Errors
    mypos_err_cooldown: "La position est en délai",
    mypos_err_closed: "La position est fermée",
    mypos_err_challenged: "Impossible de réduire la garantie pendant une contestation",
    mypos_err_amount_limit: "Dépasse la limite de la position",
    mypos_err_collateral_low: "Garantie insuffisante pour ce montant et ce prix",
    mypos_err_balance_low_zchf: "ZCHF insuffisant dans votre portefeuille pour rembourser",
    mypos_err_price_locked: "Impossible d'augmenter l'émission en augmentant le prix (délai requis)",

    // Toasts
    mypos_toast_approved: "{symbol} autorisé",
    mypos_toast_adjusted: "Position ajustée",

    // Badges
    mypos_badge_v2: "V2",

    // Manage subtitle & sections
    mypos_manage_subtitle: "Gérez votre position.",
    mypos_section_adjustment: "Ajustement",
    mypos_section_wallet: "Portefeuille connecté",
    mypos_section_outcome: "Résultat de l'ajustement",

    // Labels
    mypos_label_amount: "Montant",
    mypos_label_expiration: "Expiration",
    mypos_label_balance_short: "Solde",
    mypos_label_min: "Min",
    mypos_label_max: "Max",

    // Wallet
    mypos_wallet_zchf: "Solde Frankencoin",
    mypos_wallet_coll: "Solde de garantie",

    // Outcome details
    mypos_outcome_current_amount: "Montant émis actuellement",
    mypos_outcome_future_amount: "Montant émis après",
    mypos_outcome_wallet_inc: "Envoyé à votre portefeuille",
    mypos_outcome_wallet_dec: "À ajouter depuis votre portefeuille",
    mypos_outcome_reserve_add: "Ajouté à la réserve",
    mypos_outcome_reserve_return: "Retourné de la réserve",

    // Links
    mypos_link_details: "Détails",
    mypos_link_contract: "Contrat",

    // Units
    mypos_unit_year: "a",
    mypos_unit_month: "mois",
    mypos_unit_day: "j",

    // Status
    mypos_expired: "expiré",

    mypos_section_details: "Détails de la position",
    mypos_label_reset: "Réinitialiser",
    mypos_note_coll_sent_back: "{amount} {symbol} renvoyé vers votre portefeuille",
    mypos_note_coll_taken: "{amount} {symbol} prélevé de votre portefeuille",

    // Roller (renouvellement) — refinancement par flash-mint vers une position plus longue
    mypos_roller_section: "Renouvellement",
    mypos_roller_intro: "Transférez cette position vers une autre plus longue avec le même collatéral. Le montant dû sera augmenté de l'intérêt initial de la nouvelle position. Le collatéral excédentaire est renvoyé vers votre portefeuille.",
    mypos_roller_none: "Aucune position ouverte disponible pour le transfert.",
    mypos_roller_loading: "Recherche de cibles de renouvellement…",
    mypos_roller_col_target: "Cible",
    mypos_roller_col_liq: "Prix de liquidation",
    mypos_roller_col_interest: "Intérêt annuel",
    mypos_roller_col_maturity: "Échéance",
    mypos_roller_col_missing: "Fonds supplémentaires",
    mypos_roller_roll: "Transférer",
    mypos_roller_merge: "Fusionner",
    mypos_roller_approve: "Approuver {symbol}",
    mypos_roller_approving: "Approbation…",
    mypos_roller_rolling: "Transfert…",
    mypos_roller_merging: "Fusion…",
    mypos_roller_cooldown: "Délai d'attente",
    mypos_roller_toast_rolled: "Position transférée",
    mypos_roller_toast_merged: "Position fusionnée",
    mypos_roller_err_balance: "ZCHF insuffisants pour couvrir les fonds supplémentaires",

    // Vue publique — mode lecture seule avec ?owner=… dans l'URL
    mypos_public_banner: "Affichage des positions de {owner}. Lecture seule.",
    mypos_public_close: "Fermer",
    mypos_public_empty: "Cette adresse n'a pas de positions ouvertes.",
    mypos_public_manage_notice: "Vue en lecture seule. Connectez-vous en tant que propriétaire pour gérer cette position.",
  },

  it: {
    // Page chrome
    mypos_page_title: "Le mie posizioni",
    mypos_subtitle: "Gestisci i tuoi prestiti garantiti",
    mypos_empty: "Non hai ancora nessuna posizione.",
    mypos_loading: "Caricamento delle tue posizioni…",

    // Card (list)
    mypos_card_minted: "Coniato",
    mypos_card_collateral: "Collaterale",
    mypos_card_liq_price: "Prezzo di liquidazione",
    mypos_card_expires: "Scade il",

    // Status badges
    mypos_status_closed: "Chiusa",
    mypos_status_challenged: "Contestata",
    mypos_status_cooldown_short: "Attesa",

    // Manage view
    mypos_manage_title: "Modifica posizione",
    mypos_back: "Torna alle posizioni",
    mypos_label_mint: "Importo coniato",
    mypos_label_collateral: "Collaterale",
    mypos_label_liq_price: "Prezzo di liquidazione",
    mypos_label_maturity: "Scadenza",
    mypos_label_interest: "Interesse annuo",

    // Actions
    mypos_action_adjust: "Modifica posizione",
    mypos_action_adjusting: "Modifica in corso…",

    // Outcome panel
    mypos_outcome_current: "Coniato attualmente",
    mypos_outcome_future: "Coniato dopo la modifica",
    mypos_outcome_wallet: "Da/al tuo wallet",
    mypos_outcome_reserve: "Variazione riserva",
    mypos_outcome_fee: "Interessi anticipati",

    // Errors
    mypos_err_cooldown: "La posizione è in attesa",
    mypos_err_closed: "La posizione è chiusa",
    mypos_err_challenged: "Impossibile ridurre il collaterale durante una contestazione",
    mypos_err_amount_limit: "Supera il limite della posizione",
    mypos_err_collateral_low: "Collaterale insufficiente per questo importo e prezzo",
    mypos_err_balance_low_zchf: "ZCHF insufficiente nel wallet per rimborsare",
    mypos_err_price_locked: "Impossibile aumentare la coniazione aumentando il prezzo (attesa richiesta)",

    // Toasts
    mypos_toast_approved: "{symbol} approvato",
    mypos_toast_adjusted: "Posizione modificata",

    // Badges
    mypos_badge_v2: "V2",

    // Manage subtitle & sections
    mypos_manage_subtitle: "Gestisci la tua posizione.",
    mypos_section_adjustment: "Modifica",
    mypos_section_wallet: "Wallet connesso",
    mypos_section_outcome: "Esito della modifica",

    // Labels
    mypos_label_amount: "Importo",
    mypos_label_expiration: "Scadenza",
    mypos_label_balance_short: "Saldo",
    mypos_label_min: "Min",
    mypos_label_max: "Max",

    // Wallet
    mypos_wallet_zchf: "Saldo Frankencoin",
    mypos_wallet_coll: "Saldo collaterale",

    // Outcome details
    mypos_outcome_current_amount: "Importo coniato attualmente",
    mypos_outcome_future_amount: "Importo coniato futuro",
    mypos_outcome_wallet_inc: "Inviato al tuo wallet",
    mypos_outcome_wallet_dec: "Da aggiungere dal tuo wallet",
    mypos_outcome_reserve_add: "Aggiunto alla riserva",
    mypos_outcome_reserve_return: "Restituito dalla riserva",

    // Links
    mypos_link_details: "Dettagli",
    mypos_link_contract: "Contratto",

    // Units
    mypos_unit_year: "a",
    mypos_unit_month: "m",
    mypos_unit_day: "g",

    // Status
    mypos_expired: "scaduto",

    mypos_section_details: "Dettagli posizione",
    mypos_label_reset: "Reimposta",
    mypos_note_coll_sent_back: "{amount} {symbol} restituito al tuo wallet",
    mypos_note_coll_taken: "{amount} {symbol} prelevato dal tuo wallet",

    // Roller (rinnovo) — rifinanziamento flash-mint in una posizione più lunga
    mypos_roller_section: "Rinnovo",
    mypos_roller_intro: "Trasferisci questa posizione in una più lunga con lo stesso collaterale. L'importo dovuto sarà aumentato dell'interesse iniziale della nuova posizione. Il collaterale in eccesso viene restituito al tuo wallet.",
    mypos_roller_none: "Nessuna posizione aperta disponibile per il trasferimento.",
    mypos_roller_loading: "Ricerca di destinazioni per il rinnovo…",
    mypos_roller_col_target: "Destinazione",
    mypos_roller_col_liq: "Prezzo di liquidazione",
    mypos_roller_col_interest: "Interesse annuo",
    mypos_roller_col_maturity: "Scadenza",
    mypos_roller_col_missing: "Fondi aggiuntivi",
    mypos_roller_roll: "Trasferisci",
    mypos_roller_merge: "Unisci",
    mypos_roller_approve: "Approva {symbol}",
    mypos_roller_approving: "Approvazione…",
    mypos_roller_rolling: "Trasferimento…",
    mypos_roller_merging: "Unione…",
    mypos_roller_cooldown: "Periodo di attesa",
    mypos_roller_toast_rolled: "Posizione trasferita",
    mypos_roller_toast_merged: "Posizione unita",
    mypos_roller_err_balance: "ZCHF insufficienti per coprire i fondi aggiuntivi",

    // Vista pubblica — modalità di sola lettura con ?owner=… nell'URL
    mypos_public_banner: "Visualizzazione delle posizioni di {owner}. Sola lettura.",
    mypos_public_close: "Chiudi",
    mypos_public_empty: "Questo indirizzo non ha posizioni aperte.",
    mypos_public_manage_notice: "Vista in sola lettura. Connettiti come proprietario per gestire questa posizione.",
  },

  es: {
    // Page chrome
    mypos_page_title: "Mis posiciones",
    mypos_subtitle: "Gestiona tus préstamos colateralizados",
    mypos_empty: "Aún no tienes ninguna posición.",
    mypos_loading: "Cargando tus posiciones…",

    // Card (list)
    mypos_card_minted: "Emitido",
    mypos_card_collateral: "Colateral",
    mypos_card_liq_price: "Precio de liquidación",
    mypos_card_expires: "Expira",

    // Status badges
    mypos_status_closed: "Cerrada",
    mypos_status_challenged: "Impugnada",
    mypos_status_cooldown_short: "Espera",

    // Manage view
    mypos_manage_title: "Ajustar posición",
    mypos_back: "Volver a posiciones",
    mypos_label_mint: "Importe emitido",
    mypos_label_collateral: "Colateral",
    mypos_label_liq_price: "Precio de liquidación",
    mypos_label_maturity: "Vencimiento",
    mypos_label_interest: "Interés anual",

    // Actions
    mypos_action_adjust: "Ajustar posición",
    mypos_action_adjusting: "Ajustando…",

    // Outcome panel
    mypos_outcome_current: "Emitido actualmente",
    mypos_outcome_future: "Emitido tras ajuste",
    mypos_outcome_wallet: "Hacia/desde tu wallet",
    mypos_outcome_reserve: "Cambio en reserva",
    mypos_outcome_fee: "Interés por adelantado",

    // Errors
    mypos_err_cooldown: "La posición está en espera",
    mypos_err_closed: "La posición está cerrada",
    mypos_err_challenged: "No puedes reducir colateral durante una impugnación",
    mypos_err_amount_limit: "Supera el límite de la posición",
    mypos_err_collateral_low: "Colateral insuficiente para este importe y precio",
    mypos_err_balance_low_zchf: "ZCHF insuficiente en tu wallet para devolver",
    mypos_err_price_locked: "No se puede aumentar la emisión al subir el precio (espera requerida)",

    // Toasts
    mypos_toast_approved: "{symbol} autorizado",
    mypos_toast_adjusted: "Posición ajustada",

    // Badges
    mypos_badge_v2: "V2",

    // Manage subtitle & sections
    mypos_manage_subtitle: "Gestiona tu posición.",
    mypos_section_adjustment: "Ajuste",
    mypos_section_wallet: "Wallet conectada",
    mypos_section_outcome: "Resultado del ajuste",

    // Labels
    mypos_label_amount: "Importe",
    mypos_label_expiration: "Vencimiento",
    mypos_label_balance_short: "Saldo",
    mypos_label_min: "Mín",
    mypos_label_max: "Máx",

    // Wallet
    mypos_wallet_zchf: "Saldo Frankencoin",
    mypos_wallet_coll: "Saldo del colateral",

    // Outcome details
    mypos_outcome_current_amount: "Importe emitido actual",
    mypos_outcome_future_amount: "Importe emitido futuro",
    mypos_outcome_wallet_inc: "Enviado a tu wallet",
    mypos_outcome_wallet_dec: "Añadir desde tu wallet",
    mypos_outcome_reserve_add: "Añadido a la reserva",
    mypos_outcome_reserve_return: "Devuelto de la reserva",

    // Links
    mypos_link_details: "Detalles",
    mypos_link_contract: "Contrato",

    // Units
    mypos_unit_year: "a",
    mypos_unit_month: "m",
    mypos_unit_day: "d",

    // Status
    mypos_expired: "expirado",

    mypos_section_details: "Detalles de la posición",
    mypos_label_reset: "Restablecer",
    mypos_note_coll_sent_back: "{amount} {symbol} devuelto a tu wallet",
    mypos_note_coll_taken: "{amount} {symbol} tomado de tu wallet",

    // Roller (renovación) — refinanciación por flash-mint en una posición más larga
    mypos_roller_section: "Renovación",
    mypos_roller_intro: "Transfiere esta posición a una más larga con el mismo colateral. El monto adeudado se incrementará con el interés inicial de la nueva posición. El colateral excedente se devuelve a tu wallet.",
    mypos_roller_none: "No hay posiciones abiertas disponibles para transferir.",
    mypos_roller_loading: "Buscando destinos de renovación…",
    mypos_roller_col_target: "Destino",
    mypos_roller_col_liq: "Precio de liquidación",
    mypos_roller_col_interest: "Interés anual",
    mypos_roller_col_maturity: "Vencimiento",
    mypos_roller_col_missing: "Fondos adicionales",
    mypos_roller_roll: "Transferir",
    mypos_roller_merge: "Fusionar",
    mypos_roller_approve: "Aprobar {symbol}",
    mypos_roller_approving: "Aprobando…",
    mypos_roller_rolling: "Transfiriendo…",
    mypos_roller_merging: "Fusionando…",
    mypos_roller_cooldown: "Período de espera",
    mypos_roller_toast_rolled: "Posición transferida",
    mypos_roller_toast_merged: "Posición fusionada",
    mypos_roller_err_balance: "ZCHF insuficientes para cubrir los fondos adicionales",

    // Vista pública — modo de solo lectura con ?owner=… en la URL
    mypos_public_banner: "Visualizando posiciones de {owner}. Solo lectura.",
    mypos_public_close: "Cerrar",
    mypos_public_empty: "Esta dirección no tiene posiciones abiertas.",
    mypos_public_manage_notice: "Vista de solo lectura. Conéctate como propietario para gestionar esta posición.",
  },
} as const;
window.TRATO_LOCALE = window.TRATO_LOCALE || {}
window.TRATO_LOCALE.fr = {
  trato: {
    wordmark: 'Trato',
    tagline: 'P2P fiat ↔ Bitcoin non custodial via Nostr et Lightning',
    badges: {
      browse: 'PARCOURIR',
      demo: 'DÉMO',
      live: 'EN DIRECT',
    },
    tooltips: {
      refresh_book: 'Actualiser le carnet d\'ordres',
      share_public: 'Partager le carnet public (sans connexion)',
      refresh_rate: 'Actualiser le taux (flux marché LNbits)',
      toggle_trato_only:
        'Masque Peach, HodlHodl et autres annonces en consultation seule. Affiche uniquement les offres que Trato peut prendre (Mostro et RoboSats).',
      toggle_match_payments:
        'Afficher uniquement les offres dont les tags de paiement correspondent à une méthode enregistrée (ex. SEPA Instant vs SEPA standard). Le pays vient de votre IBAN, pas de l\'ordre — EUR seul ne signifie pas Allemagne.',
      take_bond_robosats:
        'Trato réclame cette offre et paie la caution preneur. L\'escrow et le fiat se poursuivent sur RoboSats.',
    },
    share: {
      header: 'Lien de consultation public',
      caption:
        'Prix du réseau public — sans connexion. Partagez sur tout hôte LNbits exécutant Trato.',
      copy: 'Copier le lien',
      preview: 'Ouvrir l\'aperçu',
    },
    tabs: {
      book: 'Carnet d\'ordres',
      trades: 'Mes échanges',
      identity: 'Identité',
      settings: 'Paramètres',
    },
    public_banner: {
      title: 'Consultation seule.',
      body:
        'Trato est un client pour le réseau Nostr ouvert — pas un marché curaté ni un service KYC. Pas de compte sur cette page ; partagez librement (clearnet ou Tor). Pour prendre une offre, ouvrez',
      login_link: 'Trato dans LNbits',
      body_after: 'sur ce serveur ou toute autre instance LNbits exécutant Trato.',
    },
    public_book: {
      open_in_trato: 'Ouvrir dans Trato',
      best_deals: {
        title: 'Meilleures offres',
        subtitle_buy:
          'Estimation tout compris pour acheter BTC : prime + moitié des frais d\'entiercement · {fiat}',
        subtitle_sell:
          'Estimation tout compris pour vendre BTC : prime − moitié des frais d\'entiercement · {fiat}',
        pick_filters:
          'Choisissez une devise et Acheter ou Vendre ci-dessus pour comparer les meilleures offres.',
        fee_est: '~{pct}% frais',
        fees_unknown: 'frais n/d',
        premium_only: 'prime seule',
        note:
          'Les offres Mostro incluent les frais d\'entiercement estimés ; les autres plateformes n\'affichent que la prime.',
        effective: '{score} tout compris',
        vs_market: '{premium} vs marché',
      },
      filter_take_in_trato: 'Prendre dans Trato',
      uncheck_takeable:
        ' Désactivez « Prendre dans Trato » pour voir Peach, HodlHodl et d\'autres plateformes en consultation seule sur les relais.',
    },
    filters: {
      i_want_to: 'Je veux',
      currency: 'Devise',
      settlement: 'Règlement',
      buy_btc: 'Acheter BTC',
      sell_btc: 'Vendre BTC',
      any_settlement: 'Tout règlement',
      lightning: 'Lightning',
      onchain: 'On-chain',
      payment_method: 'Méthode de paiement',
      payment_method_empty: 'Aucune méthode correspondante sur ce carnet',
      trato_only: 'Prendre dans Trato',
      match_payments: 'Correspondre à mes méthodes de paiement',
      sort_by: 'Trier par',
    },
    sort: {
      newest: 'Plus récentes d\'abord',
      newest_hint: 'Offres publiées le plus récemment en premier',
      oldest: 'Plus anciennes d\'abord',
      oldest_hint: 'Offres listées le plus longtemps en premier',
      amount_desc: 'Montant (BTC) — du plus élevé au plus bas',
      amount_desc_hint:
        'Plus grands montants fixes en sats d\'abord ; offres au prix du marché en dernier',
      amount_asc: 'Montant (BTC) — du plus bas au plus élevé',
      amount_asc_hint:
        'Plus petits montants fixes en sats d\'abord ; offres au prix du marché en dernier',
      fiat_desc: 'Plage fiat — du plus élevé au plus bas',
      fiat_desc_hint: 'Plus grandes cotations fiat ou borne supérieure en premier',
      fiat_asc: 'Plage fiat — du plus bas au plus élevé',
      fiat_asc_hint: 'Plus petites cotations fiat ou borne inférieure en premier',
      market_asc: 'Marché (devise) A–Z',
      market_asc_hint: 'Regrouper par code de devise fiat',
      premium_asc: 'Prime — la plus basse d\'abord',
      premium_asc_hint: 'Plus proche du prix spot (idéal pour acheter du BTC)',
      premium_desc: 'Prime — la plus élevée d\'abord',
      premium_desc_hint: 'Le plus au-dessus du spot (souvent mieux pour vendre du BTC)',
      platform_asc: 'Plateforme A–Z',
      platform_asc_hint: 'Mostro, Peach, RoboSats, … par ordre alphabétique',
      takeable_first: 'Prendre dans Trato d\'abord',
      takeable_first_hint: 'Offres que Trato peut prendre, puis les plus récentes dans chaque groupe',
    },
    market: {
      loading_price: 'Chargement du prix BTC…',
      price_unavailable: 'Prix BTC indisponible',
      btc_line: '1 BTC ≈ {price} {fiat}',
      fiat_line: '· 1 {fiat} ≈ {sats} sats',
      market_price: 'prix du marché',
      vs_market: '· {premium} vs marché',
    },
    orderbook: {
      loading: 'Chargement du carnet d\'ordres en direct…',
      no_matching:
        'Aucune offre correspondante — essayez de réinitialiser les filtres ou d\'actualiser.',
      relay_error: 'Erreur de relais : {error} — vérifiez Paramètres → Relais.',
      no_mostro_title: 'Aucune offre Mostro',
      no_mostro_body:
        'sur vos relais pour le moment — {summary}. Ouvrez RoboSats / Peach dans leurs propres applications pour échanger ces annonces.',
      no_mostro_trato_only_title: 'Aucune offre prenable sur le carnet',
      no_mostro_trato_only_body:
        'Vos relais ont {summary} mais rien que Trato peut prendre pour l\'instant. Désactivez « Prendre dans Trato » pour les parcourir, ou restez en mode Démo pour des exemples d\'offres Mostro.',
      offer: 'offre',
      offers: 'offres',
      mostro: 'Mostro',
      synced: 'synchronisé {ago}',
      relay_sync_failed: 'échec de synchronisation des relais',
      filtering: 'Filtrage…',
      connecting: 'connexion…',
      section_buy_title: 'Acheter BTC',
      section_buy_sub:
        'Vous payez en fiat et recevez des sats · offres les plus récentes d\'abord',
      section_sell_title: 'Vendre BTC',
      section_sell_sub:
        'Vous envoyez des sats et recevez du fiat · offres les plus récentes d\'abord',
      no_section: 'Aucune offre {title} ne correspond à vos filtres.',
      no_section_filtered: 'Aucune offre {title} avec vos filtres actuels.',
      no_section_other:
        'Aucune offre {title} ici — voir l\'autre section ci-dessous pour les offres correspondantes.',
      no_section_empty: 'Aucune offre {title} sur le carnet pour le moment.',
      opposite_side_hint_buy:
        'Aucune offre pour acheter du BTC avec ces filtres — mais {count} {offers} où vous vendez du BTC. Essayez « Vendre BTC » dans Je veux.',
      opposite_side_hint_sell:
        'Aucune offre pour vendre du BTC avec ces filtres — mais {count} {offers} où vous achetez du BTC. Essayez « Acheter BTC » dans Je veux.',
      intent_buy:
        'Affichage des offres où vous achetez du BTC (payez en fiat, recevez des sats)',
      intent_sell:
        'Affichage des offres où vous vendez du BTC (envoyez des sats, recevez du fiat)',
      fiat_empty:
        'Aucune offre en {code} sur les relais pour le moment — essayez de réinitialiser le filtre de devise.',
      fiat_filtered:
        'Aucune offre en {code} ne correspond à vos filtres. Prendre un échange dans Trato ne retire pas les annonces du carnet public.',
      fiat_filtered_trato_only:
        ' Désactivez « Prendre dans Trato » — beaucoup d\'annonces EUR sont RoboSats/Peach.',
      platform_take: 'Trato peut prendre les offres {platform}',
      platform_take_setup: ' une fois la configuration terminée',
      platform_take_live:
        'Trato peut prendre les offres {platforms} dans cette application (trading en direct activé).',
      platform_take_demo:
        'Trato peut prendre les offres {platforms} dans cette application (mode entraînement — désactivez Démo dans Paramètres pour le direct).',
      platform_take_pending:
        'Trato pourra prendre les offres {platforms} une fois la configuration terminée (voir Paramètres).',
      platform_not_takeable:
        'Les annonces {platform} servent uniquement à la découverte de prix — ouvrez {platform} pour les échanger.',
      platform_browse: 'Consultation seule — ouvrez {platform} pour échanger cette annonce.',
      verified_chip: 'Vérifiée',
      verified_tooltip:
        'L\'API du coordinateur a confirmé que cette annonce est toujours publique sur la plateforme source.',
      unverified_chip: 'Relais seulement',
      unverified_tooltip:
        'Vue sur les relais Nostr mais pas encore confirmée en direct sur la plateforme. Ouvrez l\'application source ou attendez la synchronisation.',
      payment_match_tooltip: 'Correspond à votre profil de paiement',
    },
    user_action: {
      buy: 'Acheter BTC',
      sell: 'Vendre BTC',
      buy_detail: 'Payer {fiat} · recevoir BTC',
      sell_detail: 'Recevoir {fiat} · envoyer BTC',
      money_sell: 'Vous envoyez les sats · recevez du fiat',
      money_buy: 'Vous recevez les sats · envoyez du fiat',
    },
    buttons: {
      take: 'Prendre',
      take_pending: 'Prise…',
      fix_amount: 'Corriger le montant',
      payment_sent: 'Paiement envoyé',
      open_platform: 'Ouvrir dans {platform}',
      cancel: 'Annuler',
      delete: 'Supprimer',
      open: 'Ouvrir',
      create_order: 'Créer un ordre',
      export_taxes: 'Exporter pour les impôts',
      clear_demo: 'Effacer tous les échanges démo ({count})',
      continue: 'Continuer',
      set_spot: 'Définir le spot',
      save: 'Enregistrer',
      done: 'Terminé',
      take_bond: 'Prendre (caution)',
      continue_robosats: 'Continuer sur RoboSats',
    },
    trades: {
      empty_title: 'Aucun échange pour l\'instant',
      empty_body:
        'Prenez une offre du carnet d\'ordres ou créez votre propre ordre pour commencer.',
      role_maker: 'Maker',
      role_taker: 'Taker',
      waiting_taker: 'En attente du taker',
    },
    settings: {
      trading_mostro_live: 'Mostro — prise en direct activée (mainnet + portefeuille hold-invoice).',
      trading_mostro_demo:
        'Mostro — échanges d\'entraînement tant que le mode Démo est activé dans Paramètres.',
      trading_mostro_practice:
        'Mostro — désactivez le mode Démo et activez mainnet + hold invoices LND pour un séquestre en direct.',
      trading_robosats_live: 'RoboSats — réclamer l\'offre + caution via NWC ; terminez sur RoboSats.',
      trading_robosats_demo:
        'RoboSats — parcours complet en Démo (simulé). Connectez NWC ci-dessus pour les cautions réelles.',
      trading_robosats_setup:
        'RoboSats — connectez NWC ci-dessus pour les cautions en direct, ou Démo pour s\'entraîner.',
      trading_browse_only:
        'Peach, lnp2pbot… — consultation seule ; ouvrez leur application pour échanger.',
      robosats_bonds_title: 'RoboSats (caution preneur uniquement)',
      robosats_bonds_body:
        'Connectez NWC pour réclamer une offre RoboSats en direct et payer la caution preneur. Escrow, chat et fiat se font sur le coordinateur RoboSats — pas dans Trato. Démo = entraînement local.',
    },
    identity: {
      subtitle: 'Identité de trading Nostr',
      edit_profile: 'Modifier le profil',
      edit_caption:
        'Le nom et l\'avatar sont publiés sur les relais Nostr — les autres traders les voient sur le carnet d\'ordres.',
      display_name: 'Nom affiché',
      username: 'Nom d\'utilisateur',
      username_hint: 'Identifiant court optionnel (champ name Nostr)',
      avatar_url: 'URL de l\'avatar',
      avatar_hint: 'Lien https:// vers une image carrée',
      bio: 'Bio',
      nip05: 'NIP-05',
      nip05_hint: 'Adresse vérifiée optionnelle, ex. vous@domaine.com',
      lud16: 'Adresse Lightning (Nostr)',
      lud16_hint:
        'lud16 optionnel sur votre profil Nostr — vous@domaine.com. Trato peut le proposer lorsque vous configurez la réception Bitcoin.',
      no_public_profile:
        'Pas encore de nom public sur les relais — définissez-en un pour que les autres vous reconnaissent.',
      loading_profile: 'Chargement du profil…',
      load_failed: 'Impossible de charger le profil depuis les relais.',
      save_failed: 'Impossible de publier le profil — vérifiez les relais dans Paramètres.',
      saved: 'Profil publié sur Nostr',
      name_required: 'Saisissez un nom affiché ou un nom d\'utilisateur.',
      bitcoin_receive_title: 'Réception Bitcoin',
      bitcoin_receive_sub:
        'Adresse Lightning, adresse on-chain ou NWC — partagée avec le vendeur lorsque vous achetez du Bitcoin',
      bitcoin_receive_add: 'Ajouter',
      bitcoin_receive_empty:
        'Pas encore d\'adresse de réception — ajoutez une adresse Lightning ou Bitcoin pour que les vendeurs sachent où envoyer les sats.',
      bitcoin_receive_lnurlp_install: 'Sur cette instance LNbits, vous pouvez en créer une avec',
      bitcoin_receive_pick_source:
        'Choisissez une adresse Lightning — depuis LNURLp sur cette instance et/ou votre profil Nostr :',
      bitcoin_receive_nostr_only_hint:
        'Ajoutez lud16 dans Modifier le profil, ou activez LNURLp sur ce portefeuille, puis actualisez.',
    },
    columns: {
      role: 'Rôle',
      side: 'Côté',
      fiat: 'Fiat',
      sats: 'Sats',
      status: 'Statut',
      created: 'Créé',
    },
    warnings: {
      relay_sync:
        'Problème de synchronisation des relais : {error}. Vérifiez les URL des relais dans Paramètres, puis actualisez le carnet.',
      health:
        'Impossible de charger l\'état de Trato — {detail}. Rechargez la page ou vérifiez LNbits.',
      identity:
        'Impossible de charger votre identité de trading — {detail}. Ouvrez l\'onglet Identité pour configurer.',
      session_expired: 'Session expirée — rechargez la page et reconnectez-vous à LNbits.',
      network:
        'Trato n\'a pas pu joindre le serveur — vérifiez que LNbits fonctionne et actualisez.',
    },
    events: {
      you: 'Vous',
      partner: 'Partenaire',
      mostro: 'Mostro',
      rated_you: 'Votre contrepartie vous a noté {stars}/5',
      rated_you_short: 'Votre contrepartie vous a noté',
      can_rate: 'Vous pouvez noter votre contrepartie',
    },
    actions: {
      take_buy: 'Vous avez pris l\'ordre d\'achat',
      take_sell: 'Vous avez pris l\'ordre de vente',
      pay_invoice: 'Payer la facture de séquestre',
      hold_accepted: 'Séquestre financé',
      add_invoice: 'Facture acheteur demandée',
      buyer_invoice_accepted: 'Facture acheteur acceptée',
      fiat_sent: 'Paiement envoyé',
      release: 'Bitcoin libéré',
      cancel: 'Échange annulé',
      dispute: 'Litige ouvert',
      take: 'Ordre pris',
      rate: 'Notation disponible',
      rate_received: 'Notation reçue',
    },
    trade: {
      dispute_banner_title: 'Litige ouvert — en attente d\'un arbitre',
      pay_seller: 'Payer le vendeur',
      pay_via: 'Payer via {method}',
      payment_sent_hint:
        'Utilisez la référence du chat si nécessaire. Puis appuyez sur « Paiement envoyé ».',
      waiting_release:
        'Vous avez indiqué le paiement comme envoyé. Le vendeur devrait libérer les sats vers votre adresse de réception — consultez le chat pour les mises à jour.',
      seller_release_title: 'L\'acheteur a indiqué le paiement comme envoyé — libérez le Bitcoin',
      waiting_seller_pay:
        'En attente que le vendeur indique comment payer. Consultez le chat ci-dessous.',
      completed_title: 'Échange terminé',
      completed_onchain_buy:
        'Le Bitcoin devrait arriver à l\'adresse de votre portefeuille. Prévoyez du temps pour les confirmations réseau.',
      completed_lightning_buy:
        'Les sats devraient apparaître dans votre portefeuille Lightning sous peu.',
      completed_sell: 'Vous avez libéré le Bitcoin. Cet échange est terminé.',
      privacy_tip_expand: 'Optionnel — améliorer la confidentialité',
      privacy_tip_expand_caption:
        'Mélangez vos coins pour qu\'ils soient plus difficiles à lier à cet échange',
      privacy_tip_intro:
        'Le Bitcoin on-chain est public. Vous pouvez optionnellement le mélanger avec les coins d\'autres personnes — un processus appelé coinjoin — pour qu\'il soit plus difficile de le retracer jusqu\'à cet échange.',
      privacy_tip_step1: 'Installez Wasabi Wallet sur votre ordinateur (gratuit, open source)',
      privacy_tip_step2: 'Lorsque votre Bitcoin arrive, envoyez-le vers votre portefeuille Wasabi',
      privacy_tip_step3:
        'Dans Wasabi, lancez un round de coinjoin — vos coins sont mélangés avec ceux d\'autres',
      privacy_tip_wasabi: 'Guide d\'installation Wasabi',
      privacy_tip_guide: 'Qu\'est-ce que le coinjoin ?',
      privacy_tip_dismiss: 'Ne plus afficher',
      robosats_continue_banner: 'Caution preneur payée. Poursuivez l\'escrow et le fiat sur RoboSats.',
      robosats_live_chip: 'Caution payée — terminez sur RoboSats',
      robosats_timeline_note:
        'Caution payée dans Trato. Escrow et fiat continuent sur RoboSats — utilisez le lien ci-dessus.',
    },
    notify: {
      copied: 'Copié',
      browse_copied: 'Lien de consultation copié',
      rating_sent: 'Notation envoyée',
      order_created: 'Ordre créé — continuez dans votre échange',
      order_canceled: 'Ordre annulé',
      trade_removed: 'Échange supprimé',
      tax_exported: 'Export fiscal téléchargé',
      login_first: 'Connectez-vous d\'abord à LNbits sur ce serveur.',
      enter_fiat: 'Saisissez un montant fiat',
      enter_sats: 'Saisissez un montant en sats ou utilisez le prix du marché',
      no_demo_trades: 'Aucun échange démo à effacer',
      profile_ready: 'Profil de trader prêt',
      clearing_demo: 'Effacement des échanges démo…',
      robosats_bond_paid: 'Caution preneur payée — continuez sur RoboSats',
    },
    confirm: {
      cancel_order_title: 'Annuler cet ordre ?',
      cancel_order_ok: 'Annuler l\'ordre',
      remove_history_title: 'Retirer de l\'historique ?',
      delete_demo_title: 'Supprimer les {count} échange(s) démo ?',
      delete_all: 'Tout supprimer',
    },
    detail: {
      pick_payment_method:
        'Les frais et l\'étape de paiement utilisent ce rail — choisissez avant de prendre.',
      robosats_live_banner:
        'Trato ne fait que réclamer cette offre et payer la caution preneur. Escrow et fiat se poursuivent sur le coordinateur RoboSats.',
      robosats_live_link: 'Ouvrir sur RoboSats',
    },
    market_hint: {
      default:
        'Prix BTC depuis les taux de change LNbits. Choisissez un filtre de devise pour le modifier.',
      wallet:
        'Prix BTC en {fiat} — depuis votre portefeuille LNbits / instance par défaut. Choisissez une devise dans le filtre pour remplacer.',
    }
  }
}

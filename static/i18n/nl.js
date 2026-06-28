window.TRATO_LOCALE = window.TRATO_LOCALE || {}
window.TRATO_LOCALE.nl = {
  trato: {
    wordmark: 'Trato',
    tagline: 'Non-custodial P2P fiat ↔ Bitcoin via Nostr & Lightning',
    badges: {
      browse: 'BEKIJKEN',
      demo: 'DEMO',
      live: 'LIVE',
    },
    tooltips: {
      refresh_book: 'Orderboek vernieuwen',
      share_public: 'Openbaar orderboek delen (geen login)',
      refresh_rate: 'Koers vernieuwen (LNbits-marktfeed)',
      toggle_trato_only:
        'Verbergt Peach-, HodlHodl- en andere alleen-bekijken-advertenties. Toont alleen aanbiedingen die Trato kan aannemen (Mostro en RoboSats).',
      toggle_match_payments:
        'Toon alleen aanbiedingen waarvan de betaaltags overeenkomen met een door jou opgeslagen methode (bijv. SEPA Instant vs standaard SEPA). Land komt uit je IBAN, niet uit de order — EUR alleen betekent niet Duitsland.',
      take_bond_robosats:
        'Trato claimt deze advertentie en betaalt de taker-borg. Escrow en fiat gaan verder op RoboSats.',
    },
    share: {
      header: 'Openbare bekijklink',
      caption:
        'Openbare netwerkprijzen — geen login. Deel op elke LNbits-host met Trato.',
      copy: 'Link kopiëren',
      preview: 'Voorbeeld openen',
    },
    tabs: {
      book: 'Orderboek',
      trades: 'Mijn trades',
      identity: 'Identiteit',
      settings: 'Instellingen',
    },
    public_banner: {
      title: 'Alleen bekijken.',
      body:
        'Trato is een client voor het open Nostr-netwerk — geen gecureerde markt of KYC-dienst. Geen account op deze pagina; deel vrij (clearnet of Tor). Om een aanbieding aan te nemen, open',
      login_link: 'Trato in LNbits',
      body_after: 'op deze server of een andere LNbits-instantie met Trato.',
    },
    public_book: {
      open_in_trato: 'Openen in Trato',
      best_deals: {
        title: 'Beste deals',
        subtitle_buy: 'All-in schatting voor BTC kopen: premie + helft escrowfee · {fiat}',
        subtitle_sell: 'All-in schatting voor BTC verkopen: premie − helft escrowfee · {fiat}',
        pick_filters:
          'Kies een valuta en Koop of Verkoop hierboven om de beste aanbiedingen te vergelijken.',
        fee_est: '~{pct}% fee',
        fees_unknown: 'fee n/b',
        premium_only: 'alleen premie',
        note:
          'Mostro-aanbiedingen bevatten geschatte escrowfee; andere platforms tonen alleen premie.',
        effective: '{score} all-in',
        vs_market: '{premium} vs markt',
        loading: 'Beste deals laden…',
        no_offers:
          'Nog geen gerangschikte aanbiedingen voor {fiat} — probeer een andere valuta of ververs.',
      },
      filter_take_in_trato: 'Aannemen in Trato',
      uncheck_takeable:
        ' Schakel “Aannemen in Trato” uit om Peach, HodlHodl en andere alleen-bekijken-platforms op de relays te zien.',
    },
    filters: {
      i_want_to: 'Ik wil',
      currency: 'Valuta',
      settlement: 'Afwikkeling',
      buy_btc: 'BTC kopen',
      sell_btc: 'BTC verkopen',
      any_settlement: 'Elke afwikkeling',
      lightning: 'Lightning',
      onchain: 'On-chain',
      payment_method: 'Betaalmethode',
      payment_method_empty: 'Geen passende methoden in dit boek',
      trato_only: 'Aannemen in Trato',
      match_payments: 'Match mijn betaalmethoden',
      sort_by: 'Sorteren op',
    },
    sort: {
      newest: 'Nieuwste eerst',
      newest_hint: 'Meest recent gepubliceerde aanbiedingen eerst',
      oldest: 'Oudste eerst',
      oldest_hint: 'Langst vermelde aanbiedingen eerst',
      amount_desc: 'Bedrag (BTC) — hoog naar laag',
      amount_desc_hint: 'Grootste vaste sat-bedragen eerst; marktprijs-aanbiedingen als laatste',
      amount_asc: 'Bedrag (BTC) — laag naar hoog',
      amount_asc_hint: 'Kleinste vaste sat-bedragen eerst; marktprijs-aanbiedingen als laatste',
      fiat_desc: 'Fiat-bereik — hoog naar laag',
      fiat_desc_hint: 'Grootste fiat-offerte of bovengrens van bereik eerst',
      fiat_asc: 'Fiat-bereik — laag naar hoog',
      fiat_asc_hint: 'Kleinste fiat-offerte of ondergrens van bereik eerst',
      market_asc: 'Markt (valuta) A–Z',
      market_asc_hint: 'Groepeer op fiat-valutacode',
      premium_asc: 'Premie — laagste eerst',
      premium_asc_hint: 'Dichtst bij spotprijs (beste voor BTC kopen)',
      premium_desc: 'Premie — hoogste eerst',
      premium_desc_hint: 'Verst boven spot (vaak beter voor BTC verkopen)',
      platform_asc: 'Platform A–Z',
      platform_asc_hint: 'Mostro, Peach, RoboSats, … alfabetisch',
      takeable_first: 'Eerst aannemen in Trato',
      takeable_first_hint: 'Aanbiedingen die Trato kan aannemen, daarna nieuwste per groep',
    },
    market: {
      loading_price: 'BTC-prijs laden…',
      price_unavailable: 'BTC-prijs niet beschikbaar',
      btc_line: '1 BTC ≈ {price} {fiat}',
      fiat_line: '· 1 {fiat} ≈ {sats} sats',
      market_price: 'marktprijs',
      vs_market: '· {premium} vs markt',
    },
    orderbook: {
      loading: 'Live orderboek laden…',
      no_matching: 'Geen passende aanbiedingen — wis filters of vernieuw.',
      relay_error: 'Relay-fout: {error} — controleer Instellingen → Relays.',
      no_mostro_title: 'Geen Mostro-aanbiedingen',
      no_mostro_body:
        'op je relays op dit moment — {summary}. Open RoboSats / Peach in hun eigen apps om die advertenties te verhandelen.',
      no_mostro_trato_only_title: 'Geen aanneembare aanbiedingen in het boek',
      no_mostro_trato_only_body:
        'Je relays hebben {summary} maar nog niets dat Trato kan aannemen. Schakel “Aannemen in Trato” uit om ze te bekijken, of blijf in Demomodus voor voorbeeld-Mostro-aanbiedingen.',
      offer: 'aanbieding',
      offers: 'aanbiedingen',
      mostro: 'Mostro',
      synced: 'gesynchroniseerd {ago}',
      relay_sync_failed: 'relay-synchronisatie mislukt',
      filtering: 'Filteren…',
      connecting: 'verbinden…',
      section_buy_title: 'BTC kopen',
      section_buy_sub: 'Je betaalt fiat en ontvangt sats · nieuwste aanbiedingen eerst',
      section_sell_title: 'BTC verkopen',
      section_sell_sub: 'Je stuurt sats en ontvangt fiat · nieuwste aanbiedingen eerst',
      no_section: 'Geen {title}-aanbiedingen passen bij je filters.',
      no_section_filtered: 'Geen {title}-aanbiedingen met je huidige filters.',
      no_section_other:
        'Geen {title}-aanbiedingen hier — zie het andere gedeelte hieronder voor passende aanbiedingen.',
      no_section_empty: 'Geen {title}-aanbiedingen in het boek op dit moment.',
      opposite_side_hint_buy:
        'Geen aanbiedingen om BTC te kopen met deze filters — maar {count} {offers} waar je BTC verkoopt. Probeer “BTC verkopen” bij Ik wil.',
      opposite_side_hint_sell:
        'Geen aanbiedingen om BTC te verkopen met deze filters — maar {count} {offers} waar je BTC koopt. Probeer “BTC kopen” bij Ik wil.',
      intent_buy: 'Aanbiedingen waar je BTC koopt (fiat betalen, sats ontvangen)',
      intent_sell: 'Aanbiedingen waar je BTC verkoopt (sats sturen, fiat ontvangen)',
      fiat_empty:
        'Geen {code}-aanbiedingen op de relays op dit moment — wis het valutafilter.',
      fiat_filtered:
        'Geen {code}-aanbiedingen passen bij je filters. Een trade aannemen in Trato verwijdert advertenties niet uit het openbare boek.',
      fiat_filtered_trato_only:
        ' Schakel “Aannemen in Trato” uit — veel EUR-advertenties zijn RoboSats/Peach.',
      platform_take: 'Trato kan {platform}-aanbiedingen aannemen',
      platform_take_setup: ' zodra de setup klaar is',
      platform_take_live:
        'Trato kan {platforms}-aanbiedingen aannemen in deze app (live handel ingeschakeld).',
      platform_take_demo:
        'Trato kan {platforms}-aanbiedingen aannemen in deze app (oefenmodus — schakel Demo uit in Instellingen voor live).',
      platform_take_pending:
        'Trato kan {platforms}-aanbiedingen aannemen zodra de setup klaar is (zie Instellingen).',
      platform_not_takeable:
        '{platform}-advertenties zijn alleen voor prijsontdekking — open {platform} om ze te verhandelen.',
      platform_browse: 'Alleen bekijken — open {platform} om deze advertentie te verhandelen.',
      verified_chip: 'Geverifieerd',
      verified_tooltip:
        'Coordinator-API bevestigde dat deze advertentie nog openbaar is op het bronplatform.',
      unverified_chip: 'Alleen relay',
      unverified_tooltip:
        'Gezien op Nostr-relays maar nog niet live bevestigd op het platform. Open de bron-app of wacht op synchronisatie.',
      payment_match_tooltip: 'Komt overeen met je betaalprofiel',
    },
    user_action: {
      buy: 'BTC kopen',
      sell: 'BTC verkopen',
      buy_detail: 'Betaal {fiat} · ontvang BTC',
      sell_detail: 'Ontvang {fiat} · stuur BTC',
      money_sell: 'Je stuurt de sats · ontvangt fiat',
      money_buy: 'Je ontvangt de sats · betaalt fiat',
    },
    buttons: {
      take: 'Aannemen',
      take_pending: 'Aannemen…',
      fix_amount: 'Bedrag vastleggen',
      payment_sent: 'Betaling verzonden',
      open_platform: 'Openen in {platform}',
      cancel: 'Annuleren',
      delete: 'Verwijderen',
      open: 'Openen',
      create_order: 'Order aanmaken',
      export_taxes: 'Exporteren voor belasting',
      clear_demo: 'Alle demo-trades wissen ({count})',
      continue: 'Doorgaan',
      set_spot: 'Spot instellen',
      save: 'Opslaan',
      done: 'Klaar',
      take_bond: 'Aannemen (borg)',
      continue_robosats: 'Verder op RoboSats',
    },
    trades: {
      empty_title: 'Nog geen trades',
      empty_body:
        'Neem een aanbieding uit het orderboek aan of maak je eigen order om te beginnen.',
      role_maker: 'Maker',
      role_taker: 'Taker',
      waiting_taker: 'Wachten op taker',
    },
    settings: {
      trading_mostro_live: 'Mostro — live aannemen ingeschakeld (mainnet + hold-invoice wallet).',
      trading_mostro_demo: 'Mostro — oefentrades terwijl Demomodus aan staat in Instellingen.',
      trading_mostro_practice:
        'Mostro — schakel Demomodus uit en schakel mainnet + LND hold invoices in voor live escrow.',
      trading_robosats_live:
        'RoboSats — claim advertentie + taker-borg via NWC; rond de trade af op RoboSats.',
      trading_robosats_demo:
        'RoboSats — volledige oefenflow in Demo (gesimuleerd). Verbind NWC hierboven voor live borg.',
      trading_robosats_setup:
        'RoboSats — verbind NWC hierboven voor live borg, of gebruik Demo om te oefenen.',
      trading_browse_only: 'Peach, lnp2pbot… — alleen bekijken; open hun app om te handelen.',
      robosats_bonds_title: 'RoboSats (alleen taker-borg)',
      robosats_bonds_body:
        'Verbind NWC om een live RoboSats-advertentie te claimen en de taker-borg te betalen. Escrow, chat en fiat gebeuren op de RoboSats-coördinator — niet in Trato. Demo is lokaal oefenen.',
      relay_added: 'Relay added — save settings to use it.',
      relay_already_listed: 'That relay is already in your list.',
    },
    identity: {
      subtitle: 'Nostr-handelsidentiteit',
      edit_profile: 'Profiel bewerken',
      edit_caption:
        'Naam en avatar worden gepubliceerd naar Nostr-relays — andere handelaren zien ze in het orderboek.',
      display_name: 'Weergavenaam',
      username: 'Gebruikersnaam',
      username_hint: 'Optionele korte handle (Nostr name-veld)',
      avatar_url: 'Avatar-URL',
      avatar_hint: 'https://-link naar een vierkante afbeelding',
      bio: 'Bio',
      nip05: 'NIP-05',
      nip05_hint: 'Optioneel geverifieerd adres, bijv. jij@domein.nl',
      lud16: 'Lightning-adres (Nostr)',
      lud16_hint:
        'Optionele lud16 op je Nostr-profiel — jij@domein.nl. Trato kan het aanbieden wanneer je Bitcoin-ontvangst instelt.',
      no_public_profile:
        'Nog geen openbare naam op relays — stel er een in zodat anderen je herkennen.',
      loading_profile: 'Profiel laden…',
      load_failed: 'Kon profiel niet laden van relays.',
      save_failed: 'Kon profiel niet publiceren — controleer relays in Instellingen.',
      saved: 'Profiel gepubliceerd naar Nostr',
      name_required: 'Voer een weergavenaam of gebruikersnaam in.',
      bitcoin_receive_title: 'Bitcoin-ontvangst',
      bitcoin_receive_sub:
        'Lightning-adres, on-chain adres of NWC — gedeeld met de verkoper wanneer je Bitcoin koopt',
      bitcoin_receive_add: 'Toevoegen',
      bitcoin_receive_empty:
        'Nog geen ontvangstadres — voeg een Lightning-adres of Bitcoin-adres toe zodat verkopers weten waar ze sats naartoe moeten sturen.',
      bitcoin_receive_lnurlp_install: 'Op deze LNbits-instantie kun je er een maken met de',
      bitcoin_receive_pick_source:
        'Kies een Lightning-adres — van LNURLp op deze instantie en/of je Nostr-profiel:',
      bitcoin_receive_nostr_only_hint:
        'Voeg lud16 toe in Profiel bewerken, of schakel LNURLp in op deze wallet, en vernieuw daarna.',
    },
    columns: {
      role: 'Rol',
      side: 'Kant',
      fiat: 'Fiat',
      sats: 'Sats',
      status: 'Status',
      created: 'Aangemaakt',
    },
    warnings: {
      relay_sync:
        'Relay-synchronisatieprobleem: {error}. Controleer relay-URL\'s in Instellingen en vernieuw daarna het boek.',
      health:
        'Kon Trato-status niet laden — {detail}. Herlaad de pagina of controleer LNbits.',
      identity:
        'Kon je handelsidentiteit niet laden — {detail}. Open het tabblad Identiteit om in te stellen.',
      session_expired: 'Sessie verlopen — herlaad de pagina en log opnieuw in bij LNbits.',
      network:
        'Trato kon de server niet bereiken — controleer of LNbits draait en vernieuw.',
    },
    events: {
      you: 'Jij',
      partner: 'Partner',
      mostro: 'Mostro',
      rated_you: 'Tegenpartij beoordeelde je {stars}/5',
      rated_you_short: 'Tegenpartij beoordeelde je',
      can_rate: 'Je kunt je tegenpartij beoordelen',
    },
    actions: {
      take_buy: 'Je hebt de kooporder aangenomen',
      take_sell: 'Je hebt de verkooporder aangenomen',
      pay_invoice: 'Escrow-factuur betalen',
      hold_accepted: 'Escrow gefinancierd',
      add_invoice: 'Koperfactuur aangevraagd',
      buyer_invoice_accepted: 'Koperfactuur geaccepteerd',
      fiat_sent: 'Betaling verzonden',
      release: 'Bitcoin vrijgegeven',
      cancel: 'Trade geannuleerd',
      dispute: 'Geschil geopend',
      take: 'Order aangenomen',
      rate: 'Beoordeling beschikbaar',
      rate_received: 'Beoordeling ontvangen',
    },
    trade: {
      dispute_banner_title: 'Geschil open — wachten op een solver',
      pay_seller: 'Betaal de verkoper',
      pay_via: 'Betalen via {method}',
      payment_sent_hint:
        'Gebruik indien nodig de referentie uit de chat. Tik daarna op “Betaling verzonden”.',
      waiting_release:
        'Je hebt de betaling als verzonden gemarkeerd. De verkoper zou sats moeten vrijgeven naar je ontvangstadres — controleer de chat voor updates.',
      seller_release_title: 'Koper markeerde betaling als verzonden — geef Bitcoin vrij',
      waiting_seller_pay:
        'Wachten tot de verkoper deelt hoe te betalen. Controleer de chat hieronder.',
      completed_title: 'Trade voltooid',
      completed_onchain_buy:
        'Bitcoin zou op je walletadres moeten aankomen. Geef tijd voor netwerkbevestigingen.',
      completed_lightning_buy: 'Sats zouden binnenkort in je Lightning-wallet moeten verschijnen.',
      completed_sell: 'Je hebt de Bitcoin vrijgegeven. Deze trade is klaar.',
      privacy_tip_expand: 'Optioneel — privacy verbeteren',
      privacy_tip_expand_caption: 'Mix je munten zodat ze moeilijker aan deze trade te koppelen zijn',
      privacy_tip_intro:
        'On-chain Bitcoin is openbaar. Je kunt ze optioneel mixen met munten van anderen — een proces genaamd coinjoin — zodat ze moeilijker terug te traceren zijn naar deze trade.',
      privacy_tip_step1: 'Installeer Wasabi Wallet op je computer (gratis, open source)',
      privacy_tip_step2: 'Wanneer je Bitcoin aankomt, stuur het naar je Wasabi-wallet',
      privacy_tip_step3:
        'Start in Wasabi een coinjoin-ronde — je munten worden gemixt met die van anderen',
      privacy_tip_wasabi: 'Wasabi-installatiegids',
      privacy_tip_guide: 'Wat is coinjoin?',
      privacy_tip_dismiss: 'Niet meer tonen',
      robosats_continue_banner: 'Taker-borg betaald. Ga verder met escrow en fiat op RoboSats.',
      robosats_live_chip: 'Borg betaald — afronden op RoboSats',
      robosats_timeline_note:
        'Borg betaald in Trato. Escrow en fiat gaan verder op RoboSats — gebruik de link hierboven.',
    },
    notify: {
      copied: 'Gekopieerd',
      browse_copied: 'Bekijklink gekopieerd',
      rating_sent: 'Beoordeling verzonden',
      order_created: 'Order aangemaakt — ga verder in je trade',
      order_canceled: 'Order geannuleerd',
      trade_removed: 'Trade verwijderd',
      tax_exported: 'Belastingexport gedownload',
      login_first: 'Log eerst in bij LNbits op deze server.',
      enter_fiat: 'Voer een fiat-bedrag in',
      enter_sats: 'Voer een sat-bedrag in of gebruik marktprijs',
      no_demo_trades: 'Geen demo-trades om te wissen',
      profile_ready: 'Handelaarsprofiel klaar',
      clearing_demo: 'Demo-trades wissen…',
      robosats_bond_paid: 'Taker-borg betaald — verder op RoboSats',
    },
    confirm: {
      cancel_order_title: 'Deze order annuleren?',
      cancel_order_ok: 'Order annuleren',
      remove_history_title: 'Uit geschiedenis verwijderen?',
      delete_demo_title: 'Alle {count} demo-trade(s) verwijderen?',
      delete_all: 'Alles verwijderen',
    },
    detail: {
      pick_payment_method: 'Kosten en de betaalstap gebruiken dit kanaal — kies voordat je aanneemt.',
      robosats_live_banner:
        'Trato claimt alleen deze advertentie en betaalt de taker-borg. Escrow en fiat gaan verder op de RoboSats-coördinator.',
      robosats_live_link: 'Openen op RoboSats',
    },
    market_hint: {
      default:
        'BTC-prijs van LNbits-wisselkoersen. Kies een valutafilter om te wijzigen.',
      wallet:
        'BTC-prijs in {fiat} — van je LNbits-wallet / instantie-standaard. Kies een valuta in het filter om te overschrijven.',
    }
  }
}

window.TRATO_LOCALE = window.TRATO_LOCALE || {}
window.TRATO_LOCALE.pi = {
  trato: {
    wordmark: 'Trato',
    tagline: 'P2P doubloons ↔ Bitcoin over Nostr & Lightning — no Cap`n holds yer keys',
    badges: {
      browse: 'SPYGLASS',
      demo: 'PRACTICE',
      live: 'LIVE AT SEA'
    },
    tooltips: {
      refresh_book: 'Hoist the order book again',
      share_public: 'Share the public treasure map (no login)',
      refresh_rate: 'Refresh the doubloon rate (LNbits market feed)',
      toggle_trato_only:
        'Hides Peach, HodlHodl, and other browse-only charts. Trato boards Mostro and RoboSats offers (practice mode; live RoboSats needs NWC in Ship settings).',
      toggle_match_payments:
        'Show only offers matchin’ payment methods ye saved (e.g. SEPA Instant vs standard SEPA). Country comes from yer IBAN, not the order — EUR alone don’t mean Germany.'
    },
    share: {
      header: 'Public treasure map',
      caption:
        'Public network prices — no login. Share on any LNbits port runnin’ Trato.',
      copy: 'Copy the chart',
      preview: 'Open spyglass preview'
    },
    tabs: {
      book: 'Order book',
      trades: 'Me trades',
      identity: 'Pirate papers',
      settings: 'Ship settings'
    },
    public_banner: {
      title: 'Spyglass only.',
      body:
        'Trato be a client fer the open Nostr seas — not a curated market nor KYC shackles. No account on this deck; share freely (clearnet or Tor). To board an offer, open',
      login_link: 'Trato in LNbits',
      body_after: 'on this port or any other LNbits instance sailin’ Trato.'
    },
    filters: {
      i_want_to: 'Want to',
      currency: 'Currency',
      settlement: 'Settlement',
      buy_btc: 'Buy BTC',
      sell_btc: 'Sell BTC',
      any_settlement: 'Any settlement',
      lightning: 'Lightning',
      onchain: 'On-chain',
      payment_method: 'Payment method',
      payment_method_empty: 'No matchin’ methods on this book',
      trato_only: 'Trato can board (Mostro & RoboSats)',
      match_payments: 'Match my payments',
      sort_by: 'Sort by'
    },
    sort: {
      newest: 'Newest first',
      newest_hint: 'Most recent offers on deck',
      oldest: 'Oldest first',
      oldest_hint: 'Longest-listed offers first',
      amount_desc: 'Amount (BTC) — high to low',
      amount_desc_hint: 'Biggest fixed sat piles first; market-price offers astern',
      amount_asc: 'Amount (BTC) — low to high',
      amount_asc_hint: 'Smallest fixed sat piles first; market-price offers astern',
      fiat_desc: 'Fiat range — high to low',
      fiat_desc_hint: 'Largest fiat quote or range upper bound first',
      fiat_asc: 'Fiat range — low to high',
      fiat_asc_hint: 'Smallest fiat quote or range lower bound first',
      market_asc: 'Market (currency) A–Z',
      market_asc_hint: 'Group by fiat currency code',
      premium_asc: 'Premium — lowest first',
      premium_asc_hint: 'Closest to spot (best fer buyin’ BTC)',
      premium_desc: 'Premium — highest first',
      premium_desc_hint: 'Farthest above spot (often better fer sellin’ BTC)',
      platform_asc: 'Platform A–Z',
      platform_asc_hint: 'Mostro, Peach, RoboSats, … alphabetically',
      takeable_first: 'Board in Trato first',
      takeable_first_hint: 'Offers Trato can board, then newest in each group'
    },
    market: {
      loading_price: 'Loadin’ BTC price…',
      price_unavailable: 'BTC price lost at sea',
      btc_line: '1 BTC ≈ {price} {fiat}',
      fiat_line: '· 1 {fiat} ≈ {sats} sats',
      market_price: 'market price',
      vs_market: '· {premium} vs market'
    },
    orderbook: {
      loading: 'Loadin’ live order book…',
      no_matching: 'No matchin’ offers — clear filters or hoist again.',
      relay_error: 'Relay trouble: {error} — check Settings → Relays.',
      no_mostro_title: 'No Mostro offers',
      no_mostro_body:
        'on yer relays right now — {summary}. Open RoboSats / Peach in their own apps to trade those ads.',
      no_mostro_trato_only_title: 'No takeable offers on the book',
      no_mostro_trato_only_body:
        'Yer relays have {summary} but naught Trato can board yet. Turn off “Only offers Trato can board” to browse, or stay in practice mode for sample Mostro offers.',
      offer: 'offer',
      offers: 'offers',
      mostro: 'Mostro',
      synced: 'synced {ago}',
      relay_sync_failed: 'relay sync failed',
      filtering: 'Filtering…',
      connecting: 'connectin’…',
      section_buy_title: 'Buy BTC',
      section_buy_sub: 'Ye pay fiat and receive sats · newest offers first',
      section_sell_title: 'Sell BTC',
      section_sell_sub: 'Ye send sats and receive fiat · newest offers first',
      no_section: 'No {title} offers match yer filters.',
      no_section_filtered: 'No {title} offers with yer current filters.',
      no_section_other:
        'No {title} offers here — spy the other section below fer matches.',
      no_section_empty: 'No {title} offers on the book right now.',
      opposite_side_hint_buy:
        'Nothin’ to buy BTC with these filters — but {count} {offers} where ye sell BTC. Try “Sell BTC” in I be wantin’ to.',
      opposite_side_hint_sell:
        'Nothin’ to sell BTC with these filters — but {count} {offers} where ye buy BTC. Try “Buy BTC” in I be wantin’ to.',
      intent_buy: 'Showin’ offers where ye buy BTC (pay fiat, receive sats)',
      intent_sell: 'Showin’ offers where ye sell BTC (send sats, receive fiat)',
      fiat_empty:
        'No {code} offers on the relays right now — try clearin’ the currency filter.',
      fiat_filtered:
        'No {code} offers match yer filters. Boardin’ a trade in Trato don’t remove ads from the public book.',
      fiat_filtered_trato_only:
        ' Turn off “Only offers Trato can board” — many EUR ads be RoboSats/Peach.',
      platform_take: 'Trato can board {platform} offers',
      platform_take_setup: ' once setup be complete',
      platform_take_live:
        'Trato can board {platforms} offers in this app (live tradin’ enabled).',
      platform_take_demo:
        'Trato can board {platforms} offers in practice mode — turn off Demo in Settings fer live.',
      platform_take_pending:
        'Trato can board {platforms} offers once setup be complete (see Settings).',
      platform_not_takeable:
        '{platform} ads be fer price discovery only — open {platform} to trade ’em.',
      platform_browse: 'Browse only — open {platform} to trade this ad.',
      verified_chip: 'Chart checked',
      verified_tooltip:
        'Coordinator API confirmed this ad still be public on the source platform.',
      unverified_chip: 'Relay sighting',
      unverified_tooltip:
        'Spotted on Nostr relays but not confirmed live on the platform yet.'
    },
    user_action: {
      buy: 'Buy BTC',
      sell: 'Sell BTC',
      buy_detail: 'Pay {fiat} · receive BTC',
      sell_detail: 'Receive {fiat} · send BTC',
      money_sell: 'Ye send the sats · receive fiat',
      money_buy: 'Ye receive the sats · send fiat'
    },
    buttons: {
      take: 'Board',
      take_pending: 'Board…',
      fix_amount: 'Fix amount',
      payment_sent: 'Payment sent',
      open_platform: 'Open {platform}',
      cancel: 'Abandon',
      delete: 'Scuttle',
      open: 'Open',
      create_order: 'Post order',
      export_taxes: 'Export fer the tax man',
      clear_demo: 'Clear all practice trades ({count})',
      continue: 'Sail on',
      set_spot: 'Mark the spot',
      save: 'Bury treasure',
      done: 'Aye'
    },
    trades: {
      empty_title: 'No trades yet',
      empty_body:
        'Board an offer from the order book or post yer own order to get started.',
      role_maker: 'Maker',
      role_taker: 'Taker',
      waiting_taker: 'Waitin’ fer a taker'
    },
    settings: {
      trading_mostro_live: 'Mostro — live boardin’ enabled (mainnet + hold-invoice wallet).',
      trading_mostro_demo:
        'Mostro — practice trades while Demo mode be on in Settings.',
      trading_mostro_practice:
        'Mostro — turn off Demo mode and enable mainnet + LND hold invoices fer live escrow.',
      trading_robosats_live: 'RoboSats — live boardin’ with yer NWC wallet connected.',
      trading_robosats_demo:
        'RoboSats — practice walk-through in Demo; connect NWC above fer live boardin’.',
      trading_robosats_setup:
        'RoboSats — connect NWC above fer live boardin’, or enable Demo mode to practise.',
      trading_browse_only:
        'Peach, lnp2pbot… — browse-only; open their app to trade.'
    },
    identity: {
      subtitle: 'Nostr tradin’ papers',
      edit_profile: 'Edit yer face',
      edit_caption:
        'Name an’ avatar go out on Nostr relays — other swabs see ’em on the book.',
      display_name: 'Display name',
      username: 'Handle',
      username_hint: 'Optional short handle (Nostr name field)',
      avatar_url: 'Avatar URL',
      avatar_hint: 'https:// link to a square image',
      bio: 'Bio',
      nip05: 'NIP-05',
      nip05_hint: 'Optional verified address, e.g. you@domain.com',
      lud16: 'Lightning address (Nostr)',
      lud16_hint:
        'Optional lud16 on yer Nostr profile — you@domain.com. Trato can offer it fer Bitcoin receive.',
      no_public_profile:
        'No public name on relays yet — set one so others know ye.',
      loading_profile: 'Loadin’ profile…',
      load_failed: 'Could not load profile from relays.',
      save_failed: 'Could not publish profile — check relays in Ship settings.',
      saved: 'Profile published to Nostr',
      name_required: 'Enter a display name or handle.',
      bitcoin_receive_title: 'Bitcoin receive',
      bitcoin_receive_sub:
        'Lightning address, on-chain address, or NWC — shared with the seller when you buy Bitcoin',
      bitcoin_receive_add: 'Add',
      bitcoin_receive_empty:
        'No receive address yet — add a Lightning address or Bitcoin address so sellers know where to send sats.',
      bitcoin_receive_lnurlp_install:
        'On this LNbits box ye can make one with the',
      bitcoin_receive_pick_source:
        'Pick a Lightning address — LNURLp on this box and/or yer Nostr profile:',
      bitcoin_receive_nostr_only_hint:
        'Add lud16 in Edit profile, or enable LNURLp on this wallet, then refresh.'
    },
    columns: {
      role: 'Role',
      side: 'Side',
      fiat: 'Fiat',
      sats: 'Sats',
      status: 'Status',
      created: 'Created'
    },
    warnings: {
      relay_sync:
        'Relay sync trouble: {error}. Check relay URLs in Settings, then hoist the book.',
      health:
        'Could not load Trato status — {detail}. Reload the page or check LNbits.',
      identity:
        'Could not load yer tradin’ identity — {detail}. Open the Pirate papers tab to set up.',
      session_expired: 'Session expired — reload and log in to LNbits again, matey.',
      network: 'Trato could not reach the ship — check LNbits be runnin’ and refresh.'
    },
    events: {
      you: 'Ye',
      partner: 'Matey',
      mostro: 'Mostro',
      rated_you: 'Counterpart rated ye {stars}/5',
      rated_you_short: 'Counterpart rated ye',
      can_rate: 'Ye can rate yer counterpart'
    },
    actions: {
      take_buy: 'Ye took the buy order',
      take_sell: 'Ye took the sell order',
      pay_invoice: 'Pay escrow invoice',
      hold_accepted: 'Escrow funded',
      add_invoice: 'Buyer invoice requested',
      buyer_invoice_accepted: 'Buyer invoice accepted',
      fiat_sent: 'Payment sent',
      release: 'Released Bitcoin',
      cancel: 'Canceled trade',
      dispute: 'Opened dispute',
      take: 'Took order',
      rate: 'Rating available',
      rate_received: 'Rating received'
    },
    trade: {
      dispute_banner_title: 'Dispute open — solver on the way, matey'
    },
    notify: {
      copied: 'Copied',
      browse_copied: 'Treasure map link copied',
      rating_sent: 'Rating sent',
      order_created: 'Order posted — continue in yer trade',
      order_canceled: 'Order abandoned',
      trade_removed: 'Trade scuttled',
      tax_exported: 'Tax export downloaded',
      login_first: 'Log in to LNbits on this port first.',
      enter_fiat: 'Enter a fiat amount',
      enter_sats: 'Enter a sats amount or use market price',
      no_demo_trades: 'No practice trades to clear',
      profile_ready: 'Trader profile ready',
      clearing_demo: 'Clearin’ practice trades…'
    },
    confirm: {
      cancel_order_title: 'Abandon this order?',
      cancel_order_ok: 'Abandon order',
      remove_history_title: 'Remove from the log?',
      delete_demo_title: 'Scuttle all {count} practice trade(s)?',
      delete_all: 'Scuttle all'
    },
    detail: {
      pick_payment_method:
        'Fees and the payment step use this rail — pick before ye board.'
    },
    trade: {
      pay_seller: 'Pay the seller',
      pay_via: 'Pay via {method}',
      payment_sent_hint:
        'Use the reference from chat if needed. Then tap “Payment sent”.',
      waiting_release:
        'Ye marked payment sent. The seller should release sats to yer receive address — check the chat.',
      seller_release_title: 'Buyer marked payment sent — release Bitcoin',
      waiting_seller_pay: 'Waitin’ fer the seller to share how to pay. Check the chat below.'
    },
    market_hint: {
      default:
        'BTC price from LNbits exchange rates. Pick a currency filter to change it.',
      wallet:
        'BTC price in {fiat} — from yer LNbits wallet / instance default. Pick a currency in the filter to override.'
    }
  }
}

window.TRATO_LOCALE = window.TRATO_LOCALE || {}
window.TRATO_LOCALE.en = {
  trato: {
    wordmark: 'Trato',
    tagline: 'Non-custodial P2P fiat ↔ Bitcoin over Nostr & Lightning',
    badges: {
      browse: 'BROWSE',
      demo: 'DEMO',
      live: 'LIVE'
    },
    tooltips: {
      refresh_book: 'Refresh order book',
      share_public: 'Share public order book (no login)',
      refresh_rate: 'Refresh rate (LNbits market feed)',
      toggle_trato_only:
        'Hides Peach, HodlHodl, and other browse-only ads. Shows only offers you can take in Trato (Mostro and RoboSats).',
      toggle_match_payments:
        'Show only offers whose payment tags match a method you saved (e.g. SEPA Instant vs standard SEPA). Country comes from your IBAN, not from the order — EUR alone does not mean Germany.',
      take_bond_robosats:
        'Trato claims this offer and pays the taker bond. Finish escrow and fiat on RoboSats.'
    },
    share: {
      header: 'Public browse link',
      caption:
        'Public network prices — no login. Share on any LNbits host running Trato.',
      copy: 'Copy link',
      preview: 'Open preview'
    },
    tabs: {
      book: 'Order book',
      trades: 'My trades',
      identity: 'Identity',
      settings: 'Settings'
    },
    public_banner: {
      title: 'Browse only.',
      body:
        'Trato is a client for the open Nostr network — not a curated market or KYC service. No account on this page; share freely (clearnet or Tor). To take an offer, open',
      login_link: 'Trato in LNbits',
      body_after:
        'on this server or any other LNbits instance that runs Trato.'
    },
    public_book: {
      open_in_trato: 'Open in Trato',
      best_deals: {
        title: 'Best deals',
        subtitle_buy:
          'All-in estimate for buying BTC: premium + half escrow fee · {fiat}',
        subtitle_sell:
          'All-in estimate for selling BTC: premium − half escrow fee · {fiat}',
        pick_filters:
          'Pick a currency and Buy or Sell above to compare the best offers.',
        loading: 'Loading best deals…',
        no_offers: 'No ranked offers for {fiat} yet — try another currency or refresh.',
        fee_est: '~{pct}% fee',
        fees_unknown: 'fees n/a',
        premium_only: 'premium only',
        note:
          'Mostro offers include estimated escrow fee; other platforms show premium only.',
        effective: '{score} all-in',
        vs_market: '{premium} vs market'
      },
      filter_take_in_trato: 'Take in Trato',
      uncheck_takeable:
        ' Uncheck “Take in Trato” to see Peach, HodlHodl, and other browse-only platforms on the relays.'
    },
    filters: {
      i_want_to: 'I want to',
      currency: 'Currency',
      settlement: 'Settlement',
      buy_btc: 'Buy BTC',
      sell_btc: 'Sell BTC',
      any_settlement: 'Any settlement',
      lightning: 'Lightning',
      onchain: 'On-chain',
      payment_method: 'Payment method',
      payment_method_empty: 'No matching methods on this book',
      trato_only: 'Take in Trato',
      match_payments: 'Match my payment methods',
      sort_by: 'Sort by'
    },
    sort: {
      newest: 'Newest first',
      newest_hint: 'Most recently published offers first',
      oldest: 'Oldest first',
      oldest_hint: 'Longest-listed offers first',
      amount_desc: 'Amount (BTC) — high to low',
      amount_desc_hint: 'Largest fixed sat amounts first; market-price offers last',
      amount_asc: 'Amount (BTC) — low to high',
      amount_asc_hint: 'Smallest fixed sat amounts first; market-price offers last',
      fiat_desc: 'Fiat range — high to low',
      fiat_desc_hint: 'Largest fiat quote or range upper bound first',
      fiat_asc: 'Fiat range — low to high',
      fiat_asc_hint: 'Smallest fiat quote or range lower bound first',
      market_asc: 'Market (currency) A–Z',
      market_asc_hint: 'Group by fiat currency code',
      premium_asc: 'Premium — lowest first',
      premium_asc_hint: 'Closest to spot price (best for buying BTC)',
      premium_desc: 'Premium — highest first',
      premium_desc_hint: 'Farthest above spot (often better for selling BTC)',
      platform_asc: 'Platform A–Z',
      platform_asc_hint: 'Mostro, Peach, RoboSats, … alphabetically',
      takeable_first: 'Take in Trato first',
      takeable_first_hint: 'Offers Trato can take, then newest within each group'
    },
    market: {
      loading_price: 'Loading BTC price…',
      price_unavailable: 'BTC price unavailable',
      btc_line: '1 BTC ≈ {price} {fiat}',
      fiat_line: '· 1 {fiat} ≈ {sats} sats',
      market_price: 'market price',
      vs_market: '· {premium} vs market'
    },
    orderbook: {
      loading: 'Loading live order book…',
      no_matching:
        'No matching offers — try clearing filters or refresh.',
      relay_error: 'Relay error: {error} — check Settings → Relays.',
      no_mostro_title: 'No Mostro offers',
      no_mostro_body:
        'on your relays right now — {summary}. Open RoboSats / Peach in their own apps to trade those ads.',
      no_mostro_trato_only_title: 'No takeable offers on the book',
      no_mostro_trato_only_body:
        'Your relays have {summary} but nothing Trato can take yet. Turn off “Take in Trato” to browse them, or stay in Demo mode for sample Mostro offers.',
      offer: 'offer',
      offers: 'offers',
      mostro: 'Mostro',
      synced: 'synced {ago}',
      relay_sync_failed: 'relay sync failed',
      filtering: 'Filtering…',
      connecting: 'connecting…',
      section_buy_title: 'Buy BTC',
      section_buy_sub: 'You pay fiat and receive sats · newest offers first',
      section_sell_title: 'Sell BTC',
      section_sell_sub: 'You send sats and receive fiat · newest offers first',
      no_section: 'No {title} offers match your filters.',
      no_section_filtered: 'No {title} offers with your current filters.',
      no_section_other:
        'No {title} offers here — see the other section below for matching offers.',
      no_section_empty: 'No {title} offers on the book right now.',
      opposite_side_hint_buy:
        'No offers to buy BTC with these filters — but {count} {offers} where you sell BTC. Try “Sell BTC” in I want to.',
      opposite_side_hint_sell:
        'No offers to sell BTC with these filters — but {count} {offers} where you buy BTC. Try “Buy BTC” in I want to.',
      intent_buy: 'Showing offers where you buy BTC (pay fiat, receive sats)',
      intent_sell: 'Showing offers where you sell BTC (send sats, receive fiat)',
      fiat_empty:
        'No {code} offers on the relays right now — try clearing the currency filter.',
      fiat_filtered:
        'No {code} offers match your filters. Taking a trade in Trato does not remove ads from the public book.',
      fiat_filtered_trato_only:
        ' Turn off “Take in Trato” — many EUR ads are RoboSats/Peach.',
      platform_take: 'Trato can take {platform} offers',
      platform_take_setup: ' once setup is complete',
      platform_take_live:
        'Trato can take {platforms} offers in this app (live trading enabled).',
      platform_take_demo:
        'Trato can take {platforms} offers in this app (practice mode — turn off Demo in Settings for live).',
      platform_take_pending:
        'Trato can take {platforms} offers once setup is complete (see Settings).',
      platform_not_takeable:
        '{platform} ads are for price discovery only — open {platform} to trade them.',
      platform_browse: 'Browse only — open {platform} to trade this ad.',
      verified_chip: 'Verified',
      verified_tooltip:
        'Coordinator API confirmed this ad is still public on the source platform.',
      unverified_chip: 'Relay only',
      unverified_tooltip:
        'Seen on Nostr relays but not confirmed live on the platform yet. Open the source app or wait for sync.',
      payment_match_tooltip: 'Matches your payment profile'
    },
    user_action: {
      buy: 'Buy BTC',
      sell: 'Sell BTC',
      buy_detail: 'Pay {fiat} · receive BTC',
      sell_detail: 'Receive {fiat} · send BTC',
      money_sell: 'You send the sats · receive fiat',
      money_buy: 'You receive the sats · send fiat'
    },
    buttons: {
      take: 'Take',
      take_bond: 'Take (pay bond)',
      take_pending: 'Take…',
      continue_robosats: 'Continue on RoboSats',
      fix_amount: 'Fix amount',
      payment_sent: 'Payment sent',
      open_platform: 'Open in {platform}',
      cancel: 'Cancel',
      delete: 'Delete',
      open: 'Open',
      create_order: 'Create order',
      export_taxes: 'Export for taxes',
      clear_demo: 'Clear all demo trades ({count})',
      continue: 'Continue',
      set_spot: 'Set spot',
      save: 'Save',
      done: 'Done'
    },
    trades: {
      empty_title: 'No trades yet',
      empty_body:
        'Take an offer from the order book or create your own order to get started.',
      role_maker: 'Maker',
      role_taker: 'Taker',
      waiting_taker: 'Waiting for taker'
    },
    settings: {
      trading_mostro_live: 'Mostro — live take enabled (mainnet + hold-invoice wallet).',
      trading_mostro_demo:
        'Mostro — practice trades while Demo mode is on in Settings.',
      trading_mostro_practice:
        'Mostro — turn off Demo mode and enable mainnet + LND hold invoices for live escrow.',
      robosats_bonds_title: 'RoboSats (taker bond only)',
      robosats_bonds_body:
        'Connect NWC to claim a live RoboSats offer and pay the taker bond. Escrow, chat, and fiat happen on the RoboSats coordinator — not in Trato. Demo mode walks through a practice trade locally.',
      trading_robosats_live:
        'RoboSats — claim offer + pay taker bond via NWC; finish the trade on RoboSats.',
      trading_robosats_demo:
        'RoboSats — full practice walk-through in Demo (simulated). Connect NWC above to pay real taker bonds live.',
      trading_robosats_setup:
        'RoboSats — connect NWC above to pay taker bonds live, or use Demo mode to practise.',
      trading_browse_only:
        'Peach, lnp2pbot… — browse-only; open their app to trade.'
    },
    identity: {
      subtitle: 'Nostr trading identity',
      edit_profile: 'Edit profile',
      edit_caption:
        'Name and avatar are published to Nostr relays — other traders see them on the order book.',
      display_name: 'Display name',
      username: 'Username',
      username_hint: 'Optional short handle (Nostr name field)',
      avatar_url: 'Avatar URL',
      avatar_hint: 'https:// link to a square image',
      bio: 'Bio',
      nip05: 'NIP-05',
      nip05_hint: 'Optional verified address, e.g. you@domain.com',
      lud16: 'Lightning address (Nostr)',
      lud16_hint:
        'Optional lud16 on your Nostr profile — you@domain.com. Trato can offer it when you set Bitcoin receive.',
      no_public_profile:
        'No public name on relays yet — set one so others recognize you.',
      loading_profile: 'Loading profile…',
      load_failed: 'Could not load profile from relays.',
      save_failed: 'Could not publish profile — check relays in Settings.',
      saved: 'Profile published to Nostr',
      name_required: 'Enter a display name or username.',
      bitcoin_receive_title: 'Bitcoin receive',
      bitcoin_receive_sub:
        'Lightning address, on-chain address, or NWC — shared with the seller when you buy Bitcoin',
      bitcoin_receive_add: 'Add',
      bitcoin_receive_empty:
        'No receive address yet — add a Lightning address or Bitcoin address so sellers know where to send sats.',
      bitcoin_receive_lnurlp_install:
        'On this LNbits instance you can create one with the',
      bitcoin_receive_pick_source:
        'Pick a Lightning address — from LNURLp on this instance and/or your Nostr profile:',
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
      relay_sync: 'Relay sync problem: {error}. Check relay URLs in Settings, then refresh the book.',
      health: 'Could not load Trato status — {detail}. Reload the page or check LNbits.',
      identity:
        'Could not load your trading identity — {detail}. Open the Identity tab to set up.',
      session_expired: 'Session expired — reload the page and log in to LNbits again.',
      network: 'Trato could not reach the server — check LNbits is running and refresh.'
    },
    events: {
      you: 'You',
      partner: 'Partner',
      mostro: 'Mostro',
      rated_you: 'Counterpart rated you {stars}/5',
      rated_you_short: 'Counterpart rated you',
      can_rate: 'You can rate your counterpart'
    },
    actions: {
      take_buy: 'You took the buy order',
      take_sell: 'You took the sell order',
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
      dispute_banner_title: 'Dispute open — waiting for a solver',
      pay_seller: 'Pay the seller',
      pay_via: 'Pay via {method}',
      payment_sent_hint:
        'Use the reference from chat if needed. Then tap “Payment sent”.',
      waiting_release:
        'You marked payment as sent. The seller should release sats to your receive address — check the chat for updates.',
      seller_release_title: 'Buyer marked payment as sent — release Bitcoin',
      waiting_seller_pay: 'Waiting for the seller to share how to pay. Check the chat below.',
      completed_title: 'Trade complete',
      completed_onchain_buy:
        'Bitcoin should arrive at your wallet address. Allow time for network confirmations.',
      completed_lightning_buy:
        'Sats should appear in your Lightning wallet shortly.',
      completed_sell: 'You released the Bitcoin. This trade is done.',
      privacy_tip_expand: 'Optional — improve privacy',
      privacy_tip_expand_caption: 'Mix your coins so they are harder to link to this trade',
      privacy_tip_intro:
        'On-chain Bitcoin is public. You can optionally mix it with other people\'s coins — a process called coinjoin — so it is harder to trace back to this trade.',
      privacy_tip_step1: 'Install Wasabi Wallet on your computer (free, open source)',
      privacy_tip_step2: 'When your Bitcoin arrives, send it to your Wasabi wallet',
      privacy_tip_step3: 'In Wasabi, start a coinjoin round — your coins get mixed with others',
      privacy_tip_wasabi: 'Wasabi setup guide',
      privacy_tip_guide: 'What is coinjoin?',
      privacy_tip_dismiss: 'Don\'t show this again',
      robosats_continue_banner:
        'Taker bond paid. Continue escrow and fiat payment on RoboSats.',
      robosats_live_chip: 'Bond paid — finish on RoboSats',
      robosats_timeline_note:
        'Bond paid in Trato. Escrow and fiat continue on RoboSats — use Continue on RoboSats above.'
    },
    notify: {
      copied: 'Copied',
      browse_copied: 'Browse link copied',
      rating_sent: 'Rating sent',
      order_created: 'Order created — continue in your trade',
      order_canceled: 'Order canceled',
      trade_removed: 'Trade removed',
      tax_exported: 'Tax export downloaded',
      login_first: 'Log in to LNbits on this server first.',
      enter_fiat: 'Enter a fiat amount',
      enter_sats: 'Enter a sats amount or use market price',
      no_demo_trades: 'No demo trades to clear',
      profile_ready: 'Trader profile ready',
      clearing_demo: 'Clearing demo trades…',
      robosats_bond_paid: 'Taker bond paid — continue on RoboSats'
    },
    confirm: {
      cancel_order_title: 'Cancel this order?',
      cancel_order_ok: 'Cancel order',
      remove_history_title: 'Remove from history?',
      delete_demo_title: 'Delete all {count} demo trade(s)?',
      delete_all: 'Delete all'
    },
    detail: {
      pick_payment_method:
        'Fees and the payment step use this rail — pick before you take.',
      robosats_live_banner:
        'Trato only claims this offer and pays the taker bond. Continue escrow and fiat on the RoboSats coordinator.',
      robosats_live_link: 'Open on RoboSats'
    },
    market_hint: {
      default:
        'BTC price from LNbits exchange rates. Pick a currency filter to change it.',
      wallet:
        'BTC price in {fiat} — from your LNbits wallet / instance default. Pick a currency in the filter to override.'
    }
  }
}

const TRATO_BITCOIN_RECEIVE_TYPES = new Set([
  'lightning_address',
  'onchain_btc',
  'nwc_wallet'
])

const TRATO_BANK_PROFILE_TYPE_ORDER = [
  'sepa',
  'sepa_instant',
  'bank_transfer',
  'revolut',
  'wise',
  'paypal',
  'bizum',
  'strike',
  'cash_app',
  'venmo',
  'zelle',
  'mpesa',
  'mobile_money',
  'cash_in_person',
  'cash_by_mail',
  'other',
  'lightning_address',
  'onchain_btc',
  'nwc_wallet'
]

const TRATO_DEFAULT_PAYMENT_SCHEMA =
  (typeof window !== 'undefined' && window.TRATO_PAYMENT_SCHEMA) || {
    sepa: {
      label: 'SEPA bank transfer',
      fields: ['account_name', 'country', 'iban', 'bic', 'bank_name']
    },
    sepa_instant: {
      label: 'SEPA Instant',
      fields: ['account_name', 'country', 'iban', 'bic', 'bank_name']
    },
    bank_transfer: {
      label: 'Bank transfer',
      fields: ['account_name', 'country', 'iban', 'bic', 'bank_name', 'account_number']
    },
    revolut: {
      label: 'Revolut',
      fields: ['account_name', 'username', 'phone']
    },
    wise: {label: 'Wise', fields: ['account_name', 'email', 'username']},
    paypal: {
      label: 'PayPal',
      fields: ['account_name', 'email', 'payment_link', 'notes']
    },
    bizum: {label: 'Bizum', fields: ['account_name', 'phone']},
    strike: {label: 'Strike', fields: ['account_name', 'username']},
    cash_app: {label: 'Cash App', fields: ['account_name', 'username']},
    venmo: {label: 'Venmo', fields: ['account_name', 'username']},
    zelle: {label: 'Zelle', fields: ['account_name', 'email', 'phone']},
    mpesa: {
      label: 'M-Pesa',
      fields: ['account_name', 'phone', 'till_number', 'paybill', 'country', 'notes']
    },
    mobile_money: {
      label: 'Other mobile wallet (Airtel, MTN, Orange)',
      fields: ['account_name', 'phone', 'provider', 'country', 'notes']
    },
    cash_in_person: {
      label: 'Cash in person (meetup)',
      fields: ['place_label', 'country', 'map_url', 'timezone', 'notes']
    },
    cash_by_mail: {
      label: 'Cash by mail',
      fields: ['account_name', 'country', 'notes']
    },
    other: {label: 'Other', fields: ['account_name', 'notes']},
    lightning_address: {
      label: 'Lightning address (receive)',
      fields: ['account_name', 'lightning_address', 'notes'],
      description:
        'Where you receive sats — Lightning address (you@domain.com) or LNURL-pay. ' +
        'Shared with your trade partner when you buy Bitcoin.'
    },
    onchain_btc: {
      label: 'On-chain Bitcoin (receive)',
      fields: ['account_name', 'btc_address', 'notes'],
      description:
        'Bitcoin address for on-chain settlement (bc1…, 1…, or 3…). ' +
        'Shared with the seller when you buy Bitcoin.'
    },
    nwc_wallet: {
      label: 'NWC wallet (receive via invoice)',
      fields: ['account_name', 'notes'],
      description:
        'Receive sats via invoices from your NWC wallet in Settings — ' +
        'the connection URI stays in Settings, not in this profile.'
    }
  }

const TRATO_DEFAULT_COUNTRY_NAMES =
  (typeof window !== 'undefined' && window.TRATO_COUNTRY_NAMES) || {
    AD: 'Andorra',
    AT: 'Austria',
    BE: 'Belgium',
    BG: 'Bulgaria',
    CH: 'Switzerland',
    CY: 'Cyprus',
    CZ: 'Czechia',
    DE: 'Germany',
    DK: 'Denmark',
    EE: 'Estonia',
    ES: 'Spain',
    FI: 'Finland',
    FR: 'France',
    GB: 'United Kingdom',
    GI: 'Gibraltar',
    GR: 'Greece',
    HR: 'Croatia',
    HU: 'Hungary',
    IE: 'Ireland',
    IS: 'Iceland',
    IT: 'Italy',
    LI: 'Liechtenstein',
    LT: 'Lithuania',
    LU: 'Luxembourg',
    LV: 'Latvia',
    MC: 'Monaco',
    MD: 'Moldova',
    ME: 'Montenegro',
    MK: 'North Macedonia',
    MT: 'Malta',
    NL: 'Netherlands',
    NO: 'Norway',
    PL: 'Poland',
    PT: 'Portugal',
    RO: 'Romania',
    RS: 'Serbia',
    SE: 'Sweden',
    SI: 'Slovenia',
    SK: 'Slovakia',
    SM: 'San Marino',
    VA: 'Vatican City',
    XK: 'Kosovo'
  }

const TRATO_DEFAULT_SEPA_COUNTRIES =
  (typeof window !== 'undefined' && window.TRATO_SEPA_COUNTRIES) || [
    'AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
    'FR', 'GB', 'GI', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU',
    'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS',
    'SE', 'SI', 'SK', 'SM', 'VA', 'XK'
  ]

const TRATO_DEFAULT_MOBILE_MONEY_COUNTRIES =
  (typeof window !== 'undefined' && window.TRATO_MOBILE_MONEY_COUNTRIES) || [
    'BF', 'BJ', 'BW', 'CD', 'CG', 'CI', 'CM', 'ET', 'GA', 'GH', 'KE', 'LS',
    'MG', 'ML', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RW', 'SN', 'SZ', 'TG', 'TZ',
    'UG', 'ZA', 'ZM'
  ]

function tratoApiPayload(res) {
  if (res == null) return null
  if (typeof res === 'object' && Object.prototype.hasOwnProperty.call(res, 'data')) {
    return res.data
  }
  return res
}

window.app = Vue.createApp({
  el: '#vue',
  mixins: [windowMixin],
  data() {
    return {
      tab: 'book',
      orders: [],
      myOrders: [],
      stats: {platforms: {}, fiat_codes: {}, takeable: 0, last_sync: null, total: 0},
      fiatOptionsFiltered: [],
      paymentFilterOptionsFiltered: [],
      health: {},
      identity: null,
      filters: {
        side: null,
        fiat: null,
        payment: null,
        matchMyPayments: false,
        tratoOnly: true,
        settlement: null,
        sort: 'newest'
      },
      oppositeSideHint: null,
      operatorPolicies: {},
      // Public trust tiers (no KYC — reputation from completed Mostro trades).
      trustMinReviews: 5,
      trustMinStars: 4.0,
      newIdentity: {wallet: null},
      settings: {demo_mode: true, mainnet_enabled: false, relays: [], has_nwc: false},
      settingsForm: {
        relaysText: '',
        mostro_pubkey: '',
        demo_mode: true,
        mainnet_enabled: false,
        nwc_uri: '',
        clear_nwc: false,
        robosats_coordinator: null
      },
      robosatsCoordinatorOptions: [],
      orderbookRefreshing: false,
      clientFilterBusy: false,
      _listClientFilters: {tratoOnly: true, matchMyPayments: false, payment: null},
      _orderbookGen: 0,
      _oppositeHintGen: 0,
      _clientFilterRaf: null,
      loading: {
        orderbook: false,
        identity: false,
        settings: false,
        create: false,
        taxExport: false
      },
      createDialog: {
        show: false,
        rate: null,
        btcPrice: null,
        rateLoading: false,
        data: {
          side: 'sell',
          fiat_code: 'EUR',
          fiat_amount: null,
          payment_methods: [],
          is_market: true,
          amount_sats: 0,
          premium: 0,
          settlement_layers: ['lightning']
        }
      },
      currencyOptions: [],
      paymentMethodOptions: [
        'SEPA',
        'SEPA Instant',
        'Revolut',
        'Wise',
        'PayPal',
        'Bizum',
        'MB Way',
        'Strike',
        'Cash App',
        'Venmo',
        'Zelle',
        'Bank transfer',
        'Cash in person',
        'Cash by mail'
      ],
      paymentMethodChoices: [],
      paymentDetailsForm: {
        loading: false,
        profiles: [],
        schema: {...TRATO_DEFAULT_PAYMENT_SCHEMA},
        methodNames: [],
        countryNames: {...TRATO_DEFAULT_COUNTRY_NAMES},
        sepaCountries: [...TRATO_DEFAULT_SEPA_COUNTRIES],
        mobileMoneyCountries: [...TRATO_DEFAULT_MOBILE_MONEY_COUNTRIES],
        mapCenters: {},
        lnurlpReceive: null,
        lightningReceiveChoices: [],
        nostrLud16: null,
        editor: {
          show: false,
          index: -1,
          draft: {},
          meetupMode: false,
          bitcoinMode: false,
          alsoSepaInstant: true
        }
      },
      identityReputation: null,
      identityReputationLoading: false,
      nostrProfileForm: {
        editor: {
          show: false,
          saving: false,
          draft: {
            display_name: '',
            name: '',
            picture: '',
            about: '',
            nip05: ''
          }
        }
      },
      nostrProfiles: {},
      nostrProfilesPending: {},
      avatarRobohashForced: {},
      onboardingDismissed:
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('trato_onboarding_dismissed') === '1',
      settingsHelpDismissed:
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('trato_dismiss_settings_help') === '1',
      marketPrice: {
        fiat_code: null,
        sats_per_fiat: null,
        btc_price: null,
        loading: false
      },
      detailDialog: {
        show: false,
        order: null,
        takeSettlement: null,
        takePaymentMethod: null,
        takeFiatAmount: null,
        quoteLoading: false,
        quoteSatsPerFiat: null,
        quoteBtcPrice: null
      },
      loadErrors: {
        health: null,
        identity: null,
        settings: null,
        orderbook: null,
        stats: null
      },
      tradeDialog: {
        show: false,
        order: null,
        events: [],
        allowed: [],
        chatText: '',
        acting: false,
        rateShow: false,
        rating: 5,
        sellerPayment: null,
        payActions: [],
        paymentProfileOptions: [],
        shareProfileId: null,
        meetupAtLocal: '',
        sharingPayment: false,
        buyerReceiveSummary: ''
      },
      tradesFocusId: null,
    }
  },
  computed: {
    isPublicView() {
      return Boolean(typeof window !== 'undefined' && window.TRATO_PUBLIC)
    },
    isDemoMode() {
      return Boolean(this.settings && this.settings.demo_mode)
    },
    loginPath() {
      const base = (window.location.pathname || '').replace(/\/book\/?$/, '')
      return base || '/trato/'
    },
    publicBookUrl() {
      const origin = window.location.origin || ''
      return `${origin}/trato/book`
    },
    tratoIconUrl() {
      return (typeof window !== 'undefined' && window.TRATO_ICON_URL) || ''
    },
    adminKey() {
      return this.g.user && this.g.user.wallets.length
        ? this.g.user.wallets[0].adminkey
        : null
    },
    walletOptions() {
      if (!this.g.user) return []
      return this.g.user.wallets.map(w => ({label: w.name, value: w.id}))
    },
    sideOptions() {
      return [
        {label: this.t('filters.buy_btc'), value: 'buy'},
        {label: this.t('filters.sell_btc'), value: 'sell'}
      ]
    },
    settlementOptions() {
      return [
        {label: this.t('filters.lightning'), value: 'lightning'},
        {label: this.t('filters.onchain'), value: 'onchain'}
      ]
    },
    sortOptions() {
      const SORT = typeof window !== 'undefined' ? window.TratoOrderbookSort : null
      if (!SORT) return []
      const labels = {}
      for (const key of SORT.ORDER) {
        labels[key] = {
          label: this.t(`sort.${key}`),
          hint: this.t(`sort.${key}_hint`)
        }
      }
      return SORT.optionList(labels)
    },
    tradeColumns() {
      return [
        {name: 'role', label: this.t('columns.role'), field: 'role', align: 'left'},
        {name: 'side', label: this.t('columns.side'), field: 'side', align: 'left'},
        {
          name: 'fiat',
          label: this.t('columns.fiat'),
          align: 'left',
          field: row =>
            row.fiat_amount
              ? `${row.fiat_amount} ${row.fiat_code}`
              : row.fiat_code || '—'
        },
        {
          name: 'sats',
          label: this.t('columns.sats'),
          align: 'right',
          field: row => (row.amount_sats ? row.amount_sats : 'market')
        },
        {name: 'status', label: this.t('columns.status'), field: 'status', align: 'left'},
        {
          name: 'created',
          label: this.t('columns.created'),
          align: 'left',
          field: row => this.formatDate(row.created_at)
        }
      ]
    },
    platformOptions() {
      return []
    },
    fiatOptions() {
      const codes = {...(this.stats.fiat_codes || {})}
      for (const o of this.orders || []) {
        const c = (o.fiat_code || '').trim().toUpperCase()
        if (c) codes[c] = (codes[c] || 0) + 1
      }
      return Object.keys(codes)
        .sort()
        .map(c => ({
          label: `${c} (${codes[c]})`,
          value: c
        }))
    },
    paymentFilterOptions() {
      const counts = {}
      for (const o of this.orders || []) {
        for (const pm of this.expandPaymentMethods(o.payment_methods)) {
          const key = pm.trim()
          if (key) counts[key] = (counts[key] || 0) + 1
        }
      }
      const keys = Object.keys(counts)
      const byFreqThenName = (a, b) => {
        const diff = counts[b] - counts[a]
        return diff !== 0 ? diff : a.localeCompare(b)
      }
      const ranked = keys.slice().sort(byFreqThenName)
      const top10 = new Set(ranked.slice(0, 10))
      const top = ranked.filter(k => top10.has(k))
      const rest = keys.filter(k => !top10.has(k)).sort((a, b) => a.localeCompare(b))
      return [...top, ...rest].map(label => ({
        label: `${label} (${counts[label]})`,
        value: label
      }))
    },
    bookRelayWarning() {
      const err = this.stats.last_error
      if (!err) return ''
      return this.t('warnings.relay_sync', {error: err})
    },
    appLoadWarning() {
      if (this.loadErrors.health) {
        return this.t('warnings.health', {detail: this.loadErrors.health})
      }
      if (this.loadErrors.identity && !this.identity) {
        return this.t('warnings.identity', {detail: this.loadErrors.identity})
      }
      return ''
    },
    liveTradingBlockers() {
      if (this.settings.demo_mode) return []
      return (this.health.trading && this.health.trading.live_take_blockers) || []
    },
    tradingInTratoBlurb() {
      const t = this.health.trading || {}
      const lines = []
      if (t.live_mostro_enabled) {
        lines.push(this.t('settings.trading_mostro_live'))
      } else if (this.settings.demo_mode) {
        lines.push(this.t('settings.trading_mostro_demo'))
      } else {
        lines.push(this.t('settings.trading_mostro_practice'))
      }
      if (t.robosats_take_enabled && !this.settings.demo_mode && t.nwc_configured) {
        lines.push(this.t('settings.trading_robosats_live'))
      } else if (this.settings.demo_mode) {
        lines.push(this.t('settings.trading_robosats_demo'))
      } else {
        lines.push(this.t('settings.trading_robosats_setup'))
      }
      lines.push(this.t('settings.trading_browse_only'))
      return lines.join(' ')
    },
    orderBookMetaLine() {
      if (this.clientFilterBusy) {
        return this.t('orderbook.filtering')
      }
      const n = this.visibleOrders.length
      const take = this.stats.takeable != null ? this.stats.takeable : null
      const parts = [
        `${n} ${n === 1 ? this.t('orderbook.offer') : this.t('orderbook.offers')}`
      ]
      if (take != null && this.stats.total) {
        parts.push(`${take} ${this.t('orderbook.mostro')}`)
      }
      if (this.stats.last_sync) {
        parts.push(this.t('orderbook.synced', {ago: this.timeAgo(this.stats.last_sync)}))
      } else if (this.stats.last_error) {
        parts.push(this.t('orderbook.relay_sync_failed'))
      } else {
        parts.push(this.t('orderbook.connecting'))
      }
      return parts.join(' · ')
    },
    bookPlatformSummary() {
      const platforms = this.stats.platforms || {}
      const entries = Object.entries(platforms).sort((a, b) => b[1] - a[1])
      return entries.map(([p, n]) => `${this.platformLabel(p)} ${n}`)
    },
    noTakeableOffersInBook() {
      return (
        !this.loading.orderbook &&
        !this.orderbookRefreshing &&
        this.stats.total > 0 &&
        (this.stats.takeable || 0) === 0
      )
    },
    bookFiatEmptyHint() {
      if (this.loading.orderbook || this.orders.length > 0) return ''
      const code = (this.filters.fiat || '').trim().toUpperCase()
      if (!code) return ''
      const n = (this.stats.fiat_codes && this.stats.fiat_codes[code]) || 0
      if (n === 0) {
        return this.t('orderbook.fiat_empty', {code})
      }
      let msg = this.t('orderbook.fiat_filtered', {code})
      if (this.filters.tratoOnly) {
        msg += this.t('orderbook.fiat_filtered_trato_only')
      }
      return msg
    },
    visibleOrders() {
      const cf = this._listClientFilters
      let list = this.orders
      if (cf.tratoOnly) {
        list = list.filter(o => this.platformTratoSupports(o))
      }
      if (cf.matchMyPayments && this.paymentDetailsForm.profiles.length) {
        list = list.filter(o => this.orderMatchesMyPayments(o))
      }
      if (cf.payment) {
        list = list.filter(o => this.orderMatchesPaymentFilter(o))
      }
      return list
    },
    shareProfileIsCashMeetup() {
      const id = this.tradeDialog.shareProfileId
      if (!id) return false
      const p = this.tradeDialog.paymentProfileOptions.find(o => o.id === id)
      return p && p.type === 'cash_in_person'
    },
    meetupProfiles() {
      return (this.paymentDetailsForm.profiles || []).filter(
        p => p.type === 'cash_in_person'
      )
    },
    bankProfiles() {
      return (this.paymentDetailsForm.profiles || []).filter(
        p =>
          p.type !== 'cash_in_person' && !TRATO_BITCOIN_RECEIVE_TYPES.has(p.type)
      )
    },
    bitcoinReceiveProfiles() {
      return (this.paymentDetailsForm.profiles || []).filter(p =>
        TRATO_BITCOIN_RECEIVE_TYPES.has(p.type)
      )
    },
    lnurlpReceiveHint() {
      const hint = this.paymentDetailsForm.lnurlpReceive
      if (!hint || typeof hint !== 'object') return null
      return hint
    },
    lightningReceiveChoices() {
      return this.paymentDetailsForm.lightningReceiveChoices || []
    },
    effectivePaymentSchema() {
      const fromApi = this.paymentDetailsForm.schema || {}
      if (Object.keys(fromApi).length) return fromApi
      return TRATO_DEFAULT_PAYMENT_SCHEMA
    },
    bankProfileTypeOptions() {
      const schema = this.effectivePaymentSchema
      return Object.keys(schema)
        .filter(t => !TRATO_BITCOIN_RECEIVE_TYPES.has(t))
        .map(t => ({
          label: (schema[t] && schema[t].label) || t,
          value: t
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
    bitcoinProfileTypeOptions() {
      const schema = this.effectivePaymentSchema
      return [...TRATO_BITCOIN_RECEIVE_TYPES]
        .filter(t => schema[t])
        .map(t => ({
          label: (schema[t] && schema[t].label) || t,
          value: t
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
    orderBookSections() {
      const SORT = typeof window !== 'undefined' ? window.TratoOrderbookSort : null
      const sorted = SORT
        ? SORT.sort(this.visibleOrders, this.filters.sort)
        : this.visibleOrders
      const buy = []
      const sell = []
      for (const o of sorted) {
        if (this.userSideIfTake(o.kind) === 'buy') buy.push(o)
        else sell.push(o)
      }
      const sortLabels = {}
      if (SORT) {
        for (const key of SORT.ORDER) {
          sortLabels[key] = {label: this.t(`sort.${key}`)}
        }
      }
      const sections = []
      const add = (key, title, subtitle, orders) => {
        if (this.filters.side && this.filters.side !== key) return
        sections.push({key, title, subtitle, orders, count: orders.length})
      }
      add(
        'buy',
        this.t('orderbook.section_buy_title'),
        SORT
          ? SORT.sectionSubtitle(this.filters.sort, 'buy', sortLabels)
          : this.t('orderbook.section_buy_sub'),
        buy
      )
      add(
        'sell',
        this.t('orderbook.section_sell_title'),
        SORT
          ? SORT.sectionSubtitle(this.filters.sort, 'sell', sortLabels)
          : this.t('orderbook.section_sell_sub'),
        sell
      )
      return sections
    },
    tradeCounterparty() {
      if (!this.tradeDialog.order) return null
      try {
        const meta = JSON.parse(this.tradeDialog.order.order_json || '{}')
        return meta.counterparty || null
      } catch (e) {
        return null
      }
    },
    displayTradeEvents() {
      const events = this.tradeDialog.events || []
      const order = this.tradeDialog.order
      if (!order || !order.demo) return events
      return events.filter(
        e => e.direction === 'system' || e.kind === 'chat'
      )
    },
    tradeDisputeBannerDetail() {
      const o = this.tradeDialog.order
      if (!o || o.status !== 'dispute') return ''
      if (o.demo) {
        return (
          'A practice solver should reply in the timeline below. ' +
          'Your instance coordinator can also respond from Trato Operator → Open disputes.'
        )
      }
      if (this.usesHostOperator(o)) {
        return (
          'Your instance operator is mediating. Watch this chat for coordinator messages. ' +
          'Escrow moves happen in mostrod.'
        )
      }
      return (
        'A Mostro solver will mediate. Keep payment proof in this chat. ' +
        'Foreign operators handle escrow — not your LNbits host unless you routed to your own mostrod.'
      )
    },
    demoLightningPanel() {
      const o = this.tradeDialog.order
      if (!o || !o.demo) return null
      const sats = o.amount_sats || 0
      if (o.side === 'buy' && o.buyer_invoice) {
        return {
          title: 'Practice Lightning invoice (receive sats)',
          hint:
            'Trato auto-creates this from your LNbits wallet in a live trade. ' +
            'It is not on the Lightning network in demo — nothing to pay or copy.',
          bolt11: o.buyer_invoice,
          sats: sats
        }
      }
      if (o.side === 'sell' && o.hold_invoice) {
        return {
          title: 'Practice escrow hold-invoice (lock your sats)',
          hint:
            'In live mode you pay this from your wallet to lock Bitcoin until you ' +
            'release. Demo skips real payment — escrow is marked funded automatically.',
          bolt11: o.hold_invoice,
          sats: sats
        }
      }
      return null
    },
    demoOnchainPanel() {
      const o = this.tradeDialog.order
      if (!o || !o.demo) return null
      let layer = 'lightning'
      try {
        const meta = JSON.parse(o.order_json || '{}')
        layer = String(meta.settlement_layer || 'lightning').toLowerCase()
      } catch (e) {
        /* ignore */
      }
      if (layer !== 'onchain') return null
      const sats = o.amount_sats || 0
      const ref = (o.mostro_order_id || o.id || '').slice(0, 8)
      return {
        title: 'Practice on-chain settlement',
        hint:
          'Bitcoin moves via a blockchain address, not Lightning. ' +
          'Addresses are practice-only in demo — nothing to send or copy.',
        address: `bc1qDEMO${ref}onchainnotreal`,
        sats: sats
      }
    },
    intentFilterHint() {
      if (!this.filters.side) return ''
      return this.filters.side === 'buy'
        ? this.t('orderbook.intent_buy')
        : this.t('orderbook.intent_sell')
    },
    oppositeSideOfferBanner() {
      if (!this.filters.side || !this.oppositeSideHint) return ''
      if (this.visibleOrders.length > 0) return ''
      const h = this.oppositeSideHint
      const key =
        h.side === 'buy'
          ? 'orderbook.opposite_side_hint_buy'
          : 'orderbook.opposite_side_hint_sell'
      return this.t(key, {
        count: h.count,
        offers: h.count === 1 ? this.t('orderbook.offer') : this.t('orderbook.offers')
      })
    },
    visibleMyOrders() {
      return this.myOrders.filter(o => o.demo === this.settings.demo_mode)
    },
    deletableMyOrders() {
      return this.visibleMyOrders.filter(o => this.isDeletableOrder(o))
    },
    showOnboarding() {
      if (this.onboardingDismissed) return false
      if (!this.identity) return true
      const demoCount =
        (this.health.trade_counts && this.health.trade_counts.demo) || 0
      return demoCount === 0
    },
    onboardingStep() {
      if (!this.identity) return 1
      const demoCount =
        (this.health.trade_counts && this.health.trade_counts.demo) || 0
      if (demoCount === 0) return 2
      return 3
    },
    detailFeeBreakdown() {
      const o = this.detailDialog.order
      if (!o) {
        return {detailItems: [], summary: {show: false}, items: [], headline: ''}
      }
      return this.tradeFeeBreakdown(o, this.userSideIfTake(o.kind), {context: 'detail'})
    },
    activeTradeFeeBreakdown() {
      const o = this.tradeDialog.order
      if (!o) {
        return {detailItems: [], summary: {show: false}, items: [], headline: ''}
      }
      return this.tradeFeeBreakdown(o, o.side, {context: 'trade'})
    }
  },
  methods: {
    t(key, values) {
      return this.$t(`trato.${key}`, values || {})
    },
    friendlyApiMessage(err) {
      let detail = ''
      if (err && err.response && err.response.data) {
        const d = err.response.data
        if (typeof d === 'string') detail = d
        else if (d.detail) {
          detail =
            typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail)
        } else if (d.message) detail = d.message
      } else if (err && err.message) {
        detail = err.message
      }
      detail = (detail || 'Something went wrong').trim()
      const lower = detail.toLowerCase()
      if (lower.includes('network error') || lower.includes('failed to fetch')) {
        return this.t('warnings.network')
      }
      if (lower.includes('unauthorized') || (err && err.response && err.response.status === 401)) {
        return this.t('warnings.session_expired')
      }
      return detail
    },
    notifyTratoError(err) {
      this.$q.notify({
        message: this.friendlyApiMessage(err),
        color: 'negative',
        timeout: 8000
      })
    },
    orderLayers(order) {
      if (!order) return ['lightning']
      if (order.layers && order.layers.length) return order.layers
      return [order.layer || 'lightning']
    },
    takeSettlementOptions(order) {
      return this.orderLayers(order).map(l => ({
        label: this.settlementName(l),
        value: l
      }))
    },
    takePaymentMethodOptions(order) {
      return this.expandPaymentMethods(order.payment_methods).map(pm => ({
        label: pm,
        value: pm
      }))
    },
    pickDefaultTakePaymentMethod(order) {
      const methods = this.expandPaymentMethods(order && order.payment_methods)
      if (!methods.length) return null
      if (methods.length === 1) return methods[0]
      const needle = (this.filters.payment || '').trim().toLowerCase()
      if (needle) {
        const hit = methods.find(pm => {
          const hay = pm.toLowerCase()
          return hay === needle || hay.includes(needle)
        })
        if (hit) return hit
      }
      for (const p of this.paymentDetailsForm.profiles) {
        for (const pm of methods) {
          if (this.profileMatchesPm(p, pm)) return pm
        }
      }
      return methods[0]
    },
    effectiveTakePaymentMethod(order) {
      if (!order) return null
      const methods = this.expandPaymentMethods(order.payment_methods)
      if (methods.length <= 1) return methods[0] || null
      if (
        this.detailDialog.order &&
        this.detailDialog.order.id === order.id &&
        this.detailDialog.takePaymentMethod &&
        methods.includes(this.detailDialog.takePaymentMethod)
      ) {
        return this.detailDialog.takePaymentMethod
      }
      const needle = (this.filters.payment || '').trim().toLowerCase()
      if (needle) {
        const hit = methods.find(pm => {
          const hay = pm.toLowerCase()
          return hay === needle || hay.includes(needle)
        })
        if (hit) return hit
      }
      return null
    },
    hasExplicitPaymentChoice(order) {
      const methods = this.expandPaymentMethods(order && order.payment_methods)
      if (methods.length <= 1) return true
      return Boolean(this.effectiveTakePaymentMethod(order))
    },
    tradeChosenPaymentMethod(order) {
      if (!order) return ''
      const pm = (order.payment_method || '').trim()
      if (pm && !pm.includes(',')) return pm
      try {
        const meta = JSON.parse(order.order_json || '{}')
        if (meta.chosen_payment_method) return String(meta.chosen_payment_method)
        if (Array.isArray(meta.payment_methods) && meta.payment_methods[0]) {
          return String(meta.payment_methods[0])
        }
      } catch (e) {
        /* ignore */
      }
      return pm.split(',')[0].trim()
    },
    isStablecoinPm(pm) {
      const compact = String(pm || '')
        .toLowerCase()
        .replace(/[\s\-_]/g, '')
      return /usdt|usdc|lusdt|lusd|dai|pyusd|busd/.test(compact)
    },
    paymentRailVerb(pm) {
      return this.isStablecoinPm(pm) ? 'Send' : 'Pay'
    },
    paymentSummaryLabel(side, paymentMethod, fiatCode) {
      const pm = (paymentMethod || '').trim()
      const code = (fiatCode || '').trim().toUpperCase()
      if (side === 'buy') {
        if (pm) return `${this.paymentRailVerb(pm)} via ${pm}`
        return code ? `Pay ${code}` : 'Payment you send'
      }
      if (pm) return `Receive via ${pm}`
      return code ? `Receive ${code}` : 'Payment you receive'
    },
    hasExplicitSettlementChoice(order) {
      const layers = this.orderLayers(order)
      if (layers.length === 1) return true
      if (this.filters.settlement && layers.includes(this.filters.settlement)) {
        return true
      }
      if (
        this.detailDialog.order &&
        this.detailDialog.order.id === order.id &&
        this.detailDialog.takeSettlement &&
        layers.includes(this.detailDialog.takeSettlement)
      ) {
        return true
      }
      return false
    },
    effectiveTakeSettlement(order) {
      if (!order) return null
      const layers = this.orderLayers(order)
      if (
        this.detailDialog.order &&
        this.detailDialog.order.id === order.id &&
        this.detailDialog.takeSettlement &&
        layers.includes(this.detailDialog.takeSettlement)
      ) {
        return this.detailDialog.takeSettlement
      }
      if (this.filters.settlement && layers.includes(this.filters.settlement)) {
        return this.filters.settlement
      }
      if (layers.length === 1) return layers[0]
      return null
    },
    operatorFeeIsEstimate(order) {
      const pk = order && order.mostro_pubkey
      const info = pk && this.operatorPolicies[pk]
      return !(info && info.fee_fraction != null)
    },
    formatLocaleInteger(n) {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
      return Math.round(Number(n)).toLocaleString(undefined, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      })
    },
    formatSats(n) {
      return this.formatLocaleInteger(n)
    },
    clampRating(value) {
      const n = Math.round(Number(value))
      if (!n || n < 1) return 1
      return Math.min(5, n)
    },
    openRateDialog() {
      this.tradeDialog.rating = this.clampRating(this.tradeDialog.rating || 5)
      this.tradeDialog.rateShow = true
    },
    formatDate(ts) {
      if (!ts) return ''
      return Quasar.date.formatDate(new Date(ts * 1000), 'YYYY-MM-DD HH:mm')
    },
    timeAgo(ts) {
      if (!ts) return ''
      const s = Math.max(0, Math.floor(Date.now() / 1000 - ts))
      if (s < 60) return `${s}s ago`
      if (s < 3600) return `${Math.floor(s / 60)}m ago`
      return `${Math.floor(s / 3600)}h ago`
    },
    statusLabel(status) {
      const map = {
        pending: 'Pending',
        'waiting-payment': 'Waiting for payment',
        'waiting-buyer-invoice': 'Waiting for buyer invoice',
        'fiat-sent': 'Fiat sent',
        active: 'Active',
        'in-progress': 'In progress',
        success: 'Completed',
        canceled: 'Canceled',
        cancelled: 'Canceled',
        expired: 'Expired',
        dispute: 'Dispute'
      }
      return map[status] || String(status || '').replace(/-/g, ' ')
    },
    isTakeable(order) {
      return this.canTakeOrder(order)
    },
    platformTratoSupports(order) {
      if (!order) return false
      if (order.takeable === true) return true
      if (order.takeable === false) return false
      const plat = String(order.platform || 'mostro').toLowerCase()
      const cap = (this.health.trading || {}).takeable_platforms || ['mostro', 'robosats']
      return cap.includes(plat)
    },
    takeablePlatformsSummary() {
      const trading = this.health.trading || {}
      const platforms = (trading.takeable_platforms || ['mostro', 'robosats'])
        .map(p => this.platformLabel(p))
        .join(', ')
      if (trading.live_take_enabled) {
        return this.t('orderbook.platform_take_live', {platforms: platforms})
      }
      if (this.settings.demo_mode && trading.demo_take_enabled !== false) {
        return this.t('orderbook.platform_take_demo', {platforms: platforms})
      }
      return this.t('orderbook.platform_take_pending', {platforms: platforms})
    },
    platformLabel(platform) {
      const p = String(platform || 'mostro').toLowerCase()
      const labels = {
        mostro: 'Mostro',
        robosats: 'RoboSats',
        peach: 'Peach',
        lnp2pbot: 'lnp2pbot',
        hodlhodl: 'HodlHodl'
      }
      return labels[p] || platform || 'unknown'
    },
    platformExternalUrl(platform) {
      const urls = {
        robosats: 'https://learn.robosats.org/',
        peach: 'https://peachbitcoin.com/',
        lnp2pbot: 'https://lnp2pbot.com/',
        hodlhodl: 'https://hodlhodl.com/'
      }
      return urls[String(platform || '').toLowerCase()] || null
    },
    orderTakeBlockers(order) {
      const blockers = []
      if (!order || !this.platformTratoSupports(order)) {
        return blockers
      }
      if (!this.identity) {
        blockers.push({
          message:
            'You need a trading identity first — open the Identity tab and connect a wallet.',
          tab: 'identity'
        })
      }
      if (!this.hasExplicitSettlementChoice(order)) {
        blockers.push({
          message:
            'This offer supports more than one settlement type. Open the offer and choose Lightning or On-chain under Settlement.',
          action: 'detail'
        })
      }
      if (!this.hasExplicitPaymentChoice(order)) {
        blockers.push({
          message:
            'This offer lists more than one payment method. Open the offer and pick how you will pay (e.g. USDT vs bank transfer).',
          action: 'detail'
        })
      }
      if (this.hasExplicitSettlementChoice(order)) {
        const layer = this.effectiveTakeSettlement(order)
        const trading = this.health.trading || {}
        if (layer === 'onchain' && !trading.onchain_take_enabled) {
          blockers.push({
            message:
              'On-chain takes need mainnet and LND hold invoices (or Demo mode to practise). ' +
              'Your Bitcoin receive address in Identity is shared in chat after take.',
            tab: 'settings'
          })
        }
        if (layer === 'lightning' && trading.lightning_take_enabled === false) {
          blockers.push({
            message:
              'Lightning takes are disabled in this build. Try Demo mode or check Settings.',
            tab: 'settings'
          })
        }
      }
      if (order.is_range) {
        if (!this.isDetailOpenForOrder(order)) {
          blockers.push({
            message:
              'This offer has a fiat range — open the offer and enter how much you want to trade (e.g. 150 EUR).',
            action: 'detail'
          })
        }
        const amt = this.detailChosenFiatAmount(order)
        if (this.isDetailOpenForOrder(order) && (amt == null || isNaN(amt))) {
          blockers.push({
            message:
              'Enter how much fiat you want to trade inside the offer range.',
            action: 'detail'
          })
        } else if (
          this.isDetailOpenForOrder(order) &&
          amt != null &&
          !isNaN(amt) &&
          order.fiat_min != null &&
          order.fiat_max != null &&
          !this.fiatAmountInRange(order, amt)
        ) {
          blockers.push({
            message: `Fiat amount must be between ${order.fiat_min} and ${order.fiat_max} ${order.fiat_code}.`,
            action: 'detail'
          })
        }
      }
      const plat = String((order && order.platform) || 'mostro').toLowerCase()
      if (
        order.book_verified === false &&
        !this.settings.demo_mode &&
        (plat === 'robosats' || this.platformTratoSupports(order))
      ) {
        const label = this.platformLabel(order.platform)
        blockers.push({
          message:
            `This ${label} ad is on the relay but not confirmed live on ${label} right now. ` +
            'Open RoboSats to trade it there, or wait for the book to verify it.',
          action: 'external',
          platform: order.platform
        })
      }
      if (this.settings.demo_mode) {
        return blockers
      }
      if (plat === 'robosats') {
        const trading = this.health.trading || {}
        if (!trading.nwc_configured && !this.settings.has_nwc) {
          blockers.push({
            message:
              'Connect your Lightning wallet (NWC URI) in Settings for live RoboSats bonds.',
            tab: 'settings'
          })
        }
        if (!this.settings.mainnet_enabled) {
          blockers.push({
            message:
              'Mainnet is off. Turn on “Enable mainnet” in Settings for live RoboSats trades, or use Demo mode to practise.',
            tab: 'settings'
          })
        }
        return blockers
      }
      if (!this.settings.mainnet_enabled) {
        blockers.push({
          message:
            'Mainnet is off. Turn on “Enable mainnet” in Settings for live trades, or use Demo mode to practise.',
          tab: 'settings'
        })
      }
      if (this.health.escrow && !this.health.escrow.hold_invoices_supported) {
        blockers.push({
          message:
            'Your wallet cannot create escrow hold invoices yet. Use an LND-backed wallet, or stay in Demo mode.',
          tab: 'settings'
        })
      }
      const trading = this.health.trading || {}
      if (trading.live_take_enabled === false) {
        const blocker = (this.liveTradingBlockers || [])[0]
        blockers.push({
          message:
            blocker ||
            'Live trading needs mainnet plus LND hold invoices (Mostro) or NWC (RoboSats). Check Settings.',
          tab: 'settings'
        })
      }
      return blockers
    },
    canTakeOrder(order) {
      if (this.isPublicView) return false
      if (!this.platformTratoSupports(order)) return false
      if (
        order.book_verified === false &&
        !this.settings.demo_mode
      ) {
        return false
      }
      if (this.effectiveTakeSettlement(order) == null) return false
      if (!this.hasExplicitPaymentChoice(order)) return false
      if (order.is_range && !this.isDetailOpenForOrder(order)) return false
      return this.orderTakeBlockers(order).length === 0
    },
    openOrderFromBook(order) {
      if (!order) return
      if (!this.platformTratoSupports(order)) {
        this.explainTakeOrder(order)
        return
      }
      this.showOrder(order)
    },
    explainTakeOrder(order) {
      if (!order) return
      if (!this.platformTratoSupports(order)) {
        const plat = this.platformLabel(order.platform)
        const url = this.platformExternalUrl(order.platform)
        this.$q.dialog({
          title: `${plat} — not in Trato yet`,
          message:
            this.takeablePlatformsSummary() +
            ' ' +
            this.t('orderbook.platform_not_takeable', {platform: plat}),
          ok: url ? this.t('buttons.open_platform', {platform: plat}) : 'OK',
          cancel: url ? 'Close' : false,
          persistent: false
        }).onOk(() => {
          if (url) window.open(url, '_blank', 'noopener')
        })
        return
      }
      if (!this.canTakeOrder(order)) {
        const blockers = this.orderTakeBlockers(order)
        const openDetailPopup =
          (!blockers.length &&
            (this.effectiveTakeSettlement(order) == null ||
              !this.hasExplicitPaymentChoice(order))) ||
          (blockers.length > 0 && blockers.every(b => b.action === 'detail'))
        if (openDetailPopup) {
          this.showOrder(order)
          return
        }
        if (!blockers.length) {
          this.showOrder(order)
          return
        }
        const lines = blockers.map(b => `• ${b.message}`).join('\n')
        const first = blockers[0]
        const openExternal = first.action === 'external'
        this.$q.dialog({
          title: openExternal
            ? `${this.platformLabel(order.platform)} — use their app`
            : "Can't take this offer yet",
          message: lines,
          ok: openExternal
            ? `Open ${this.platformLabel(order.platform)}`
            : first.action === 'detail'
              ? 'Open offer'
              : 'Go to setup',
          cancel: 'Close'
        }).onOk(() => {
          if (first.action === 'external') {
            const url = this.platformExternalUrl(order.platform)
            if (url) window.open(url, '_blank', 'noopener')
            return
          }
          if (first.action === 'detail') {
            this.showOrder(order)
            return
          }
          if (first.tab) this.tab = first.tab
        })
        return
      }
      this.takeOrder(order)
    },
    isSepaFamilyType(type) {
      return ['sepa', 'sepa_instant', 'bank_transfer'].includes(type)
    },
    isUsernameAppType(type) {
      return ['strike', 'cash_app', 'venmo'].includes(type)
    },
    usernameFieldLabel(type) {
      const labels = {
        strike: 'Strike username',
        cash_app: 'Cash App $cashtag',
        venmo: 'Venmo @username'
      }
      return labels[type] || 'Username'
    },
    paymentTypeDescription(type) {
      const schema = this.effectivePaymentSchema[type]
      return (schema && schema.description) || ''
    },
    profileTypeLabel(type) {
      const schema = this.effectivePaymentSchema[type]
      return (schema && schema.label) || type
    },
    profileDisplayName(p) {
      if (!p) return '—'
      const nick = (p.label || '').trim()
      const typeLabel = this.profileTypeLabel(p.type)
      if (nick && nick.toLowerCase() !== typeLabel.toLowerCase()) {
        return `${typeLabel} · ${nick}`
      }
      return typeLabel
    },
    normalizeIban(iban) {
      return (iban || '').replace(/\s/g, '').toUpperCase()
    },
    statusColor(status) {
      const map = {
        pending: 'orange-7',
        'waiting-payment': 'blue-7',
        'waiting-buyer-invoice': 'blue-7',
        'fiat-sent': 'purple-7',
        active: 'teal-7',
        'in-progress': 'teal-7',
        success: 'green-7',
        canceled: 'grey-6',
        expired: 'grey-6',
        dispute: 'red-7'
      }
      return map[status] || 'grey-7'
    },
    copyText(text) {
      Quasar.copyToClipboard(text).then(() => {
        const isBook =
          text === this.publicBookUrl ||
          (text && String(text).includes('/trato/book'))
        this.$q.notify({
          message: isBook ? this.t('notify.browse_copied') : this.t('notify.copied'),
          color: 'positive',
          timeout: 800
        })
      })
    },
    openPublicBook() {
      window.open(this.publicBookUrl, '_blank', 'noopener,noreferrer')
    },
    parseDeepLinkOffer() {
      if (this.isPublicView) return null
      let params
      const hash = (window.location.hash || '').replace(/^#/, '').trim()
      if (hash && hash.includes('=')) {
        params = new URLSearchParams(hash)
      } else {
        params = new URLSearchParams(window.location.search)
      }
      const offerId = (params.get('offer') || '').trim()
      if (!offerId) return null
      return {
        id: offerId,
        op: (params.get('op') || '').trim() || null
      }
    },
    clearDeepLinkOffer() {
      const path = window.location.pathname
      if (window.location.hash) {
        window.history.replaceState({}, '', path + window.location.search)
        return
      }
      const params = new URLSearchParams(window.location.search)
      if (!params.has('offer')) return
      params.delete('offer')
      params.delete('op')
      const qs = params.toString()
      window.history.replaceState({}, '', qs ? `${path}?${qs}` : path)
    },
    tryOpenDeepLinkOffer(link) {
      if (!link || !link.id) return false
      const order = (this.orders || []).find(o => {
        if (o.id !== link.id) return false
        if (link.op && o.mostro_pubkey !== link.op) return false
        return true
      })
      if (!order) return false
      this.tab = 'book'
      this.showOrder(order)
      this.clearDeepLinkOffer()
      return true
    },
    warnDeepLinkOfferMissing() {
      if (this._deepLinkWarned) return
      const link = this.parseDeepLinkOffer()
      if (!link) return
      this._deepLinkWarned = true
      this.$q.notify({
        message:
          'That offer is no longer on the book — it may have been taken. Pick another from the list.',
        color: 'warning',
        timeout: 7000
      })
      this.clearDeepLinkOffer()
    },
    scheduleDeepLinkOffer() {
      const link = this.parseDeepLinkOffer()
      if (!link) return
      if (this.tryOpenDeepLinkOffer(link)) return
      const stop = this.$watch(
        () => this.orders,
        () => {
          if (this.tryOpenDeepLinkOffer(link)) stop()
        }
      )
      setTimeout(() => {
        stop()
        if (this.parseDeepLinkOffer()) this.warnDeepLinkOfferMissing()
      }, 8000)
    },
    onOrderbookSortChange(value) {
      const SORT = typeof window !== 'undefined' ? window.TratoOrderbookSort : null
      if (SORT && SORT.writeStored) SORT.writeStored(value)
    },
    loadOrderbook() {
      const gen = ++this._orderbookGen
      const hadOrders = this.orders.length > 0
      this.loading.orderbook = !hadOrders
      this.orderbookRefreshing = hadOrders
      const params = new URLSearchParams()
      if (this.filters.side) params.append('side', this.filters.side)
      if (this.filters.fiat) params.append('fiat', this.filters.fiat)
      if (this.filters.settlement) params.append('settlement', this.filters.settlement)
      if (this.settings.demo_mode) params.append('demo_seed', '1')
      LNbits.api
        .request('GET', `/trato/api/v1/orderbook?${params.toString()}`)
        .then(res => {
          if (gen !== this._orderbookGen) {
            return
          }
          this.orders = tratoApiPayload(res) || []
          this.loadErrors.orderbook = null
          if (!this.fiatOptionsFiltered.length) {
            this.fiatOptionsFiltered = this.fiatOptions
          }
          this.paymentFilterOptionsFiltered = this.paymentFilterOptions
          this.refreshOrderProfiles()
          this.loadOperatorPolicies()
          this.tryOpenDeepLinkOffer(this.parseDeepLinkOffer())
        })
        .catch(err => {
          if (gen !== this._orderbookGen) return
          this.loadErrors.orderbook = this.friendlyApiMessage(err)
          if (!hadOrders) this.notifyTratoError(err)
        })
        .finally(() => {
          if (gen !== this._orderbookGen) return
          this.loading.orderbook = false
          this.orderbookRefreshing = false
          this.refreshOppositeSideHint()
        })
      this.loadStats()
    },
    scheduleClientFilterRepaint() {
      this.clientFilterBusy = true
      if (this._clientFilterRaf) cancelAnimationFrame(this._clientFilterRaf)
      this._clientFilterRaf = requestAnimationFrame(() => {
        this._clientFilterRaf = null
        this._listClientFilters = {
          tratoOnly: this.filters.tratoOnly,
          matchMyPayments: this.filters.matchMyPayments,
          payment: this.filters.payment
        }
        this.clientFilterBusy = false
        this.refreshOppositeSideHint()
      })
    },
    refreshOppositeSideHint() {
      if (this.filters.side && this.visibleOrders.length === 0) {
        this.loadOppositeSideHint()
      } else {
        this.oppositeSideHint = null
      }
    },
    loadOppositeSideHint() {
      const side = this.filters.side
      if (!side) {
        this.oppositeSideHint = null
        return
      }
      const gen = ++this._oppositeHintGen
      const opposite = this.oppositeSide(side)
      const params = new URLSearchParams()
      params.append('side', opposite)
      if (this.filters.fiat) params.append('fiat', this.filters.fiat)
      if (this.filters.settlement) params.append('settlement', this.filters.settlement)
      if (this.settings.demo_mode) params.append('demo_seed', '1')
      LNbits.api
        .request('GET', `/trato/api/v1/orderbook?${params.toString()}`)
        .then(res => {
          if (gen !== this._oppositeHintGen) {
            return
          }
          let list = tratoApiPayload(res) || []
          const cf = this._listClientFilters
          if (cf.tratoOnly) {
            list = list.filter(o => this.platformTratoSupports(o))
          }
          if (cf.matchMyPayments && this.paymentDetailsForm.profiles.length) {
            list = list.filter(o => this.orderMatchesMyPayments(o))
          }
          if (cf.payment) {
            list = list.filter(o => this.orderMatchesPaymentFilter(o))
          }
          if (!list.length) {
            this.oppositeSideHint = null
            return
          }
          this.oppositeSideHint = {side: opposite, count: list.length}
        })
        .catch(() => {
          if (gen !== this._oppositeHintGen) return
          this.oppositeSideHint = null
        })
    },
    sectionEmptyMessage(section) {
      if (section.count > 0) return ''
      const hasOther = this.orderBookSections.some(
        s => s.key !== section.key && s.count > 0
      )
      if (this.filters.side) {
        return this.t('orderbook.no_section_filtered', {
          title: section.title.toLowerCase()
        })
      }
      if (hasOther) {
        return this.t('orderbook.no_section_other', {
          title: section.title.toLowerCase()
        })
      }
      if (
        this.filters.fiat ||
        this._listClientFilters.payment ||
        this.filters.settlement ||
        this._listClientFilters.tratoOnly ||
        this._listClientFilters.matchMyPayments
      ) {
        return this.t('orderbook.no_section_filtered', {
          title: section.title.toLowerCase()
        })
      }
      return this.t('orderbook.no_section_empty', {
        title: section.title.toLowerCase()
      })
    },
    loadOperatorPolicies() {
      const pubkeys = [
        ...new Set(
          (this.orders || [])
            .map(o => o.mostro_pubkey)
            .filter(Boolean)
        )
      ].slice(0, 25)
      if (!pubkeys.length) return
      LNbits.api
        .request('POST', '/trato/api/v1/operators/info', null, {pubkeys: pubkeys})
        .then(res => {
          this.operatorPolicies = {...this.operatorPolicies, ...(res.data || {})}
        })
        .catch(() => {})
    },
    operatorFeeFraction(order) {
      const pk = order && order.mostro_pubkey
      const info = pk && this.operatorPolicies[pk]
      if (info && info.fee_fraction != null) return Number(info.fee_fraction)
      return 0.006
    },
    layerLabel(order) {
      const layers = (order && order.layers) || [order.layer || 'lightning']
      if (layers.length > 1) return layers.map(this.settlementName).join(' + ')
      return this.settlementName(layers[0])
    },
    settlementName(layer) {
      return layer === 'onchain' ? 'On-chain' : 'Lightning'
    },
    isDetailOpenForOrder(order) {
      return Boolean(
        order &&
          this.detailDialog.show &&
          this.detailDialog.order &&
          this.detailDialog.order.id === order.id
      )
    },
    resolveTakeSettlement(order) {
      return this.effectiveTakeSettlement(order) || 'lightning'
    },
    orderPriceFactor(order) {
      const p = Number(order && order.premium) || 0
      return 1 - p / 100
    },
    orderUsesMarketPrice(order) {
      if (!order) return false
      if (order.is_market_price) return true
      return !(Number(order.amount_sats) > 0)
    },
    usesHostOperator(order) {
      const trading = this.health.trading || {}
      if (!trading.operator_mode_enabled) return false
      const hostPk = (trading.host_operator_pubkey || '').toLowerCase()
      const orderPk = (order && order.mostro_pubkey || '').toLowerCase()
      return Boolean(hostPk && orderPk && hostPk === orderPk)
    },
    hostFractionForOrder(order) {
      // Escrow % comes from the operator's kind-38385 fee (opFrac). An extra
      // instance markup would only apply here in a future Phase 4 product choice.
      if (!this.usesHostOperator(order)) return 0
      const trading = this.health.trading || {}
      const configured =
        trading.host_operator_fee_fraction != null
          ? Number(trading.host_operator_fee_fraction)
          : trading.host_operator_fee_percent
            ? Number(trading.host_operator_fee_percent) / 100
            : 0
      const opFrac = this.operatorFeeFraction(order)
      if (configured > 0 && Math.abs(configured - opFrac) > 1e-9) {
        return configured
      }
      return 0
    },
    fiatAmountInRange(order, amount) {
      if (!order || order.fiat_min == null || order.fiat_max == null) return true
      const v = Number(amount)
      if (isNaN(v)) return false
      return v >= Number(order.fiat_min) && v <= Number(order.fiat_max)
    },
    detailFiatRangeError(order) {
      if (!order || !order.is_range || !this.isDetailOpenForOrder(order)) return null
      const raw = this.detailDialog.takeFiatAmount
      if (raw == null || raw === '') {
        return `Enter an amount between ${order.fiat_min} and ${order.fiat_max} ${order.fiat_code}.`
      }
      const v = Number(raw)
      if (isNaN(v)) {
        return `Enter a valid number between ${order.fiat_min} and ${order.fiat_max} ${order.fiat_code}.`
      }
      if (!this.fiatAmountInRange(order, v)) {
        return `Must be between ${order.fiat_min} and ${order.fiat_max} ${order.fiat_code}.`
      }
      return null
    },
    estimateOrderBtcSats(order, opts) {
      opts = opts || {}
      if (!order) return null
      const fixed = Number(order.amount_sats) || 0
      if (fixed > 0 && !this.orderUsesMarketPrice(order)) {
        return fixed
      }
      let fiat = null
      if (order.is_range) {
        const onDetail = this.isDetailOpenForOrder(order)
        const raw = onDetail
          ? this.detailDialog.takeFiatAmount != null
            ? this.detailDialog.takeFiatAmount
            : order.fiat_min
          : order.fiat_min
        const v = Number(raw)
        fiat = isNaN(v) ? null : v
        if (fiat != null && !this.fiatAmountInRange(order, fiat)) fiat = null
      } else if (order.fiat_amount != null && order.fiat_amount !== '') {
        const v = Number(order.fiat_amount)
        fiat = isNaN(v) ? null : v
      }
      const code = (order.fiat_code || '').trim().toUpperCase()
      let rate = null
      if (
        opts.preferDetailQuote &&
        this.detailDialog.order &&
        this.detailDialog.order.id === order.id &&
        this.detailDialog.quoteSatsPerFiat
      ) {
        rate = this.detailDialog.quoteSatsPerFiat
      } else if (
        this.marketPrice.fiat_code === code &&
        this.marketPrice.sats_per_fiat
      ) {
        rate = this.marketPrice.sats_per_fiat
      }
      if (!fiat || !rate) return fixed > 0 ? fixed : null
      return Math.round(fiat * rate * this.orderPriceFactor(order))
    },
    detailChosenFiatAmount(order) {
      if (!order) return null
      if (order.is_range) {
        if (!this.isDetailOpenForOrder(order)) return null
        const v = Number(this.detailDialog.takeFiatAmount)
        if (isNaN(v) || !this.fiatAmountInRange(order, v)) return null
        return v
      }
      if (order.fiat_amount != null && order.fiat_amount !== '') {
        const v = Number(order.fiat_amount)
        return isNaN(v) ? null : v
      }
      return null
    },
    detailSatsEstimate(order) {
      return this.estimateOrderBtcSats(order, {preferDetailQuote: true})
    },
    detailFeeLine(order) {
      return this.tradeFeeBreakdown(
        order,
        this.userSideIfTake(order.kind),
        {context: 'detail'}
      ).headline
    },
    detailFundingNote() {
      const order = this.detailDialog.order
      const pm = order ? this.effectiveTakePaymentMethod(order) : null
      const plat = order ? this.platformLabel(order.platform) : 'Trato'
      if (this.settings.demo_mode) {
        const via = pm ? ` via ${pm}` : ''
        return {
          color: 'blue-1',
          textColor: 'blue-9',
          text:
            `Demo mode (${plat}): practice amounts below${via}. Escrow uses fake ` +
            'Lightning/on-chain strings — nothing is charged from your wallet.'
        }
      }
      const esc = this.health.escrow || {}
      if (!esc.hold_invoices_supported) {
        const src = esc.funding_source || 'this LNbits server'
        return {
          color: 'orange-1',
          textColor: 'orange-9',
          text:
            `Live escrow needs hold-invoice support on ${src} (LND-type funding). ` +
            'Turn on Demo mode to practise, or ask the host to use a real node.'
        }
      }
      const trading = this.health.trading || {}
      if (trading.live_take_enabled === false) {
        const blocker = (this.liveTradingBlockers || [])[0]
        return {
          color: 'orange-1',
          textColor: 'orange-9',
          text:
            blocker ||
            'Live trading needs mainnet plus LND hold invoices (Mostro) or NWC (RoboSats). ' +
            'Turn on Demo mode to practise, or complete setup in Settings.'
        }
      }
      return {
        color: 'green-1',
        textColor: 'green-9',
        text:
          'Live mode: escrow uses your LNbits identity wallet and the operator on the offer. ' +
          'Fee breakdown below shows operator %, routing, and your share.'
      }
    },
    loadDetailQuote(order) {
      if (!order) return
      const code = (order.fiat_code || '').trim().toUpperCase()
      if (!code) return
      if (!order.is_market_price && !order.is_range && order.amount_sats > 0) {
        return
      }
      this.detailDialog.quoteLoading = true
      this.detailDialog.quoteSatsPerFiat = null
      this.detailDialog.quoteBtcPrice = null
      LNbits.api
        .request('GET', `/trato/api/v1/price?fiat=${encodeURIComponent(code)}`)
        .then(res => {
          if (this.detailDialog.order && this.detailDialog.order.id === order.id) {
            this.detailDialog.quoteSatsPerFiat = res.data.sats_per_fiat
            this.detailDialog.quoteBtcPrice = res.data.btc_price
          }
        })
        .catch(() => {
          if (this.detailDialog.order && this.detailDialog.order.id === order.id) {
            this.detailDialog.quoteSatsPerFiat = null
            this.detailDialog.quoteBtcPrice = null
          }
        })
        .finally(() => {
          if (this.detailDialog.order && this.detailDialog.order.id === order.id) {
            this.detailDialog.quoteLoading = false
          }
        })
    },
    feeEstimateForOrder(order, userSide) {
      return {
        line: this.tradeFeeBreakdown(order, userSide, {context: 'detail'}).headline
      }
    },
    tradeFeeBreakdown(order, userSide, opts) {
      opts = opts || {}
      if (!order) return {detailItems: [], summary: {show: false}, items: [], headline: ''}
      const side =
        userSide ||
        (order.side
          ? order.side
          : order.kind
            ? this.userSideIfTake(order.kind)
            : 'buy')
      const trading = this.health.trading || {}
      const escrow = this.health.escrow || {}
      const demo = this.settings.demo_mode
      const premiumPct = Number(order.premium) || 0
      const premiumLabel = this.premiumLabel(premiumPct)
      const plat = String(order.platform || 'mostro').toLowerCase()
      let paymentMethod = null
      if (opts.context === 'detail') {
        paymentMethod = this.effectiveTakePaymentMethod(order)
      } else {
        paymentMethod = this.tradeChosenPaymentMethod(order) || null
      }
      let btcSats = Number(order.amount_sats) || 0
      let marketPrice = this.orderUsesMarketPrice(order)
      const preferDetailQuote = opts.context === 'detail'
      const est = this.estimateOrderBtcSats(order, {preferDetailQuote})
      if (est && est > 0) {
        btcSats = est
        marketPrice = false
      } else if (btcSats > 0) {
        marketPrice = false
      }
      const opFrac = this.operatorFeeFraction(order)
      const opEstimated = this.operatorFeeIsEstimate(order)
      const hostFrac = this.hostFractionForOrder(order)
      const hostOperatorTrade = this.usesHostOperator(order)
      const opFeeSats =
        marketPrice || btcSats <= 0
          ? null
          : Math.max(1, Math.round(btcSats * opFrac))
      const hostFeeSats =
        hostFrac > 0 && !marketPrice && btcSats > 0
          ? Math.max(1, Math.round(btcSats * hostFrac))
          : null
      const totalFeeSats =
        opFeeSats != null ? opFeeSats + (hostFeeSats || 0) : null
      const buyerShare =
        totalFeeSats != null ? Math.floor(totalFeeSats / 2) : null
      const sellerShare =
        totalFeeSats != null ? totalFeeSats - buyerShare : null
      const yourShare = side === 'buy' ? buyerShare : sellerShare
      let settlement = 'lightning'
      if (opts.context === 'detail' && order.kind) {
        settlement = this.effectiveTakeSettlement(order) || 'lightning'
      } else {
        try {
          const meta = JSON.parse(order.order_json || '{}')
          settlement = meta.settlement_layer || 'lightning'
        } catch (e) {
          settlement = 'lightning'
        }
      }
      const pct = n => (Math.round(n * 10000) / 100).toFixed(2)
      const satsVal = n => (n == null ? '—' : `~${this.formatSats(n)} sats`)
      const detailItems = []
      const premiumDetail =
        premiumPct !== 0
          ? premiumPct > 0
            ? 'Maker priced above spot — you get fewer sats per fiat unit than pure market.'
            : 'Maker priced below spot — you get more sats per fiat unit than pure market.'
          : null
      detailItems.push({
        label: 'Bitcoin amount',
        value: marketPrice ? 'Market at execution' : satsVal(btcSats),
        detail: marketPrice
          ? premiumDetail
            ? `Spot at take with ${premiumLabel} premium applied.`
            : 'Fixed from BTC/fiat price when you take and when escrow settles.'
          : premiumDetail
            ? `Includes ${premiumLabel} vs market.`
            : null
      })
      if (paymentMethod) {
        detailItems.push({
          label: 'Payment rail',
          value: paymentMethod,
          detail:
            plat === 'robosats'
              ? demo
                ? 'RoboSats coordinator and practice payment steps use this method — fees below are for the Bitcoin leg.'
                : 'RoboSats coordinator and your fiat rail — fees below are for the Bitcoin leg; taker bond is paid via NWC at take.'
              : 'Escrow fee % applies to the Bitcoin amount; this rail is how fiat/stable value moves off-platform.'
        })
      }
      const coordFeeLabel =
        plat === 'robosats' ? 'RoboSats coordinator fee' : 'Mostro operator fee'
      detailItems.push({
        label: coordFeeLabel,
        value: marketPrice
          ? `~${pct(opFrac)}% of BTC`
          : `${satsVal(opFeeSats)} (~${pct(opFrac)}%)`,
        detail:
          (opEstimated ? 'Estimated — operator has not published fee on relays. ' : '') +
          (hostOperatorTrade
            ? 'Your instance operator (mostrod) — same % as kind 38385 on relays. '
            : '') +
          (plat === 'robosats'
            ? 'Coordinator escrow fee — split 50/50 buyer & seller; deducted at release.'
            : 'Escrow coordinator (kind 38385). Split 50/50 buyer & seller; deducted at release, not a separate Lightning invoice.')
      })
      if (hostFrac > 0) {
        detailItems.push({
          label: 'Instance operator markup',
          value: marketPrice
            ? `~${pct(hostFrac)}% of BTC`
            : `${satsVal(hostFeeSats)} (~${pct(hostFrac)}%)`,
          detail:
            'Additional host markup on top of the published operator fee — split like escrow.'
        })
      } else if (hostOperatorTrade) {
        detailItems.push({
          label: 'Instance operator (mostrod)',
          value: 'Same as coordinator fee above',
          detail:
            'This trade uses your host\'s operator — no second escrow % stacked. ' +
            'Mostro dev fund % (if set) comes from the operator\'s cut.'
        })
      }
      if (plat === 'robosats') {
        detailItems.push({
          label: 'RoboSats taker bond',
          value: demo ? 'Simulated in demo' : 'Paid via NWC at take',
          detail:
            'Separate from escrow % — refundable commitment so the seller knows you are serious.'
        })
      }
      if (paymentMethod && this.isStablecoinPm(paymentMethod)) {
        detailItems.push({
          label: `${paymentMethod} transfer fee`,
          value: 'Not in escrow %',
          detail:
            'Network or Lightning fees for the stablecoin payment are separate — paid when you send to the seller.'
        })
      }
      if (settlement === 'lightning') {
        detailItems.push({
          label: 'Lightning routing',
          value: 'Not in operator %',
          detail:
            side === 'sell'
              ? 'Paid when you fund the hold invoice — on top of escrow sats.'
              : 'Usually minor on receive; seller pays routing when locking escrow.'
        })
      } else {
        detailItems.push({
          label: 'On-chain mining fee',
          value: 'Not in operator %',
          detail: 'Miner fee for the escrow UTXO — paid by whoever broadcasts; separate line item.'
        })
      }
      detailItems.push({
        label: 'Channel / liquidity',
        value: 'Not in operator %',
        detail: trading.operator_mode_enabled
          ? 'phoenixd/LSP inbound on the host node — operator overhead, not per-trade on this quote.'
          : 'Wallet or LSP channel opens are outside Mostro escrow %.'
      })
      detailItems.push({
        label: 'Funding',
        value: demo
          ? 'Demo (no charge)'
          : escrow.hold_invoices_supported
            ? escrow.funding_source || 'LNbits wallet'
            : 'Hold invoices unavailable',
        detail: demo
          ? 'Practice figures only — not billable.'
          : escrow.hold_invoices_supported
            ? 'Escrow via the Identity wallet on this LNbits instance.'
            : 'Ask host for LND-type funding or stay in demo.'
      })

      const fiatCode = (order.fiat_code || '').trim().toUpperCase()
      let fiatAmt = null
      if (opts.context === 'detail') {
        fiatAmt = this.detailChosenFiatAmount(order)
      } else if (order.fiat_amount != null && order.fiat_amount !== '') {
        const v = Number(order.fiat_amount)
        fiatAmt = isNaN(v) ? null : v
      }

      const feeShareValue = marketPrice
        ? `~${pct((opFrac + hostFrac) / 2)}% of BTC`
        : satsVal(yourShare)

      let totalBtcLabel = ''
      let totalBtcValue = ''
      let totalBtcDetail = ''
      if (side === 'buy') {
        totalBtcLabel = 'Net BTC to you (after fees)'
        if (!marketPrice && btcSats > 0 && yourShare != null) {
          totalBtcValue = satsVal(btcSats - yourShare)
          totalBtcDetail =
            `Gross ${satsVal(btcSats)} minus ${satsVal(yourShare)} fee share` +
            (premiumLabel ? ` · ${premiumLabel} vs market already in gross` : '') +
            '. Routing separate.'
        } else if (marketPrice) {
          totalBtcValue = `Market BTC − ~${pct((opFrac + hostFrac) / 2)}% fees`
          totalBtcDetail = premiumLabel
            ? `Firm sats at take from live price with ${premiumLabel} premium; fee share deducted at release.`
            : 'Firm sats fixed at take from live price; fee share deducted at release.'
        }
      } else {
        totalBtcLabel = 'BTC in escrow (incl. fee share)'
        if (!marketPrice && btcSats > 0 && yourShare != null) {
          totalBtcValue = satsVal(btcSats)
          totalBtcDetail =
            `Lock ${satsVal(btcSats)} now` +
            (premiumLabel ? ` (${premiumLabel} vs market in price)` : '') +
            `; ${satsVal(yourShare)} fee share at release. Add routing on hold invoice.`
        } else if (marketPrice) {
          totalBtcValue = `Market BTC + ~${pct((opFrac + hostFrac) / 2)}% fee at release`
          totalBtcDetail = premiumLabel
            ? `Firm lock at take with ${premiumLabel} premium; fee share deducted when Bitcoin releases to buyer.`
            : 'Firm lock at take; fee share deducted when Bitcoin releases to buyer.'
        }
      }

      const summary = {
        show: Boolean(fiatCode || feeShareValue || totalBtcValue || premiumLabel),
        side,
        fiat:
          fiatAmt != null && fiatCode
            ? {
                label: this.paymentSummaryLabel(side, paymentMethod, fiatCode),
                value: `${fiatAmt} ${fiatCode}`
              }
            : fiatCode
              ? {
                  label: this.paymentSummaryLabel(side, paymentMethod, fiatCode),
                  value: order.is_range
                    ? `${fiatCode} (pick amount in range)`
                    : `${fiatCode} (set at take)`
                }
              : paymentMethod
                ? {
                    label: this.paymentSummaryLabel(side, paymentMethod, ''),
                    value: paymentMethod
                  }
                : null,
        premium: premiumLabel
          ? {
              label: 'Price premium vs market',
              value: premiumLabel,
              detail: premiumDetail
            }
          : null,
        feeShare: {
          label: `Your fee share (${side === 'buy' ? 'buyer' : 'seller'})`,
          value: feeShareValue,
          detail: 'Your half of combined escrow fees — deducted at settlement.'
        },
        totalBtc: totalBtcValue
          ? {label: totalBtcLabel, value: totalBtcValue, detail: totalBtcDetail}
          : null
      }

      const headline = marketPrice
        ? `Operator ~${pct(opFrac + hostFrac)}% of BTC at execution (split buyer/seller)`
        : totalFeeSats != null
          ? `Escrow fees ~${this.formatSats(totalFeeSats)} sats total · your share ~${this.formatSats(yourShare)} sats`
          : ''
      return {
        detailItems,
        summary,
        items: detailItems,
        headline,
        side,
        marketPrice,
        btcSats,
        yourShare,
        totalFeeSats,
        settlement,
        premiumPct
      }
    },
    loadStats() {
      const params = new URLSearchParams()
      if (this.settings.demo_mode) params.append('demo_seed', '1')
      LNbits.api
        .request('GET', `/trato/api/v1/orderbook/stats?${params.toString()}`)
        .then(res => {
          this.stats = res.data
          this.loadErrors.stats = null
          this.fiatOptionsFiltered = this.fiatOptions
          this.paymentFilterOptionsFiltered = this.paymentFilterOptions
        })
        .catch(err => {
          this.loadErrors.stats = this.friendlyApiMessage(err)
        })
    },
    primeFiatFilterOptions() {
      this.fiatOptionsFiltered = this.fiatOptions
    },
    primePaymentFilterOptions() {
      this.paymentFilterOptionsFiltered = this.paymentFilterOptions
    },
    filterFiatOptions(val, update) {
      update(() => {
        const all = this.fiatOptions
        if (!val) {
          this.fiatOptionsFiltered = all
          return
        }
        const n = val.toLowerCase()
        this.fiatOptionsFiltered = all.filter(
          o =>
            o.label.toLowerCase().includes(n) ||
            o.value.toLowerCase().includes(n)
        )
      })
    },
    filterPaymentOptions(val, update) {
      update(() => {
        const all = this.paymentFilterOptions
        if (!val) {
          this.paymentFilterOptionsFiltered = all.slice()
          return
        }
        const n = val.toLowerCase()
        this.paymentFilterOptionsFiltered = all.filter(
          o =>
            o.label.toLowerCase().includes(n) ||
            o.value.toLowerCase().includes(n)
        )
      })
    },
    loadHealth() {
      if (!this.adminKey) return
      LNbits.api
        .request('GET', '/trato/api/v1/health', this.adminKey)
        .then(res => {
          this.health = res.data
          this.loadErrors.health = null
          if (!this.filters.fiat) {
            this.loadMarketPrice()
          }
        })
        .catch(err => {
          this.loadErrors.health = this.friendlyApiMessage(err)
        })
    },
    loadIdentity() {
      if (!this.adminKey) return
      LNbits.api
        .request('GET', '/trato/api/v1/identity', this.adminKey)
        .then(res => {
          this.identity = res.data
          this.loadErrors.identity = null
          if (this.identity) {
            this.loadPaymentDetails()
            this.loadIdentityReputation()
            this.loadIdentityNostrProfile()
          } else {
            this.identityReputation = null
            this.ensureIdentity()
          }
        })
        .catch(err => {
          this.loadErrors.identity = this.friendlyApiMessage(err)
        })
    },
    loadIdentityReputation() {
      if (!this.adminKey || !this.identity) return
      this.identityReputationLoading = true
      LNbits.api
        .request('GET', '/trato/api/v1/identity/reputation', this.adminKey)
        .then(res => {
          this.identityReputation = res.data
        })
        .catch(() => {
          this.identityReputation = null
        })
        .finally(() => {
          this.identityReputationLoading = false
        })
    },
    dismissOnboarding() {
      this.onboardingDismissed = true
      try {
        localStorage.setItem('trato_onboarding_dismissed', '1')
      } catch (e) {}
    },
    dismissSettingsHelp() {
      this.settingsHelpDismissed = true
      try {
        localStorage.setItem('trato_dismiss_settings_help', '1')
      } catch (e) {}
    },
    marketPriceFiatChain() {
      const chain = []
      const push = c => {
        const code = String(c || '').trim().toUpperCase()
        if (code && !chain.includes(code)) chain.push(code)
      }
      push(this.filters.fiat)
      const h = this.health || {}
      push(h.default_fiat_code)
      push(h.instance_fiat_code)
      push('USD')
      push('EUR')
      return chain
    },
    loadMarketPrice(startIdx = 0) {
      const chain = this.marketPriceFiatChain()
      const code = chain[startIdx]
      if (!code) {
        this.marketPrice.sats_per_fiat = null
        this.marketPrice.btc_price = null
        this.marketPrice.loading = false
        return
      }
      this.marketPrice.loading = true
      LNbits.api
        .request('GET', `/trato/api/v1/price?fiat=${encodeURIComponent(code)}`)
        .then(res => {
          this.marketPrice.fiat_code = res.data.fiat_code
          this.marketPrice.sats_per_fiat = res.data.sats_per_fiat
          this.marketPrice.btc_price = res.data.btc_price
          this.marketPrice.loading = false
        })
        .catch(() => {
          if (startIdx + 1 < chain.length) {
            this.loadMarketPrice(startIdx + 1)
          } else {
            this.marketPrice.sats_per_fiat = null
            this.marketPrice.btc_price = null
            this.marketPrice.loading = false
          }
        })
    },
    marketFiatCode() {
      const filtered = (this.filters.fiat || '').trim().toUpperCase()
      if (filtered) return filtered
      const fromHealth = this.health && this.health.default_fiat_code
      if (fromHealth) return String(fromHealth).toUpperCase()
      return 'USD'
    },
    marketPriceSourceHint() {
      if (this.filters.fiat) {
        return `BTC price for your Currency filter (${this.filters.fiat.toUpperCase()}).`
      }
      const h = this.health || {}
      if (h.default_fiat_code && h.instance_fiat_code &&
          h.default_fiat_code !== h.instance_fiat_code) {
        return (
          `BTC price in ${h.default_fiat_code} — from your Trato identity wallet. ` +
          `This LNbits instance default is ${h.instance_fiat_code}. ` +
          'Pick a currency in the filter to override.'
        )
      }
      if (h.default_fiat_code) {
        return this.t('market_hint.wallet', {fiat: h.default_fiat_code})
      }
      return this.t('market_hint.default')
    },
    formatMarketBtc() {
      return this.formatLocaleInteger(this.marketPrice.btc_price)
    },
    goOnboardingStep(step) {
      if (step === 1) this.tab = 'identity'
      else if (step === 2) this.tab = 'book'
      else this.tab = 'trades'
    },
    actionLabel(action) {
      const map = {
        'take-buy': this.t('actions.take_buy'),
        'take-sell': this.t('actions.take_sell'),
        'pay-invoice': this.t('actions.pay_invoice'),
        'hold-invoice-payment-accepted': this.t('actions.hold_accepted'),
        'add-invoice': this.t('actions.add_invoice'),
        'buyer-invoice-accepted': this.t('actions.buyer_invoice_accepted'),
        'fiat-sent': this.t('actions.fiat_sent'),
        release: this.t('actions.release'),
        cancel: this.t('actions.cancel'),
        dispute: this.t('actions.dispute'),
        take: this.t('actions.take'),
        rate: this.t('actions.rate'),
        'rate-received': this.t('actions.rate_received')
      }
      return map[action] || String(action || '').replace(/-/g, ' ')
    },
    eventIsSent(e) {
      if (!e) return false
      // Your chat + your actions → right. Partner chat + operator steps → left.
      if (e.direction === 'out') return true
      if (e.direction === 'chat') return true
      return false
    },
    eventSenderName(e) {
      if (!e) return ''
      if (e.direction === 'out' || e.direction === 'chat') return this.t('events.you')
      if (e.direction === 'in' && e.kind === 'chat') return this.t('events.partner')
      if (e.direction === 'in') return this.t('events.mostro')
      return ''
    },
    eventStamp(e) {
      if (!e) return ''
      return `${this.formatDate(e.created_at)} · ${this.eventSenderName(e)}`
    },
    eventText(e) {
      if (e.kind === 'chat' || e.kind === 'note') return e.payload || ''
      if (e.direction === 'in' || e.direction === 'out') {
        try {
          const msg = JSON.parse(e.payload)
          const action = msg.action
          if (action === 'rate-received') {
            const stars = msg.payload && msg.payload.rating_user
            return stars
              ? this.t('events.rated_you', {stars})
              : this.t('events.rated_you_short')
          }
          if (action === 'rate') return this.t('events.can_rate')
          if (action) return this.actionLabel(action)
        } catch (err) {
          /* plain text payload */
        }
      }
      return (e.kind || '').replace(/-/g, ' ')
    },
    loadRobosatsCoordinators() {
      if (!this.adminKey) return
      LNbits.api
        .request('GET', '/trato/api/v1/robosats/coordinators', this.adminKey)
        .then(res => {
          const aliases = (res.data && res.data.aliases) || []
          this.robosatsCoordinatorOptions = aliases.map(a => ({
            label: a,
            value: a
          }))
        })
        .catch(() => {})
    },
    loadSettings() {
      if (!this.adminKey) return
      LNbits.api
        .request('GET', '/trato/api/v1/settings', this.adminKey)
        .then(res => {
          const data = tratoApiPayload(res)
          if (!data || typeof data !== 'object') {
            return
          }
          this.settings = {...this.settings, ...data}
          this.loadErrors.settings = null
          this.settingsForm = {
            relaysText: (data.relays || []).join('\n'),
            mostro_pubkey: data.mostro_pubkey || '',
            demo_mode: data.demo_mode,
            mainnet_enabled: data.mainnet_enabled,
            nwc_uri: '',
            clear_nwc: false,
            robosats_coordinator: data.robosats_coordinator || null
          }
          this.loadRobosatsCoordinators()
          if (this.tab === 'book') this.loadOrderbook()
        })
        .catch(err => {
          this.loadErrors.settings = this.friendlyApiMessage(err)
        })
    },
    loadMyOrders() {
      if (!this.adminKey) return
      LNbits.api
        .request('GET', '/trato/api/v1/orders', this.adminKey)
        .then(res => {
          this.myOrders = res.data
          const keys = res.data
            .map(o => this.orderPartnerPubkey(o))
            .filter(Boolean)
          this.ensureNostrProfiles(keys)
        })
        .catch(() => {})
    },
    ensureIdentity() {
      if (this.identity || this.loading.identity || !this.adminKey) return
      if (!this.newIdentity.wallet) return
      this.createIdentity(true)
    },
    createIdentity(silent) {
      this.loading.identity = true
      LNbits.api
        .request('POST', '/trato/api/v1/identity', this.adminKey, {
          wallet: this.newIdentity.wallet
        })
        .then(res => {
          this.identity = res.data
          this.loadPaymentDetails()
          if (!silent) {
            this.$q.notify({
              message: 'Trader profile ready',
              color: 'positive'
            })
          }
          this.loadIdentityReputation()
        })
        .catch(err => {
          if (!silent) this.notifyTratoError(err)
        })
        .finally(() => {
          this.loading.identity = false
        })
    },
    saveSettings() {
      this.loading.settings = true
      const relays = this.settingsForm.relaysText
        .split('\n')
        .map(r => r.trim())
        .filter(r => r)
      LNbits.api
        .request('PUT', '/trato/api/v1/settings', this.adminKey, {
          relays: relays,
          mostro_pubkey: this.settingsForm.mostro_pubkey,
          demo_mode: this.settingsForm.demo_mode,
          mainnet_enabled: this.settingsForm.mainnet_enabled,
          nwc_uri: this.settingsForm.nwc_uri || null,
          clear_nwc: this.settingsForm.clear_nwc,
          robosats_coordinator: this.settingsForm.robosats_coordinator
        })
        .then(res => {
          const data = tratoApiPayload(res)
          if (!data || typeof data !== 'object') {
            return
          }
          this.settings = {...this.settings, ...data}
          this.settingsForm.nwc_uri = ''
          this.settingsForm.clear_nwc = false
          const modeLabel = data.demo_mode ? 'Demo' : 'Live'
          this.$q.notify({
            message: `${modeLabel} mode saved — My trades shows ${modeLabel.toLowerCase()} orders only`,
            color: 'positive'
          })
          this.loadHealth()
          this.loadMyOrders()
          if (
            this.tradeDialog.show &&
            this.tradeDialog.order &&
            this.tradeDialog.order.demo !== data.demo_mode
          ) {
            this.tradeDialog.show = false
            this.stopTradePoll()
          }
        })
        .catch(err => this.notifyTratoError(err))
        .finally(() => {
          this.loading.settings = false
        })
    },
    openCreate() {
      this.createDialog.show = true
      if (!this.currencyOptions.length) this.fetchCurrencies()
      this.fetchRate()
      if (
        this.paymentDetailsForm.methodNames.length &&
        !(this.createDialog.data.payment_methods || []).length
      ) {
        this.createDialog.data.payment_methods =
          this.paymentDetailsForm.methodNames.filter(m =>
            this.paymentMethodOptions.includes(m)
          )
      }
    },
    fetchCurrencies() {
      LNbits.api
        .request('GET', '/trato/api/v1/currencies')
        .then(res => {
          this._allCurrencies = res.data || []
          this.currencyOptions = this._allCurrencies.slice(0, 30)
        })
        .catch(() => {})
    },
    filterCurrencies(val, update) {
      update(() => {
        const all = this._allCurrencies || []
        if (!val) {
          this.currencyOptions = all.slice(0, 30)
        } else {
          const needle = val.toUpperCase()
          this.currencyOptions = all
            .filter(c => c.toUpperCase().indexOf(needle) > -1)
            .slice(0, 30)
        }
      })
    },
    filterPaymentMethods(val, update) {
      update(() => {
        if (!val) {
          this.paymentMethodChoices = this.paymentMethodOptions.slice()
        } else {
          const needle = val.toLowerCase()
          this.paymentMethodChoices = this.paymentMethodOptions.filter(
            m => m.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    },
    fetchRate() {
      const code = (this.createDialog.data.fiat_code || '').trim().toUpperCase()
      if (!code) return
      this.createDialog.rate = null
      this.createDialog.rateLoading = true
      LNbits.api
        .request('GET', `/trato/api/v1/price?fiat=${encodeURIComponent(code)}`)
        .then(res => {
          this.createDialog.rate = res.data.sats_per_fiat
          this.createDialog.btcPrice = res.data.btc_price
          this.recalcFromFiat()
        })
        .catch(() => {
          this.createDialog.rate = null
        })
        .finally(() => {
          this.createDialog.rateLoading = false
        })
    },
    priceFactor() {
      // Premium shifts the rate vs market: +% means fewer sats per fiat unit
      // (the maker values their sats higher). Overwritable by the user.
      const p = Number(this.createDialog.data.premium) || 0
      return 1 - p / 100
    },
    estimatedSats() {
      const d = this.createDialog
      const fa = Number(d.data.fiat_amount)
      if (!d.rate || !fa) return null
      return Math.round(fa * d.rate * this.priceFactor())
    },
    recalcFromFiat() {
      if (this.createDialog.data.is_market) return
      const est = this.estimatedSats()
      if (est !== null) this.createDialog.data.amount_sats = est
    },
    recalcFromSats() {
      const d = this.createDialog
      const sats = Number(d.data.amount_sats)
      if (!d.rate || !sats) return
      const factor = this.priceFactor() || 1
      d.data.fiat_amount = Math.round((sats / d.rate / factor) * 100) / 100
    },
    submitCreate() {
      const d = this.createDialog.data
      if (!d.fiat_amount || d.fiat_amount <= 0) {
        this.$q.notify({message: this.t('notify.enter_fiat'), color: 'warning'})
        return
      }
      if (!d.is_market && (!d.amount_sats || d.amount_sats <= 0)) {
        this.$q.notify({message: this.t('notify.enter_sats'), color: 'warning'})
        return
      }
      this.loading.create = true
      const payload = {
        side: d.side,
        fiat_code: (d.fiat_code || '').toUpperCase(),
        fiat_amount: d.fiat_amount,
        payment_method: (d.payment_methods || []).join(', '),
        amount_sats: d.is_market ? 0 : Math.round(d.amount_sats),
        premium: Number(d.premium) || 0,
        settlement_layers: d.settlement_layers || ['lightning']
      }
      LNbits.api
        .request('POST', '/trato/api/v1/orders', this.adminKey, payload)
        .then(res => {
          this.createDialog.show = false
          this.beginTradeFlow(res.data, {
            message: 'Order created — continue in your trade'
          })
        })
        .catch(err => this.notifyTratoError(err))
        .finally(() => {
          this.loading.create = false
        })
    },
    cancelOrder(t) {
      this.$q
        .dialog({
          title: 'Cancel this order?',
          message:
            'This removes your open order before anyone takes it. ' +
            'No funds are involved and nothing is at risk.',
          cancel: true,
          ok: {label: 'Cancel order', color: 'negative', noCaps: true},
          persistent: true
        })
        .onOk(() => {
          LNbits.api
            .request(
              'POST',
              `/trato/api/v1/orders/${t.id}/action`,
              this.adminKey,
              {action: 'cancel'}
            )
            .then(() => {
              this.$q.notify({message: 'Order canceled', color: 'positive'})
              this.loadMyOrders()
            })
            .catch(err => this.notifyTratoError(err))
        })
    },
    isDeletableOrder(order) {
      const s = String((order && order.status) || '').toLowerCase()
      return (
        s === 'canceled' ||
        s === 'cancelled' ||
        s === 'cooperatively-canceled' ||
        s === 'expired'
      )
    },
    deleteOrder(t) {
      this.$q
        .dialog({
          title: 'Remove from history?',
          message:
            'This permanently deletes this canceled trade from your list. ' +
            'It does not affect the public order book.',
          cancel: true,
          ok: {label: 'Delete', color: 'negative', noCaps: true}
        })
        .onOk(() => {
          LNbits.api
            .request('DELETE', `/trato/api/v1/orders/${t.id}`, this.adminKey)
            .then(() => {
              this.$q.notify({message: 'Trade removed', color: 'positive'})
              this.loadMyOrders()
            })
            .catch(err => this.notifyTratoError(err))
        })
    },
    exportTradesForTaxes() {
      if (!this.adminKey) {
        this.$q.notify({
          message: 'Log in to LNbits on this server first.',
          color: 'warning'
        })
        return
      }
      this.loading.taxExport = true
      LNbits.api
        .request(
          'GET',
          '/trato/api/v1/orders/export?format=csv',
          this.adminKey,
          null,
          {responseType: 'blob'}
        )
        .then(res => {
          const mode = this.settings.demo_mode ? 'demo' : 'live'
          const blob = new Blob([res.data], {type: 'text/csv;charset=utf-8'})
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `trato-trades-${mode}.csv`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
          this.$q.notify({
            message: 'Tax export downloaded',
            color: 'positive'
          })
        })
        .catch(err => this.notifyTratoError(err))
        .finally(() => {
          this.loading.taxExport = false
        })
    },
    purgeAllDemoOrders() {
      if (!this.settings.demo_mode) {
        this.$q.notify({
          message:
            'This only works in Demo mode — turn it on in Settings to clear practice trades.',
          color: 'warning'
        })
        return
      }
      const n = this.visibleMyOrders.length
      if (!n) {
        this.$q.notify({message: 'No demo trades to clear', color: 'info'})
        return
      }
      if (!this.adminKey) {
        this.$q.notify({
          message: 'Log in to LNbits on this server first.',
          color: 'warning'
        })
        return
      }
      this.$q
        .dialog({
          title: `Delete all ${n} demo trade${n === 1 ? '' : 's'}?`,
          message:
            'Removes every practice trade from your list (active, finished, and canceled). ' +
            'This cannot be undone. Live trades are never affected.',
          cancel: {label: 'Cancel', flat: true, noCaps: true},
          persistent: true,
          ok: {label: 'Delete all', color: 'negative', noCaps: true}
        })
        .onOk(() => {
          this.executeClearAllDemoOrders()
        })
    },
    executeClearAllDemoOrders() {
      if (!this.adminKey) return
      const dismiss = this.$q.loading.show({message: 'Clearing demo trades…'})
      const endpoints = [
        ['DELETE', '/trato/api/v1/orders/clear-demo'],
        ['POST', '/trato/api/v1/orders/clear-demo'],
        ['DELETE', '/trato/api/v1/orders/demo'],
        ['POST', '/trato/api/v1/orders/demo']
      ]
      const attempt = (i) => {
        if (i >= endpoints.length) {
          return Promise.reject(new Error('no_clear_endpoint'))
        }
        const [method, url] = endpoints[i]
        return LNbits.api.request(method, url, this.adminKey).catch(err => {
          const status = err && err.response && err.response.status
          const detail = String(
            (err && err.response && err.response.data && err.response.data.detail) || ''
          )
          const staleWildcard =
            status === 404 &&
            detail.toLowerCase().includes('order not found') &&
            url.includes('/orders/demo')
          if (status === 404 || status === 405 || staleWildcard) {
            return attempt(i + 1)
          }
          throw err
        })
      }
      attempt(0)
        .then(res => {
          const removed = (res.data && res.data.removed) || 0
          this.onTradeDialogHide()
          this.tradeDialog.show = false
          this.tradeDialog.order = null
          this.myOrders = []
          this.$q.notify({
            message:
              removed > 0
                ? `Removed ${removed} demo trade${removed === 1 ? '' : 's'}`
                : 'No demo trades were in the database — list refreshed',
            color: removed > 0 ? 'positive' : 'info'
          })
          this.loadMyOrders()
          this.loadHealth()
        })
        .catch(err => {
          if (err && err.message === 'no_clear_endpoint') {
            this.$q.notify({
              message:
                'Clear demo trades failed — restart LNbits so the Trato extension reloads, then try again.',
              color: 'negative',
              timeout: 6000
            })
            return
          }
          this.notifyTratoError(err)
        })
        .finally(() => {
          dismiss()
        })
    },
    roleLabel(role) {
      return role === 'maker' ? 'You created' : 'You took'
    },
    loadPaymentSchema() {
      LNbits.api
        .request('GET', '/trato/api/v1/payment-schema')
        .then(res => {
          if (res.data.schema && Object.keys(res.data.schema).length) {
            this.paymentDetailsForm.schema = res.data.schema
          }
          this.paymentDetailsForm.countryNames = res.data.country_names || {}
          this.paymentDetailsForm.sepaCountries = res.data.sepa_countries || []
          this.paymentDetailsForm.mobileMoneyCountries =
            res.data.mobile_money_countries || []
          this.paymentDetailsForm.mapCenters = res.data.map_centers || {}
        })
        .catch(() => {})
    },
    loadPaymentDetails() {
      if (!this.adminKey || !this.identity) return
      LNbits.api
        .request('GET', '/trato/api/v1/identity/payment-details', this.adminKey)
        .then(res => {
          this.paymentDetailsForm.profiles = res.data.profiles || []
          if (res.data.schema && Object.keys(res.data.schema).length) {
            this.paymentDetailsForm.schema = res.data.schema
          }
          this.paymentDetailsForm.methodNames = res.data.method_names || []
          this.paymentDetailsForm.countryNames = res.data.country_names || {}
          this.paymentDetailsForm.sepaCountries = res.data.sepa_countries || []
          this.paymentDetailsForm.mobileMoneyCountries =
            res.data.mobile_money_countries || []
          this.paymentDetailsForm.mapCenters = res.data.map_centers || {}
          this.paymentDetailsForm.lnurlpReceive = res.data.lnurlp_receive || null
          this.paymentDetailsForm.lightningReceiveChoices =
            res.data.lightning_receive_choices || []
          this.paymentDetailsForm.nostrLud16 = res.data.nostr_lud16 || null
        })
        .catch(() => {})
    },
    applyLightningReceiveChoice(choice) {
      const address =
        (choice && choice.lightning_address) || (typeof choice === 'string' ? choice : '')
      if (!address) return
      this.paymentDetailsForm.editor.draft.lightning_address = address
      const label = (choice && choice.source_label) || 'Lightning address'
      this.$q.notify({
        message: `Using ${address} (${label})`,
        color: 'positive'
      })
    },
    applyLnurlpAddress(address) {
      this.applyLightningReceiveChoice({lightning_address: address, source_label: 'LNURLp'})
    },
    profileFields(type) {
      const schema = this.effectivePaymentSchema
      if (type === 'cash_in_person') {
        return (
          (schema[type] && schema[type].fields) || [
            'place_label',
            'country',
            'map_url',
            'timezone',
            'notes'
          ]
        )
      }
      const fields = schema[type] && schema[type].fields
      if (fields && fields.length) return fields
      const fallback = TRATO_DEFAULT_PAYMENT_SCHEMA[type]
      if (fallback && fallback.fields) return fallback.fields
      return ['account_name', 'notes']
    },
    paymentFieldLabel(field) {
      const labels = {
        account_name: 'Account name',
        iban: 'IBAN',
        bic: 'BIC / SWIFT',
        bank_name: 'Bank name',
        account_number: 'Account number',
        email: 'Email',
        username: 'Username',
        phone: 'Phone',
        notes: 'Notes',
        reference_hint: 'Default payment reference',
        payment_link: 'PayPal payment link (optional, goods & services)',
        country: 'Country (ISO code, e.g. DE)',
        place_label: 'Meeting place (e.g. Hauptbahnhof north exit)',
        map_url: 'OpenStreetMap link',
        lat: 'Latitude',
        lon: 'Longitude',
        timezone: 'Timezone (e.g. Europe/Berlin)',
        till_number: 'Till number (optional)',
        paybill: 'Paybill number (optional)',
        provider: 'Provider (e.g. Airtel Money)'
      }
      return labels[field] || field
    },
    blankProfile(type) {
      return {
        type: type || 'sepa',
        label: '',
        account_name: '',
        iban: '',
        bic: '',
        bank_name: '',
        account_number: '',
        email: '',
        username: '',
        phone: '',
        till_number: '',
        paybill: '',
        provider: '',
        notes: '',
        reference_hint: '',
        payment_link: '',
        country: '',
        place_label: '',
        lat: '',
        lon: '',
        map_url: '',
        timezone: '',
        lightning_address: '',
        btc_address: ''
      }
    },
    isBitcoinReceiveType(type) {
      return TRATO_BITCOIN_RECEIVE_TYPES.has(type)
    },
    countryOptionsForEditor() {
      const names =
        Object.keys(this.paymentDetailsForm.countryNames || {}).length > 0
          ? this.paymentDetailsForm.countryNames
          : TRATO_DEFAULT_COUNTRY_NAMES
      const draftType = this.paymentDetailsForm.editor.draft.type
      const mobileTypes = new Set(['mpesa', 'mobile_money'])
      const codes =
        mobileTypes.has(draftType)
          ? (this.paymentDetailsForm.mobileMoneyCountries || []).length > 0
            ? this.paymentDetailsForm.mobileMoneyCountries
            : TRATO_DEFAULT_MOBILE_MONEY_COUNTRIES
          : (this.paymentDetailsForm.sepaCountries || []).length > 0
            ? this.paymentDetailsForm.sepaCountries
            : TRATO_DEFAULT_SEPA_COUNTRIES
      return [...codes]
        .sort()
        .map(c => ({label: (names[c] ? names[c] + ' — ' : '') + c, value: c}))
    },
    inferCountryFromIban(iban) {
      const code = (iban || '').replace(/\s/g, '').toUpperCase().slice(0, 2)
      return /^[A-Z]{2}$/.test(code) ? code : ''
    },
    onProfileIbanChange() {
      const d = this.paymentDetailsForm.editor.draft
      if (!d.iban) return
      const inferred = this.inferCountryFromIban(d.iban)
      if (!inferred) return
      // Auto-fill from IBAN prefix (ISO country code) when empty or still matching old IBAN.
      if (!d.country || d.country === d._ibanCountryHint) {
        d.country = inferred
      }
      d._ibanCountryHint = inferred
    },
    orderMatchesMyPayments(order) {
      const pms = order.payment_methods || []
      if (!pms.length) return false
      return pms.some(pm =>
        this.paymentDetailsForm.profiles.some(p => this.profileMatchesPm(p, pm))
      )
    },
    orderMatchesPaymentFilter(order) {
      const needle = (this.filters.payment || '').trim().toLowerCase()
      if (!needle) return true
      return this.expandPaymentMethods(order.payment_methods).some(pm => {
        const hay = pm.toLowerCase()
        return hay === needle || hay.includes(needle)
      })
    },
    profileMatchesPm(profile, pm) {
      const ptype = profile.type
      const s = (pm || '').toLowerCase()
      const compact = s.replace(/[\s\-_]/g, '')
      if (ptype === 'sepa_instant') {
        return s.includes('instant') && s.includes('sepa')
      }
      if (ptype === 'sepa' || ptype === 'bank_transfer') {
        if (s.includes('instant')) return false
        return s.includes('sepa') || s.includes('bank transfer')
      }
      if (ptype === 'cash_in_person') {
        return s.includes('cash') || s.includes('person') || s.includes('face')
      }
      if (ptype === 'cash_by_mail') {
        return s.includes('mail')
      }
      if (ptype === 'mpesa') {
        return compact.includes('mpesa') || s.includes('mobile money')
      }
      if (ptype === 'mobile_money') {
        return (
          s.includes('mobile money') ||
          s.includes('airtel') ||
          s.includes('mtn') ||
          s.includes('orange money')
        )
      }
      if (this.isStablecoinPm(pm)) {
        return (
          ptype === 'usdt' ||
          ptype === 'usdc' ||
          ptype === 'stablecoin' ||
          this.isStablecoinPm(profile.label || '')
        )
      }
      const schema = this.effectivePaymentSchema[ptype] || {}
      const label = (
        schema.method_name ||
        profile.label ||
        ptype ||
        ''
      ).toLowerCase()
      return label && s.includes(label)
    },
    expandPaymentMethods(pms) {
      const out = []
      for (const pm of pms || []) {
        const s = String(pm || '').trim()
        if (!s) continue
        if (s.length > 36 && /[-–—|,]/.test(s)) {
          for (const part of s.split(/\s*[-–—|,]\s*/)) {
            const t = part.trim()
            if (t) out.push(t)
          }
        } else {
          out.push(s)
        }
      }
      return out
    },
    paymentMethodsDisplay(order, limit = 4) {
      return this.expandPaymentMethods(order.payment_methods).slice(0, limit)
    },
    paymentMethodsMoreCount(order, limit = 4) {
      const n = this.expandPaymentMethods(order.payment_methods).length
      return n > limit ? n - limit : 0
    },
    paymentMethodsFullLabel(order) {
      return this.expandPaymentMethods(order.payment_methods).join(' · ')
    },
    paymentMethodMatchesMine(pm) {
      if (!this.paymentDetailsForm.profiles.length) return false
      return this.paymentDetailsForm.profiles.some(p => this.profileMatchesPm(p, pm))
    },
    matchingPaymentLabels(order) {
      const pms = order.payment_methods || []
      const hits = []
      for (const p of this.paymentDetailsForm.profiles) {
        for (const pm of pms) {
          if (this.profileMatchesPm(p, pm)) {
            const cc = p.country ? ` (${p.country})` : ''
            hits.push(this.profileDisplayName(p) + cc)
          }
        }
      }
      return [...new Set(hits)]
    },
    openOsmPickerForMeetup() {
      const d = this.paymentDetailsForm.editor.draft
      const centers = this.paymentDetailsForm.mapCenters || {}
      const code = (d.country || '').toUpperCase()
      let url
      if (d.map_url && d.map_url.includes('openstreetmap')) {
        url = d.map_url
      } else if (d.lat && d.lon) {
        url = `https://www.openstreetmap.org/#map=15/${d.lat}/${d.lon}`
      } else if (code && centers[code]) {
        const c = centers[code]
        url = `https://www.openstreetmap.org/#map=${c.zoom}/${c.lat}/${c.lon}`
      } else {
        url = 'https://www.openstreetmap.org/#map=5/50.0/10.0'
      }
      if (!d.map_url) d.map_url = url
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    meetupAtUnix() {
      const raw = (this.tradeDialog.meetupAtLocal || '').trim()
      if (!raw) return null
      const ms = Date.parse(raw)
      if (isNaN(ms)) return null
      return Math.floor(ms / 1000)
    },
    formatMeetupLocal(ts) {
      if (!ts) return ''
      try {
        return new Date(ts * 1000).toLocaleString()
      } catch (e) {
        return ''
      }
    },
    profileSummaryLine(p) {
      if (!p) return '—'
      if (p.type === 'cash_in_person') {
        const bits = [p.place_label, p.country]
        if (p.map_url) bits.push('map link')
        else if (p.lat && p.lon) bits.push('map set')
        return bits.filter(Boolean).join(' · ') || 'Meetup spot'
      }
      if (this.isSepaFamilyType(p.type)) {
        const iban = this.normalizeIban(p.iban)
        const tail = iban.length > 4 ? `···${iban.slice(-4)}` : iban
        return [p.account_name, tail].filter(Boolean).join(' · ') || '—'
      }
      if (p.type === 'lightning_address' && p.lightning_address) {
        return p.lightning_address
      }
      if (p.type === 'onchain_btc' && p.btc_address) {
        const addr = p.btc_address
        return addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
      }
      if (p.type === 'nwc_wallet') {
        return this.settings && this.settings.has_nwc
          ? 'NWC connected in Settings'
          : 'NWC — connect in Settings'
      }
      return p.account_name || p.email || p.username || p.phone || p.provider || '—'
    },
    upsertSepaInstantProfile(profiles, sepaEntry) {
      const iban = this.normalizeIban(sepaEntry.iban)
      if (!iban) return profiles
      const next = [...profiles]
      const idx = next.findIndex(
        p =>
          p.type === 'sepa_instant' && this.normalizeIban(p.iban) === iban
      )
      const schema = this.effectivePaymentSchema.sepa_instant || {}
      const instant = {
        ...sepaEntry,
        type: 'sepa_instant',
        id: idx >= 0 ? next[idx].id : `sepa_instant-${Date.now()}`,
        label: sepaEntry.label || schema.label || 'SEPA Instant'
      }
      if (idx >= 0) next[idx] = instant
      else next.push(instant)
      return next
    },
    bankProfileHasRequiredFields(d) {
      if (this.isSepaFamilyType(d.type)) {
        return Boolean((d.account_name || '').trim() && (d.iban || '').trim())
      }
      if (d.type === 'paypal') {
        return Boolean((d.email || '').trim() && d.email.includes('@'))
      }
      if (d.type === 'revolut') {
        return Boolean((d.username || '').trim() || (d.phone || '').trim())
      }
      if (d.type === 'wise') {
        return Boolean((d.email || '').trim() || (d.username || '').trim())
      }
      if (d.type === 'bizum') {
        return Boolean((d.phone || '').trim())
      }
      if (d.type === 'mpesa') {
        return Boolean(
          (d.phone || '').trim() ||
            (d.till_number || '').trim() ||
            (d.paybill || '').trim()
        )
      }
      if (d.type === 'mobile_money') {
        return Boolean((d.phone || '').trim())
      }
      if (d.type === 'cash_in_person') {
        return Boolean(
          (d.place_label || '').trim() || (d.map_url || '').trim()
        )
      }
      if (this.isUsernameAppType(d.type)) {
        return Boolean((d.username || '').trim())
      }
      if (d.type === 'zelle') {
        return Boolean((d.email || '').trim() || (d.phone || '').trim())
      }
      if (d.type === 'cash_by_mail') {
        return Boolean((d.account_name || '').trim())
      }
      if (d.type === 'lightning_address') {
        return Boolean((d.lightning_address || '').trim())
      }
      if (d.type === 'onchain_btc') {
        return Boolean((d.btc_address || '').trim().length >= 14)
      }
      if (d.type === 'nwc_wallet') {
        return Boolean((d.account_name || '').trim() || (d.notes || '').trim())
      }
      return Boolean(
        (d.account_name || '').trim() || (d.notes || '').trim()
      )
    },
    guessMeetupTimezone() {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (tz) this.paymentDetailsForm.editor.draft.timezone = tz
      } catch (e) {}
    },
    onBankProfileTypeChange(type) {
      if (type === 'cash_in_person') {
        this.paymentDetailsForm.editor.meetupMode = true
        if (!this.paymentDetailsForm.editor.draft.country) {
          try {
            const loc = Intl.DateTimeFormat().resolvedOptions().locale || ''
            const m = loc.match(/-([A-Z]{2})$/)
            if (m) this.paymentDetailsForm.editor.draft.country = m[1]
          } catch (e) {}
        }
        this.guessMeetupTimezone()
      }
    },
    openMeetupEditor(index) {
      if (index >= 0) {
        const profiles = this.meetupProfiles
        this.paymentDetailsForm.editor.draft = {...profiles[index]}
        this.paymentDetailsForm.editor.index =
          this.paymentDetailsForm.profiles.findIndex(
            p => p.id === profiles[index].id
          )
      } else {
        this.paymentDetailsForm.editor.draft = this.blankProfile('cash_in_person')
        this.paymentDetailsForm.editor.index = -1
        if (!this.paymentDetailsForm.editor.draft.country) {
          try {
            const loc = Intl.DateTimeFormat().resolvedOptions().locale || ''
            const m = loc.match(/-([A-Z]{2})$/)
            if (m) this.paymentDetailsForm.editor.draft.country = m[1]
          } catch (e) {}
        }
        this.guessMeetupTimezone()
      }
      this.paymentDetailsForm.editor.meetupMode = true
      this.paymentDetailsForm.editor.bitcoinMode = false
      this.paymentDetailsForm.editor.show = true
    },
    openBankProfileEditor(index) {
      if (index >= 0) {
        const profiles = this.bankProfiles
        this.paymentDetailsForm.editor.draft = {...profiles[index]}
        this.paymentDetailsForm.editor.index =
          this.paymentDetailsForm.profiles.findIndex(
            p => p.id === profiles[index].id
          )
        const d = this.paymentDetailsForm.editor.draft
        if (d.type === 'sepa') {
          const iban = this.normalizeIban(d.iban)
          this.paymentDetailsForm.editor.alsoSepaInstant = this.paymentDetailsForm.profiles.some(
            p =>
              p.type === 'sepa_instant' &&
              this.normalizeIban(p.iban) === iban
          )
        } else {
          this.paymentDetailsForm.editor.alsoSepaInstant = false
        }
      } else {
        this.paymentDetailsForm.editor.draft = this.blankProfile('sepa')
        this.paymentDetailsForm.editor.index = -1
        this.paymentDetailsForm.editor.alsoSepaInstant = true
      }
      this.paymentDetailsForm.editor.meetupMode = false
      this.paymentDetailsForm.editor.bitcoinMode = false
      this.paymentDetailsForm.editor.show = true
    },
    openBitcoinReceiveEditor(index) {
      if (index >= 0) {
        const profiles = this.bitcoinReceiveProfiles
        this.paymentDetailsForm.editor.draft = {...profiles[index]}
        this.paymentDetailsForm.editor.index =
          this.paymentDetailsForm.profiles.findIndex(
            p => p.id === profiles[index].id
          )
      } else {
        this.paymentDetailsForm.editor.draft = this.blankProfile('lightning_address')
        this.paymentDetailsForm.editor.index = -1
        const choices = this.lightningReceiveChoices
        if (choices.length === 1) {
          const only = choices[0].lightning_address
          if (only) {
            this.paymentDetailsForm.editor.draft.lightning_address = only
          }
        }
      }
      this.paymentDetailsForm.editor.meetupMode = false
      this.paymentDetailsForm.editor.bitcoinMode = true
      this.paymentDetailsForm.editor.show = true
    },
    openProfileEditor(index) {
      this.openBankProfileEditor(index)
    },
    saveProfileDraft() {
      const d = this.paymentDetailsForm.editor.draft
      if (this.paymentDetailsForm.editor.meetupMode) {
        d.type = 'cash_in_person'
        const hasMeetup =
          (d.place_label || '').trim() || (d.map_url || '').trim()
        if (!hasMeetup) {
          this.$q.notify({
            message: 'Add where to meet or paste an OpenStreetMap link',
            color: 'warning'
          })
          return
        }
      } else if (!this.bankProfileHasRequiredFields(d)) {
        let message = 'Fill in the required fields for this payment method'
        if (this.isSepaFamilyType(d.type)) {
          message = 'SEPA needs account holder name and IBAN'
        } else if (d.type === 'paypal') {
          message = 'PayPal needs your email address'
        } else if (d.type === 'revolut') {
          message = 'Revolut needs your @username or phone'
        } else if (d.type === 'mpesa') {
          message = 'M-Pesa needs a phone number, Till, or Paybill'
        } else if (d.type === 'mobile_money') {
          message = 'Mobile wallet needs a phone number'
        } else if (d.type === 'cash_in_person') {
          message = 'Cash in person needs a meetup place or map link'
        } else if (d.type === 'lightning_address') {
          message = 'Lightning receive needs an address (you@domain.com or LNURL)'
        } else if (d.type === 'onchain_btc') {
          message = 'On-chain receive needs a Bitcoin address'
        } else if (d.type === 'nwc_wallet') {
          message = 'Add a label for your NWC receive profile'
        }
        this.$q.notify({message, color: 'warning'})
        return
      }
      let profiles = [...this.paymentDetailsForm.profiles]
      const idx = this.paymentDetailsForm.editor.index
      const schema = this.effectivePaymentSchema[d.type] || {}
      const entry = {
        ...d,
        id: d.id || `${d.type}-${Date.now()}`,
        label: (d.label || '').trim() || schema.label || d.type
      }
      if (idx >= 0) profiles[idx] = entry
      else profiles.push(entry)
      if (
        !this.paymentDetailsForm.editor.meetupMode &&
        d.type === 'sepa' &&
        this.paymentDetailsForm.editor.alsoSepaInstant
      ) {
        profiles = this.upsertSepaInstantProfile(profiles, entry)
      }
      if (profiles.length > 8) {
        this.$q.notify({
          message: 'At most 8 payment methods — remove one first',
          color: 'warning'
        })
        return
      }
      this.paymentDetailsForm.profiles = profiles
      this.paymentDetailsForm.editor.show = false
      this.savePaymentDetails()
    },
    removeProfile(index) {
      this.paymentDetailsForm.profiles = this.paymentDetailsForm.profiles.filter(
        (_, i) => i !== index
      )
      this.savePaymentDetails()
    },
    savePaymentDetails() {
      this.paymentDetailsForm.loading = true
      LNbits.api
        .request('PUT', '/trato/api/v1/identity/payment-details', this.adminKey, {
          profiles: this.paymentDetailsForm.profiles
        })
        .then(res => {
          this.identity.has_payment_details = res.data.has_payment_details
          this.paymentDetailsForm.methodNames = res.data.method_names || []
          this.$q.notify({message: 'Payment methods saved', color: 'positive'})
        })
        .catch(err => this.notifyTratoError(err))
        .finally(() => {
          this.paymentDetailsForm.loading = false
        })
    },
    sharePaymentWithBuyer() {
      const profileId = this.tradeDialog.shareProfileId
      if (!profileId) {
        this.$q.notify({
          message: 'Choose a payment method to share',
          color: 'warning'
        })
        return
      }
      this.tradeDialog.sharingPayment = true
      const body = {profile_id: profileId}
      if (this.shareProfileIsCashMeetup) {
        const meetupAt = this.meetupAtUnix()
        if (meetupAt) body.meetup_at = meetupAt
      }
      LNbits.api
        .request(
          'POST',
          `/trato/api/v1/orders/${this.tradeDialog.order.id}/share-payment`,
          this.adminKey,
          body
        )
        .then(res => {
          this.tradeDialog.order = res.data.order
          this.tradeDialog.events = res.data.events
          this.tradeDialog.allowed = res.data.allowed_actions
          this.tradeDialog.sellerPayment = res.data.seller_payment
          this.tradeDialog.payActions = res.data.pay_actions || []
          this.$q.notify({
            message: 'Payment details shared in chat',
            color: 'positive'
          })
        })
        .catch(err => this.notifyTratoError(err))
        .finally(() => {
          this.tradeDialog.sharingPayment = false
        })
    },
    runPayAction(action) {
      if (action.kind === 'epc' && action.value) {
        this.copyText(action.value)
        this.$q.dialog({
          title: action.label || 'SEPA bank transfer',
          message:
            (action.hint ||
              'Open your banking app, choose transfer, and scan a Girocode QR ' +
              'or enter IBAN manually. No Klarna or other signup required.') +
            ' Payment data copied to clipboard.',
          ok: {label: 'Got it', noCaps: true}
        })
        return
      }
      if (action.kind === 'open' && action.url) {
        if (action.hint) {
          this.$q.dialog({
            title: action.label || 'Open payment',
            message: action.hint,
            ok: {label: 'Continue to payment', noCaps: true},
            cancel: {label: 'Cancel', flat: true, noCaps: true}
          }).onOk(() => {
            window.open(action.url, '_blank', 'noopener,noreferrer')
          })
          return
        }
        window.open(action.url, '_blank', 'noopener,noreferrer')
        return
      }
      if (action.kind === 'copy' && action.value) {
        this.copyText(action.value)
      }
    },
    sellerPaymentSummary() {
      const sp = this.tradeDialog.sellerPayment
      if (!sp || !sp.profile) return ''
      const p = sp.profile
      const bits = [p.label || sp.method_name]
      if (p.account_name) bits.push(p.account_name)
      if (p.network) bits.push(p.network)
      if (p.wallet_address) bits.push(p.wallet_address)
      if (p.lightning_address) bits.push(p.lightning_address)
      if (p.iban) bits.push(p.iban)
      if (p.email) bits.push(p.email)
      if (p.username) bits.push('@' + p.username)
      if (p.phone) bits.push(p.phone)
      if (p.place_label) bits.push(p.place_label)
      if (p.lat && p.lon) bits.push(`${p.lat}, ${p.lon}`)
      return bits.filter(Boolean).join(' · ')
    },
    sellerPaymentPanelTitle() {
      const sp = this.tradeDialog.sellerPayment
      const method =
        (sp && sp.profile && sp.profile.label) ||
        sp.method_name ||
        this.tradeChosenPaymentMethod(this.tradeDialog.order) ||
        ''
      const amt = this.tradeDialog.order.fiat_amount
      const code = this.tradeDialog.order.fiat_code
      const amountBit =
        amt && code ? ` · ${amt} ${code}` : ''
      if (method) {
        return this.t('trade.pay_via', {method}) + amountBit
      }
      return this.t('trade.pay_seller') + amountBit
    },
    ratingSnapshot(rating) {
      if (rating && typeof rating === 'object' && !Array.isArray(rating)) {
        return rating
      }
      if (typeof rating === 'number' && !isNaN(rating)) {
        return {rating: rating}
      }
      return null
    },
    takeOrder(order) {
      if (this.isPublicView) {
        this.$q.notify({
          message: 'Log in to LNbits on this server to trade',
          color: 'info',
          actions: [{label: 'Open Trato', handler: () => { window.location.href = this.loginPath }}]
        })
        return
      }
      if (!this.platformTratoSupports(order)) {
        this.explainTakeOrder(order)
        return
      }
      if (!this.canTakeOrder(order)) {
        this.explainTakeOrder(order)
        return
      }
      if (!this.identity) {
        this.ensureIdentity()
        this.$q.notify({
          message: 'Setting up your profile… try again in a moment',
          color: 'info'
        })
        this.tab = 'identity'
        return
      }
      const rep = this.repInfo(order)
      const settlementLayer = this.effectiveTakeSettlement(order)
      if (!settlementLayer) {
        this.showOrder(order)
        return
      }
      const fiatAmount = this.detailChosenFiatAmount(order)
      LNbits.api
        .request('POST', '/trato/api/v1/orders/take', this.adminKey, {
          order_id: order.id,
          mostro_pubkey: order.mostro_pubkey,
          kind: order.kind,
          amount_sats: order.is_market_price ? null : order.amount_sats,
          fiat_amount: fiatAmount,
          fiat_code: order.fiat_code,
          payment_method: this.effectiveTakePaymentMethod(order) ||
            (order.payment_methods || []).join(', '),
          platform: order.platform || '',
          maker_name: order.maker_name || null,
          maker_identity_pubkey: order.maker_pubkey || null,
          rating: this.ratingSnapshot(order.rating),
          bonded: rep.bonded,
          settlement_layer: settlementLayer
        })
        .then(res => {
          this.beginTradeFlow(res.data, {
            message: this.settings.demo_mode
              ? 'Demo trade started — follow the steps below'
              : 'Trade started — follow the steps below'
          })
        })
        .catch(err => this.notifyTratoError(err))
    },
    showOrder(order) {
      this.detailDialog.order = order
      this.detailDialog.takeFiatAmount = order.is_range
        ? Number(order.fiat_min)
        : null
      const layers = this.orderLayers(order)
      let pick = null
      if (this.filters.settlement && layers.includes(this.filters.settlement)) {
        pick = this.filters.settlement
      } else if (layers.length === 1) {
        pick = layers[0]
      } else if (layers.includes('lightning')) {
        pick = 'lightning'
      } else {
        pick = layers[0]
      }
      this.detailDialog.takeSettlement = pick
      this.detailDialog.takePaymentMethod = this.pickDefaultTakePaymentMethod(order)
      this.loadDetailQuote(order)
      this.detailDialog.show = true
    },
    chatBg(e) {
      if (!e) return 'grey-7'
      if (e.direction === 'out' || e.direction === 'chat') return 'primary'
      if (e.direction === 'in' && e.kind === 'chat') return 'teal-7'
      if (e.direction === 'in') return 'blue-grey-7'
      return 'grey-7'
    },
    premiumLabel(p) {
      const n = Number(p) || 0
      if (!n) return null
      return (n > 0 ? '+' : '') + n + '%'
    },
    repInfo(o) {
      // Normalize heterogeneous cross-platform reputation into an honest view.
      // Never invent stars from zero reviews; show scale correctly per source.
      const r = o.rating
      let reviews = null
      let stars = null
      if (r && typeof r === 'object') {
        if (r.total_reviews != null) reviews = Number(r.total_reviews)
        if (r.trades_count != null) reviews = Number(r.trades_count)
        let raw = null
        if (r.total_rating != null) raw = Number(r.total_rating) // 0..5 avg
        if (r.rating != null) {
          const v = Number(r.rating)
          raw = v <= 1 ? v * 5 : v // 0..1 ratio -> 0..5
        }
        if (raw != null && !isNaN(raw)) stars = Math.max(0, Math.min(5, raw))
      }
      const known = reviews != null && reviews > 0
      const info = {
        reviews: reviews,
        stars: known ? stars : null,
        isNew: reviews === 0,
        name: this.shortName(o.maker_name),
        bonded: !!(o.bond || o.bonded),
        source: o.source || o.platform || null
      }
      info.tier = this.trustTier(info)
      info.tierColor = this.trustTierColor(info.tier)
      info.tierDetail = this.trustTierDetail(info.tier, info)
      return info
    },
    repReputationBadge(rep) {
      if (!rep) rep = {}
      if (rep.tier === 'unknown' || (rep.reviews == null && !rep.isNew)) {
        return {show: false}
      }
      if (rep.isNew || rep.reviews === 0) {
        return {
          show: true,
          label: 'NEW',
          color: 'deep-orange-7',
          tooltip: this.trustTierDetail('new', rep)
        }
      }
      if (rep.stars != null) {
        return {
          show: true,
          label: rep.stars.toFixed(1),
          icon: 'star',
          color: 'amber-9',
          tooltip:
            `Average ${rep.stars.toFixed(1)}★ from ` +
            `${rep.reviews} completed trade${rep.reviews === 1 ? '' : 's'}.`
        }
      }
      return {show: false}
    },
    repTradesBadge(rep) {
      if (!rep) rep = {}
      if (rep.reviews == null) {
        return {show: false}
      }
      const n = Number(rep.reviews)
      return {
        label: n === 1 ? '1 trade' : `${n} trades`,
        color: n > 0 ? 'blue-grey-7' : 'deep-orange-7',
        show: true,
        tooltip:
          n === 0
            ? 'Zero published completed trades on the network.'
            : `${n} published completed trade${n === 1 ? '' : 's'}.`
      }
    },
    repTrustBadge(rep) {
      if (!rep) rep = {}
      if (rep.tier === 'trusted') {
        return {
          label: 'TRUSTED',
          color: 'green-7',
          show: true,
          tooltip: this.trustTierDetail('trusted', rep)
        }
      }
      if (rep.tier === 'building') {
        return {
          label: 'BUILDING',
          color: 'blue-grey-7',
          show: true,
          tooltip: this.trustTierDetail('building', rep)
        }
      }
      return {show: false}
    },
    repAnyBadge(rep) {
      if (!rep) return false
      return (
        rep.bonded ||
        this.repReputationBadge(rep).show ||
        this.repTradesBadge(rep).show ||
        this.repTrustBadge(rep).show
      )
    },
    repBadgesRowVisible(o) {
      return this.repAnyBadge(this.repInfo(o))
    },
    repTrustPanelVisible(o) {
      const rep = this.repInfo(o)
      return this.repAnyBadge(rep) || rep.tier !== 'unknown' || !!rep.name
    },
    trustTier(rep) {
      if (rep.reviews == null && !rep.isNew) return 'unknown'
      if (rep.isNew || rep.reviews === 0) return 'new'
      if (
        rep.reviews >= this.trustMinReviews &&
        rep.stars != null &&
        rep.stars >= this.trustMinStars
      ) {
        return 'trusted'
      }
      return 'building'
    },
    trustTierColor(tier) {
      const map = {
        new: 'deep-orange-7',
        building: 'blue-grey-7',
        trusted: 'green-7',
        unknown: 'grey-7'
      }
      return map[tier] || 'grey-7'
    },
    trustTierDetail(tier, rep) {
      if (tier === 'trusted') {
        return (
          `${rep.reviews}+ successful reviews with ${rep.stars.toFixed(1)}★ average ` +
          'on the Mostro network. Still not identity-verified — check amount and method.'
        )
      }
      if (tier === 'building') {
        return (
          'Some trade history, but below Trato\'s trusted threshold ' +
          `(≥${this.trustMinReviews} reviews at ≥${this.trustMinStars}★). ` +
          'Prefer smaller amounts or wait for more reviews.'
        )
      }
      if (tier === 'new') {
        return (
          'Zero published reviews — treat as an unverified registration. ' +
          'Highest caution: start small or skip.'
        )
      }
      return (
        'This platform did not publish review counts for this maker. ' +
        'Use bonded status and your own judgment.'
      )
    },
    repFromSnapshot(cp) {
      if (!cp) return null
      return this.repInfo({
        rating: cp.rating,
        maker_name: cp.maker_name,
        bonded: cp.bonded,
        platform: cp.platform
      })
    },
    shortName(name) {
      if (!name) return null
      const n = String(name).trim()
      // Long opaque ids (no spaces) are noise — shorten the middle.
      if (n.length > 22 && !n.includes(' ')) {
        return n.slice(0, 8) + '…' + n.slice(-6)
      }
      return n
    },
    isGenericTraderName(name) {
      const n = String(name || '')
        .trim()
        .toLowerCase()
      return (
        !n ||
        n === 'anonymous maker' ||
        n === 'anonymous' ||
        n === 'counterparty' ||
        n === 'trader' ||
        n === 'your profile' ||
        n === 'maker'
      )
    },
    shortPubkey(hex) {
      const h = (hex || '').toLowerCase().trim()
      if (h.length !== 64) return null
      return h.slice(0, 8) + '…' + h.slice(-4)
    },
    isValidHexPubkey(value) {
      const avatar = window.TratoAvatar
      if (avatar && avatar.isValidHexPubkey) return avatar.isValidHexPubkey(value)
      const key = (value || '').toLowerCase().trim()
      return key.length === 64 && /^[0-9a-f]+$/.test(key)
    },
    robohashSeed(pubkey, fallbackSeed) {
      const key = (pubkey || '').toLowerCase().trim()
      if (
        this.isValidHexPubkey(key) &&
        this.identity &&
        (this.identity.identity_pubkey || '').toLowerCase() === key &&
        this.identity.identity_npub
      ) {
        return this.identity.identity_npub
      }
      const avatar = window.TratoAvatar
      if (avatar && avatar.avatarSeed) {
        return avatar.avatarSeed(pubkey, fallbackSeed)
      }
      if (this.isValidHexPubkey(key)) return key
      if (fallbackSeed) return String(fallbackSeed)
      return 'trato-unknown'
    },
    profileAvatarSeed(pubkey, fallbackSeed) {
      return this.robohashSeed(pubkey, fallbackSeed)
    },
    profileRobohashSrc(pubkey, fallbackSeed, size) {
      const avatar = window.TratoAvatar
      if (!avatar || !avatar.url) return null
      return avatar.url(this.robohashSeed(pubkey, fallbackSeed), size || 80)
    },
    profileAvatarSrc(pubkey, fallbackSeed, size) {
      const photo = this.profilePicture(pubkey)
      if (photo) return photo
      return this.profileRobohashSrc(pubkey, fallbackSeed, size)
    },
    avatarForceKey(parts) {
      return (parts || []).map(p => String(p || '')).join(':')
    },
    avatarSrc(pubkey, fallbackSeed, forceKey, size) {
      if (forceKey && this.avatarRobohashForced[forceKey]) {
        return this.profileRobohashSrc(pubkey, fallbackSeed, size)
      }
      return this.profileAvatarSrc(pubkey, fallbackSeed, size)
    },
    onAvatarError(forceKey) {
      if (!forceKey || this.avatarRobohashForced[forceKey]) return
      this.avatarRobohashForced[forceKey] = true
    },
    njumpProfileUrl(pubkeyOrNpub) {
      const avatar = window.TratoAvatar
      if (!avatar || !avatar.njumpProfileUrl) return null
      const raw = String(pubkeyOrNpub || '').trim()
      if (!raw) return null
      if (raw.toLowerCase().startsWith('npub')) return avatar.njumpProfileUrl(raw)
      const key = raw.toLowerCase()
      if (
        key.length === 64 &&
        this.identity &&
        (this.identity.identity_pubkey || '').toLowerCase() === key &&
        this.identity.identity_npub
      ) {
        return avatar.njumpProfileUrl(this.identity.identity_npub)
      }
      const cached = this.nostrProfiles[key]
      if (cached && cached.npub) return avatar.njumpProfileUrl(cached.npub)
      return avatar.njumpProfileUrl(key)
    },
    openNjumpProfile(pubkeyOrNpub) {
      const url = this.njumpProfileUrl(pubkeyOrNpub)
      if (!url) return
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    avatarNjumpClick(pubkey, fallbackSeed) {
      const key = (pubkey || '').toLowerCase().trim()
      if (key.length === 64) {
        this.openNjumpProfile(key)
        return
      }
      if (
        this.identity &&
        (this.identity.identity_pubkey || '').toLowerCase() === key
      ) {
        this.openNjumpProfile(this.identity.identity_pubkey)
      }
    },
    orderAvatarSeed(order) {
      if (!order) return 'trato-order'
      if (this.isValidHexPubkey(order.maker_pubkey)) return null
      const name = String(order.maker_name || '').trim()
      if (name && !this.isGenericTraderName(name)) return name
      const plat = String(order.platform || 'p2p').toLowerCase()
      return `${plat}:${order.id || 'order'}`
    },
    orderAvatarKey(order) {
      if (!order) return 'order:na'
      return this.avatarForceKey([
        order.mostro_pubkey,
        order.id,
        order.maker_pubkey,
        order.platform
      ])
    },
    orderAvatarSrc(order) {
      return this.avatarSrc(
        order && order.maker_pubkey,
        this.orderAvatarSeed(order),
        this.orderAvatarKey(order),
        80
      )
    },
    profileLabel(pubkey, fallbackName) {
      const key = (pubkey || '').toLowerCase()
      const cached = this.nostrProfiles[key]
      if (cached && cached.label) return cached.label
      const name = this.shortName(fallbackName)
      if (name && !this.isGenericTraderName(name)) return name
      return this.shortPubkey(key) || name
    },
    profilePicture(pubkey) {
      const cached = this.nostrProfiles[(pubkey || '').toLowerCase()]
      const pic = cached && cached.picture
      if (!pic || typeof pic !== 'string') return null
      const url = pic.trim()
      if (!/^https?:\/\/.+/i.test(url)) return null
      return url
    },
    profileSocial(pubkey) {
      const cached = this.nostrProfiles[(pubkey || '').toLowerCase()]
      if (!cached) return null
      const parts = []
      if (cached.followers_count != null && cached.followers_count > 0) {
        const n = cached.followers_cap_hit
          ? `${cached.followers_count}+`
          : String(cached.followers_count)
        parts.push(`${n} follower${cached.followers_count === 1 && !cached.followers_cap_hit ? '' : 's'}`)
      }
      if (cached.following_count != null && cached.following_count > 0) {
        parts.push(
          `${cached.following_count} following`
        )
      }
      if (!parts.length) return null
      return {
        line: parts.join(' · '),
        tooltip:
          'Nostr follow graph on relays Trato polls. Many traders use fresh keys ' +
          'with no social history — Mostro trade ratings are the stronger signal.'
      }
    },
    ensureNostrProfiles(pubkeys) {
      const want = [
        ...new Set(
          (pubkeys || [])
            .map(p => (p || '').toLowerCase())
            .filter(p => p.length === 64)
        )
      ].filter(p => !this.nostrProfiles[p] && !this.nostrProfilesPending[p])
      if (!want.length) return Promise.resolve()
      want.forEach(p => {
        this.nostrProfilesPending[p] = true
      })
      return LNbits.api
        .request('POST', '/trato/api/v1/nostr/profiles', null, {pubkeys: want})
        .then(res => {
          Object.assign(this.nostrProfiles, res.data || {})
        })
        .catch(() => {})
        .finally(() => {
          want.forEach(p => {
            delete this.nostrProfilesPending[p]
          })
        })
    },
    refreshOrderProfiles() {
      const keys = this.orders.map(o => o.maker_pubkey).filter(Boolean)
      return this.ensureNostrProfiles(keys)
    },
    loadIdentityNostrProfile() {
      if (!this.identity || !this.identity.identity_pubkey) return
      this.ensureNostrProfiles([this.identity.identity_pubkey])
    },
    identityNostrProfileFound(pubkey) {
      const cached = this.nostrProfiles[(pubkey || '').toLowerCase()]
      return Boolean(cached && cached.found)
    },
    profileAbout(pubkey) {
      const cached = this.nostrProfiles[(pubkey || '').toLowerCase()]
      return (cached && cached.about) || ''
    },
    profileNip05(pubkey) {
      const cached = this.nostrProfiles[(pubkey || '').toLowerCase()]
      return (cached && cached.nip05) || ''
    },
    openNostrProfileEditor() {
      if (!this.identity) return
      const key = (this.identity.identity_pubkey || '').toLowerCase()
      const cached = this.nostrProfiles[key] || {}
      this.nostrProfileForm.editor.draft = {
        display_name: cached.display_name || cached.label || '',
        name: cached.name || '',
        picture: cached.picture || '',
        about: cached.about || '',
        nip05: cached.nip05 || '',
        lud16: cached.lud16 || ''
      }
      this.nostrProfileForm.editor.show = true
      if (!this.adminKey) return
      this.$q.loading.show({message: this.t('identity.loading_profile')})
      this.g
        .request(
          'GET',
          '/trato/api/v1/identity/nostr-profile?refresh=1&include_counts=0',
          this.adminKey
        )
        .then(res => {
          const data = res.data || {}
          if (data.pubkey) {
            this.nostrProfiles[key] = data
          }
          this.nostrProfileForm.editor.draft = {
            display_name: data.display_name || data.label || '',
            name: data.name || '',
            picture: data.picture || '',
            about: data.about || '',
            nip05: data.nip05 || '',
            lud16: data.lud16 || ''
          }
        })
        .catch(err => {
          this.$q.notify({
            type: 'negative',
            message:
              (err.response && err.response.data && err.response.data.detail) ||
              this.t('identity.load_failed')
          })
        })
        .finally(() => {
          this.$q.loading.hide()
        })
    },
    saveNostrProfile() {
      if (!this.adminKey || this.nostrProfileForm.editor.saving) return
      const draft = this.nostrProfileForm.editor.draft
      if (!(draft.display_name || '').trim() && !(draft.name || '').trim()) {
        this.$q.notify({
          type: 'warning',
          message: this.t('identity.name_required')
        })
        return
      }
      this.nostrProfileForm.editor.saving = true
      this.g
        .request('PUT', '/trato/api/v1/identity/nostr-profile', this.adminKey, {
          display_name: (draft.display_name || '').trim(),
          name: (draft.name || '').trim(),
          picture: (draft.picture || '').trim(),
          about: (draft.about || '').trim(),
          nip05: (draft.nip05 || '').trim(),
          lud16: (draft.lud16 || '').trim()
        })
        .then(res => {
          const data = res.data || {}
          const key = (this.identity.identity_pubkey || '').toLowerCase()
          if (data.pubkey) {
            this.nostrProfiles[key] = data
          }
          this.nostrProfileForm.editor.show = false
          this.loadPaymentDetails()
          this.$q.notify({
            type: 'positive',
            message: this.t('identity.saved')
          })
        })
        .catch(err => {
          this.$q.notify({
            type: 'negative',
            message:
              (err.response && err.response.data && err.response.data.detail) ||
              this.t('identity.save_failed')
          })
        })
        .finally(() => {
          this.nostrProfileForm.editor.saving = false
        })
    },
    tradePartnerPubkey() {
      const cp = this.tradeCounterparty
      if (cp && cp.identity_pubkey) return cp.identity_pubkey
      const order = this.tradeDialog.order
      if (order && order.peer_pubkey) return order.peer_pubkey
      return null
    },
    tradePartnerLabel() {
      const cp = this.tradeCounterparty
      if (cp) {
        return (
          this.profileLabel(cp.identity_pubkey, cp.maker_name) || 'Counterparty'
        )
      }
      const order = this.tradeDialog.order
      if (order && order.peer_pubkey) {
        return this.profileLabel(order.peer_pubkey, null) || 'Counterparty'
      }
      return 'Counterparty'
    },
    tradePartnerAvatarSeed() {
      const cp = this.tradeCounterparty
      if (cp && cp.identity_pubkey) return null
      const order = this.tradeDialog.order
      if (order && order.peer_pubkey) return null
      if (cp && cp.maker_name && !this.isGenericTraderName(cp.maker_name)) {
        return cp.maker_name
      }
      if (order && order.id) return `trade-partner:${order.id}`
      return 'counterparty'
    },
    loadTradeProfiles() {
      const keys = []
      if (this.identity && this.identity.identity_pubkey) {
        keys.push(this.identity.identity_pubkey)
      }
      const partner = this.tradePartnerPubkey()
      if (partner) keys.push(partner)
      return this.ensureNostrProfiles(keys)
    },
    orderMakerLabel(order) {
      if (!order) return 'Maker'
      const label = this.profileLabel(order.maker_pubkey, order.maker_name)
      if (label && !this.isGenericTraderName(label)) return label
      return label || 'Maker'
    },
    orderPartnerMeta(order) {
      if (!order) return null
      try {
        return JSON.parse(order.order_json || '{}').counterparty || null
      } catch (e) {
        return null
      }
    },
    orderPartnerPubkey(order) {
      const cp = this.orderPartnerMeta(order)
      if (cp && cp.identity_pubkey) return cp.identity_pubkey
      return (order && order.peer_pubkey) || null
    },
    orderPartnerLabel(order) {
      const cp = this.orderPartnerMeta(order)
      if (cp) {
        return (
          this.profileLabel(cp.identity_pubkey, cp.maker_name) || 'Partner'
        )
      }
      if (order && order.peer_pubkey) {
        return this.profileLabel(order.peer_pubkey, null) || 'Partner'
      }
      return order && order.role === 'maker' ? 'Waiting for taker' : 'Partner'
    },
    orderPartnerAvatarSeed(order) {
      if (this.isValidHexPubkey(this.orderPartnerPubkey(order))) return null
      const cp = this.orderPartnerMeta(order)
      if (cp && cp.maker_name && !this.isGenericTraderName(cp.maker_name)) {
        return cp.maker_name
      }
      return 'partner-unknown'
    },
    tradeAvatarKey(order) {
      const face = this.tradeCardFace(order)
      return this.avatarForceKey(['trade', order && order.id, face.pubkey, face.seed])
    },
    tradeAvatarSrc(order) {
      const face = this.tradeCardFace(order)
      return this.avatarSrc(face.pubkey, face.seed, this.tradeAvatarKey(order), 80)
    },
    tradeCardFace(order) {
      if (!order) return {pubkey: null, seed: null, label: '—'}
      const partnerPk = this.orderPartnerPubkey(order)
      const cp = this.orderPartnerMeta(order)
      const partnerNamed =
        cp &&
        cp.maker_name &&
        !this.isGenericTraderName(cp.maker_name)
      const partnerKnown = !!(partnerPk || partnerNamed)

      if (order.role === 'maker' && !partnerKnown) {
        const me = this.identity && this.identity.identity_pubkey
        return {
          pubkey: me,
          seed: null,
          label: this.t('trades.waiting_taker')
        }
      }
      return {
        pubkey: partnerPk,
        seed: partnerPk ? null : this.orderPartnerAvatarSeed(order),
        label: this.orderPartnerLabel(order)
      }
    },
    takerHint(kind, fiat) {
      return this.userActionDetail(this.userSideIfTake(kind), fiat)
    },
    oppositeSide(side) {
      return side === 'buy' ? 'sell' : 'buy'
    },
    userSideIfTake(makerKind) {
      return this.oppositeSide(makerKind)
    },
    userActionLabel(userSide) {
      return userSide === 'buy' ? this.t('user_action.buy') : this.t('user_action.sell')
    },
    userActionDetail(userSide, fiat) {
      const fc = (fiat || 'fiat').toUpperCase()
      return userSide === 'buy'
        ? this.t('user_action.buy_detail', {fiat: fc})
        : this.t('user_action.sell_detail', {fiat: fc})
    },
    orderCardActionDetail(order) {
      if (!order) return ''
      const side = this.userSideIfTake(order.kind)
      const methods = this.expandPaymentMethods(order.payment_methods)
      const picked = this.effectiveTakePaymentMethod(order)
      if (picked && this.isStablecoinPm(picked)) {
        return side === 'buy'
          ? `Send ${picked} · receive BTC`
          : `Receive ${picked} · send BTC`
      }
      const allStable =
        methods.length > 0 && methods.every(pm => this.isStablecoinPm(pm))
      if (allStable) {
        if (methods.length === 1) {
          const pm = methods[0]
          return side === 'buy'
            ? `Send ${pm} · receive BTC`
            : `Receive ${pm} · send BTC`
        }
        return side === 'buy'
          ? 'Send stablecoin · receive BTC'
          : 'Receive stablecoin · send BTC'
      }
      return this.userActionDetail(side, order.fiat_code)
    },
    userChipColor(userSide) {
      return userSide === 'buy' ? 'green-6' : 'red-6'
    },
    moneyDirection(side) {
      return side === 'sell'
        ? this.t('user_action.money_sell')
        : this.t('user_action.money_buy')
    },
    takeButtonLabel(order) {
      if (!this.platformTratoSupports(order)) {
        return this.openPlatformLabel(order.platform)
      }
      const plat = String((order && order.platform) || 'mostro').toLowerCase()
      if (
        order.book_verified === false &&
        !this.settings.demo_mode &&
        plat === 'robosats'
      ) {
        return this.t('buttons.open_platform', {platform: 'RoboSats'})
      }
      if (this.canTakeOrder(order)) {
        return this.t('buttons.take')
      }
      if (order.is_range && this.detailFiatRangeError(order)) {
        return this.t('buttons.fix_amount')
      }
      return this.t('buttons.take_pending')
    },
    openPlatformLabel(platform) {
      return this.t('buttons.open_platform', {platform: this.platformLabel(platform)})
    },
    beginTradeFlow(order, opts) {
      opts = opts || {}
      if (!order || !order.id) return
      const idx = this.myOrders.findIndex(o => o.id === order.id)
      if (idx >= 0) {
        this.myOrders.splice(idx, 1, order)
      } else {
        this.myOrders.unshift(order)
      }
      if (opts.message) {
        this.$q.notify({message: opts.message, color: 'positive'})
      }
      this.detailDialog.show = false
      this.tab = 'trades'
      this.openTrade(order)
      this.loadMyOrders()
    },
    openTrade(orderOrId) {
      const id =
        orderOrId && typeof orderOrId === 'object' && orderOrId.id
          ? orderOrId.id
          : orderOrId
      if (!id || !this.adminKey) return
      this.tradesFocusId = id
      this.stopTradePoll()
      const order =
        orderOrId && typeof orderOrId === 'object' && orderOrId.id
          ? orderOrId
          : this.myOrders.find(o => o.id === id) || {id: id}
      this.tradeDialog.order = order
      this.tradeDialog.events = []
      this.tradeDialog.allowed = []
      this.tradeDialog.chatText = ''
      this.tradeDialog.sellerPayment = null
      this.tradeDialog.payActions = []
      this.tradeDialog.buyerReceiveSummary = ''
      this.tradeDialog.paymentProfileOptions = []
      this.tradeDialog.shareProfileId = null
      this.tradeDialog.meetupAtLocal = ''
      this.$nextTick(() => {
        this.tradeDialog.show = true
        this.loadTradeDetail()
        this._tradePoll = setInterval(() => this.loadTradeDetail(true), 5000)
      })
    },
    onTradeDialogHide() {
      this.stopTradePoll()
      this.tradesFocusId = null
      this.tradeDialog.order = null
    },
    stopTradePoll() {
      if (this._tradePoll) {
        clearInterval(this._tradePoll)
        this._tradePoll = null
      }
    },
    loadTradeDetail(silent) {
      if (!this.tradeDialog.order) return
      LNbits.api
        .request(
          'GET',
          `/trato/api/v1/orders/${this.tradeDialog.order.id}`,
          this.adminKey
        )
        .then(res => {
          this.tradeDialog.order = res.data.order
          this.tradeDialog.events = res.data.events
          this.tradeDialog.allowed = res.data.allowed_actions
          this.tradeDialog.sellerPayment = res.data.seller_payment || null
          this.tradeDialog.payActions = res.data.pay_actions || []
          this.tradeDialog.buyerReceiveSummary =
            res.data.buyer_receive_summary || ''
          this.tradeDialog.paymentProfileOptions =
            res.data.payment_profile_options || []
          if (
            !this.tradeDialog.shareProfileId &&
            this.tradeDialog.paymentProfileOptions.length
          ) {
            this.tradeDialog.shareProfileId =
              this.tradeDialog.paymentProfileOptions[0].id
          }
          this.loadTradeProfiles()
        })
        .catch(() => {
          if (!silent) this.$q.notify({message: 'Could not load trade', color: 'negative'})
        })
    },
    doAction(action) {
      this.tradeDialog.acting = true
      LNbits.api
        .request(
          'POST',
          `/trato/api/v1/orders/${this.tradeDialog.order.id}/action`,
          this.adminKey,
          {action: action}
        )
        .then(res => {
          this.tradeDialog.order = res.data
          this.loadTradeDetail()
          this.loadMyOrders()
          this.$q.notify({
            message: this.actionLabel(action) || this.t('buttons.done'),
            color: 'positive'
          })
        })
        .catch(err => this.notifyTratoError(err))
        .finally(() => {
          this.tradeDialog.acting = false
        })
    },
    submitRating() {
      this.tradeDialog.rateShow = false
      const rating = this.clampRating(this.tradeDialog.rating)
      this.tradeDialog.rating = rating
      LNbits.api
        .request(
          'POST',
          `/trato/api/v1/orders/${this.tradeDialog.order.id}/action`,
          this.adminKey,
          {action: 'rate-user', rating: rating}
        )
        .then(res => {
          this.tradeDialog.order = res.data
          this.loadTradeDetail()
          this.$q.notify({message: this.t('notify.rating_sent'), color: 'positive'})
        })
        .catch(err => this.notifyTratoError(err))
    },
    sendChat() {
      const text = (this.tradeDialog.chatText || '').trim()
      if (!text) return
      LNbits.api
        .request(
          'POST',
          `/trato/api/v1/orders/${this.tradeDialog.order.id}/chat`,
          this.adminKey,
          {text: text}
        )
        .then(res => {
          this.tradeDialog.events = res.data
          this.tradeDialog.chatText = ''
        })
        .catch(err => this.notifyTratoError(err))
    }
  },
  watch: {
    'settingsForm.demo_mode'(enabled) {
      if (enabled) this.settingsForm.mainnet_enabled = false
    },
    'settingsForm.mainnet_enabled'(enabled) {
      if (enabled) this.settingsForm.demo_mode = false
    },
    'filters.fiat'() {
      this.loadMarketPrice()
    },
    'filters.tratoOnly'() {
      this.scheduleClientFilterRepaint()
    },
    'filters.matchMyPayments'() {
      this.scheduleClientFilterRepaint()
    },
    'filters.payment'() {
      this.scheduleClientFilterRepaint()
    }
  },
  created() {
    const SORT = typeof window !== 'undefined' ? window.TratoOrderbookSort : null
    if (SORT && SORT.readStored) {
      this.filters.sort = SORT.readStored(this.filters.sort)
    }
    this.$watch(
      () => this.g.locale,
      loc => {
        if (loc && window.i18n) window.i18n.global.locale = loc
      },
      {immediate: true}
    )
    this.loadPaymentSchema()
    this.loadOrderbook()
    this.loadMarketPrice()
    this.scheduleDeepLinkOffer()
    if (!this.isPublicView) {
      this.loadIdentity()
      this.loadSettings()
      this.loadHealth()
      this.loadMyOrders()
    }
    if (this.g.user && this.g.user.wallets.length) {
      this.newIdentity.wallet = this.g.user.wallets[0].id
    }
    this._poll = setInterval(() => {
      if (this.tab === 'book') this.loadOrderbook()
    }, 60000)
  },
  unmounted() {
    if (this._poll) clearInterval(this._poll)
    this.stopTradePoll()
  }
})

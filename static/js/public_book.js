;(function () {
  const API = '/trato/api/v1'
  const CFG = window.TRATO_PUBLIC_BOOK || {}
  const TRADE_URL = CFG.tradeUrl || '/trato/'
  const PLATFORM_URLS = CFG.platformUrls || {
    robosats: 'https://learn.robosats.org/',
    peach: 'https://peachbitcoin.com/',
    lnp2pbot: 'https://lnp2pbot.com/',
    hodlhodl: 'https://hodlhodl.com/'
  }

  const sectionsEl = document.getElementById('pb-sections')
  const status = document.getElementById('pb-status')
  const statsEl = document.getElementById('pb-stats')
  const dealsEl = document.getElementById('pb-deals')
  const fiatSel = document.getElementById('pb-fiat')
  const sideSel = document.getElementById('pb-side')
  const settlementSel = document.getElementById('pb-settlement')
  const takeableCb = document.getElementById('pb-takeable')
  const sortSel = document.getElementById('pb-sort')
  const tradeLink = document.getElementById('pb-trade-link')
  const refreshBtn = document.getElementById('pb-refresh')
  const SORT = window.TratoOrderbookSort
  const I18N = resolveLocale()
  let operatorFees = {}
  let lnUserLoggedIn = false
  let loading = false
  let clientFilterBusy = false
  let filterRepaintRaf = null
  let loadGeneration = 0
  let cachedOrders = []
  let cachedStats = null
  let takeablePlatforms = ['mostro', 'robosats']
  let dealsDefaultsApplied = false
  let userPickedDealsFilters = false

  if (!sectionsEl || !status || !refreshBtn) {
    if (status) {
      status.hidden = false
      status.className = 'pb-error'
      status.textContent =
        'This page failed to start — Trato may be outdated on this server. Ask the host to update the extension.'
    }
    return
  }

  function resolveLocale() {
    const catalog = window.TRATO_LOCALE || {}
    const lang = (navigator.language || 'en').slice(0, 2).toLowerCase()
    const pick = catalog[lang] || catalog.en || {}
    return pick.trato || {}
  }

  function t(key, values) {
    const parts = String(key || '').split('.')
    let node = I18N
    for (const part of parts) {
      if (!node || typeof node !== 'object') {
        node = null
        break
      }
      node = node[part]
    }
    let text = typeof node === 'string' ? node : key
    if (values && typeof values === 'object') {
      Object.keys(values).forEach(k => {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(values[k]))
      })
    }
    return text
  }

  function premiumLabel(p) {
    const n = Number(p) || 0
    if (!n) return null
    return (n > 0 ? '+' : '') + n + '%'
  }

  function formatEffectivePct(n) {
    const v = Number(n) || 0
    if (!v) return '0%'
    const rounded = Math.round(v * 10) / 10
    return (rounded > 0 ? '+' : '') + rounded + '%'
  }

  function feeFractionForOrder(o) {
    const plat = String(o.platform || 'mostro').toLowerCase()
    if (plat !== 'mostro' && plat !== 'trato') return null
    if (operatorFees[o.mostro_pubkey]) {
      return Number(operatorFees[o.mostro_pubkey].fee_fraction) || 0.006
    }
    return 0.006
  }

  function effectiveMetric(o, side) {
    const premium = Number(o.premium) || 0
    const frac = feeFractionForOrder(o)
    const feeHalfPct = frac != null ? (frac * 100) / 2 : 0
    const feesKnown = frac != null
    const pct =
      side === 'buy' ? premium + feeHalfPct : premium - feeHalfPct
    return { pct, premium, feeHalfPct, feesKnown }
  }

  function dealGoodness(metric, side) {
    return side === 'buy' ? -metric.pct : metric.pct
  }

  function dealRowParts(o, metric) {
    const plat = platformLabel(o.platform)
    const prem = premiumLabel(metric.premium)
    const premBit = prem
      ? t('public_book.best_deals.vs_market', { premium: prem })
      : t('public_book.best_deals.premium_only')
    let feeBit
    if (metric.feesKnown && metric.feeHalfPct) {
      const pct = (Math.round(metric.feeHalfPct * 10) / 10).toFixed(1)
      feeBit = t('public_book.best_deals.fee_est', { pct })
    } else {
      feeBit = t('public_book.best_deals.fees_unknown')
    }
    const detail = `${premBit} · ${feeBit}`
    return { plat, detail, full: `${plat} · ${detail}` }
  }

  function bestDealsHtml(orders, fiat, side) {
    const candidates = filterLocal(orders).filter(o => {
      const code = (o.fiat_code || '').toUpperCase()
      return code === fiat && userSide(o.kind) === side
    })
    if (!candidates.length) return ''

    const ranked = candidates
      .map(o => ({ o, metric: effectiveMetric(o, side) }))
      .sort((a, b) => {
        if (side === 'buy') return a.metric.pct - b.metric.pct
        return b.metric.pct - a.metric.pct
      })
      .slice(0, 8)

    const goodness = ranked.map(r => dealGoodness(r.metric, side))
    const minG = Math.min(...goodness)
    const maxG = Math.max(...goodness)
    const span = maxG - minG || 1

    const subtitleKey =
      side === 'buy'
        ? 'public_book.best_deals.subtitle_buy'
        : 'public_book.best_deals.subtitle_sell'
    const sideClass = side === 'buy' ? 'pb-deals--buy' : 'pb-deals--sell'

    const rows = ranked
      .map((row, idx) => {
        const g = goodness[idx]
        const width = Math.max(8, Math.round(((g - minG) / span) * 100))
        const score = formatEffectivePct(row.metric.pct)
        const parts = dealRowParts(row.o, row.metric)
        const rowSide = side === 'buy' ? 'pb-deals-row--buy' : 'pb-deals-row--sell'
        return `<div class="pb-deals-row ${rowSide}">
          <div class="pb-deals-row-meta">
            <span class="pb-deals-rank">${idx + 1}</span>
            <span class="pb-deals-label" title="${escapeHtml(parts.full)}">
              <span class="pb-deals-label-plat">${escapeHtml(parts.plat)}</span>
              <span class="pb-deals-label-detail">${escapeHtml(parts.detail)}</span>
            </span>
          </div>
          <div class="pb-deals-bar-wrap" aria-hidden="true">
            <div class="pb-deals-bar" style="width:${width}%"></div>
          </div>
          <div class="pb-deals-score">${escapeHtml(
            t('public_book.best_deals.effective', { score })
          )}</div>
        </div>`
      })
      .join('')

    return `<section class="pb-deals-panel ${sideClass}" aria-labelledby="pb-deals-title">
      <div class="pb-deals-head">
        <h2 class="pb-deals-title" id="pb-deals-title">${escapeHtml(
          t('public_book.best_deals.title')
        )}</h2>
        <p class="pb-deals-sub">${escapeHtml(
          t(subtitleKey, { fiat })
        )}</p>
      </div>
      <div class="pb-deals-chart">${rows}</div>
      <p class="pb-deals-note">${escapeHtml(t('public_book.best_deals.note'))}</p>
    </section>`
  }

  function fiatCounts(stats, orders) {
    const codes = { ...(stats && stats.fiat_codes ? stats.fiat_codes : {}) }
    for (const o of orders) {
      const c = (o.fiat_code || '').toUpperCase()
      if (c) codes[c] = (codes[c] || 0) + 1
    }
    return codes
  }

  function pickDefaultFiat(stats, orders) {
    const codes = fiatCounts(stats, orders)
    const keys = Object.keys(codes)
    if (!keys.length) return null
    if (codes.EUR) return 'EUR'
    if (codes.USD) return 'USD'
    return keys.sort((a, b) => (codes[b] || 0) - (codes[a] || 0))[0]
  }

  function applyDealsDefaults(stats, orders) {
    if (userPickedDealsFilters || dealsDefaultsApplied) return false
    if (!fiatSel || !sideSel) return false
    let changed = false
    if (!fiatSel.value) {
      const fiat = pickDefaultFiat(stats, orders)
      if (fiat) {
        fiatSel.value = fiat
        changed = true
      }
    }
    if (!sideSel.value) {
      sideSel.value = 'buy'
      changed = true
    }
    return changed
  }

  function renderBestDeals(orders, stats) {
    if (!dealsEl) return
    const fiatRaw = fiatSel && fiatSel.value
    const side = sideSel && sideSel.value
    const fiat = fiatRaw
      ? fiatRaw.toUpperCase()
      : pickDefaultFiat(stats || cachedStats, orders)
    const chartSide = side || 'buy'
    if (!fiat) {
      dealsEl.hidden = false
      dealsEl.innerHTML = `<section class="pb-deals-panel pb-deals-panel--hint" aria-live="polite">
        <p class="pb-deals-hint">${escapeHtml(
          t('public_book.best_deals.loading')
        )}</p>
      </section>`
      return
    }
    let html = bestDealsHtml(orders, fiat, chartSide)
    let activeSide = chartSide
    if (!html && chartSide === 'buy') {
      html = bestDealsHtml(orders, fiat, 'sell')
      activeSide = 'sell'
    } else if (!html && chartSide === 'sell') {
      html = bestDealsHtml(orders, fiat, 'buy')
      activeSide = 'buy'
    }
    if (!html) {
      dealsEl.hidden = false
      dealsEl.innerHTML = `<section class="pb-deals-panel pb-deals-panel--hint" aria-live="polite">
        <p class="pb-deals-hint">${escapeHtml(
          t('public_book.best_deals.no_offers', { fiat })
        )}</p>
      </section>`
      return
    }
    dealsEl.hidden = false
    dealsEl.innerHTML = html
    if (sideSel && !sideSel.value && activeSide) {
      sideSel.value = activeSide
    }
    if (fiatSel && !fiatSel.value && fiat) {
      fiatSel.value = fiat
    }
  }

  function userActionDetail(side, fiatCode) {
    const fiat = fiatCode || 'fiat'
    return side === 'buy'
      ? t('user_action.buy_detail', {fiat: fiat})
      : t('user_action.sell_detail', {fiat: fiat})
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function formatSats(n) {
    if (window.TratoFiatSats && window.TratoFiatSats.formatSats) {
      return window.TratoFiatSats.formatSats(n)
    }
    if (n == null || isNaN(n)) return ''
    return Math.round(Number(n)).toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      useGrouping: true
    })
  }

  function userSide(makerKind) {
    return makerKind === 'sell' ? 'buy' : 'sell'
  }

  function feeLine(o) {
    const frac = operatorFees[o.mostro_pubkey]
      ? Number(operatorFees[o.mostro_pubkey].fee_fraction)
      : 0.006
    const pct = (frac * 100).toFixed(2)
    const est = operatorFees[o.mostro_pubkey] ? '' : ' (est.)'
    if (!o.amount_sats || o.is_market_price) {
      return `Escrow fee ~${pct}% of BTC${est} (split buyer/seller)`
    }
    const total = Math.max(1, Math.round(o.amount_sats * frac))
    return `Escrow fee ~${total} sats (~${pct}%${est})`
  }

  function expandPaymentMethods(pms) {
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
  }

  function platformLabel(platform) {
    const p = String(platform || 'mostro').toLowerCase()
    const labels = {
      mostro: 'Mostro',
      robosats: 'RoboSats',
      peach: 'Peach',
      lnp2pbot: 'lnp2pbot',
      hodlhodl: 'HodlHodl'
    }
    return labels[p] || platform || 'platform'
  }

  function isHttpUrl(value) {
    try {
      const u = new URL(String(value))
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch (e) {
      return false
    }
  }

  function openPlatformLabel(platform) {
    return t('buttons.open_platform', {platform: platformLabel(platform)})
  }

  function mostroTradeUrl(o) {
    const base = TRADE_URL.replace(/\/$/, '') + '/'
    const params = new URLSearchParams()
    params.set('offer', o.id || '')
    if (o.mostro_pubkey) params.set('op', o.mostro_pubkey)
    return `${base}?${params.toString()}`
  }

  function openInPlatform(o) {
    const plat = String(o.platform || 'mostro').toLowerCase()

    if (plat === 'mostro' || plat === 'trato') {
      return {
        href: mostroTradeUrl(o),
        external: false,
        label: t('public_book.open_in_trato')
      }
    }

    if (plat === 'robosats') {
      const href =
        o.source && isHttpUrl(o.source)
          ? o.source
          : PLATFORM_URLS.robosats || null
      if (!href) return null
      return {
        href: href,
        external: true,
        label: openPlatformLabel('robosats')
      }
    }

    if (o.source && isHttpUrl(o.source)) {
      return {
        href: o.source,
        external: true,
        label: openPlatformLabel(plat)
      }
    }

    const fallback = PLATFORM_URLS[plat]
    if (fallback) {
      return {
        href: fallback,
        external: true,
        label: openPlatformLabel(plat)
      }
    }
    return null
  }

  function orderAvatarSeed(o) {
    const TA = window.TratoAvatar
    const valid = TA && TA.isValidHexPubkey && TA.isValidHexPubkey(o.maker_pubkey)
    if (valid) return null
    const name = String(o.maker_name || '').trim()
    if (name) return name
    const plat = String(o.platform || 'p2p').toLowerCase()
    return `${plat}:${o.id || 'order'}`
  }

  function makerLabel(o) {
    const name = String(o.maker_name || '').trim()
    if (name) return name
    const TA = window.TratoAvatar
    if (o.maker_pubkey && TA && TA.hexToNpub) {
      const npub = TA.hexToNpub(o.maker_pubkey)
      if (npub) return npub.slice(0, 12) + '…'
    }
    return 'Trader'
  }

  function avatarBlockHtml(o) {
    const TA = window.TratoAvatar
    if (!TA || !TA.url) return ''
    const seed = TA.avatarSeed
      ? TA.avatarSeed(o.maker_pubkey, orderAvatarSeed(o))
      : o.maker_pubkey || orderAvatarSeed(o)
    const src = TA.url(seed, 64)
    const njump = o.maker_pubkey && TA.njumpProfileUrl
      ? TA.njumpProfileUrl(o.maker_pubkey)
      : null
    const img = `<img class="pb-avatar" src="${escapeHtml(src)}" width="32" height="32" alt="" loading="lazy" decoding="async">`
    const avatarInner = njump
      ? `<a class="pb-avatar-link" href="${escapeHtml(njump)}" target="_blank" rel="noopener noreferrer" title="View on Nostr (njump)" onclick="event.stopPropagation()">${img}</a>`
      : img
    const label = escapeHtml(makerLabel(o))
    return `<div class="pb-maker">
        ${avatarInner}
        <span class="pb-maker-name">${label}</span>
      </div>`
  }

  function paymentMethodChipsHtml(pmParts) {
    if (!pmParts.length) return ''
    const shown = pmParts.slice(0, 3)
    const chips = shown
      .map(
        pm =>
          `<span class="pb-pm-chip"><span class="pb-pm-chip__text">${escapeHtml(pm)}</span></span>`
      )
      .join('')
    const more =
      pmParts.length > 3
        ? `<span class="pb-pm-chip pb-pm-chip--more">+${pmParts.length - 3}</span>`
        : ''
    return `<div class="pb-pm-row">${chips}${more}</div>`
  }

  function cardHtml(o) {
    const side = userSide(o.kind)
    const sideClass = side === 'buy' ? 'pb-card--buy' : 'pb-card--sell'
    const chipSideClass = side === 'buy' ? 'pb-chip-side--buy' : 'pb-chip-side--sell'
    const btnClass = side === 'buy' ? 'pb-card-btn--buy' : 'pb-card-btn--sell'
    const action = side === 'buy' ? t('user_action.buy') : t('user_action.sell')
    const plat = (o.platform || 'mostro').toLowerCase()
    const amount = o.is_market_price
      ? t('market.market_price')
      : `${formatSats(o.amount_sats)} sats`
    const premium = premiumLabel(o.premium)
    const pmParts = expandPaymentMethods(o.payment_methods)
    const dest = openInPlatform(o)
    const premiumBit = premium ? ` · ${premium} vs market` : ''
    const btnRel = dest && dest.external ? ' rel="noopener noreferrer" target="_blank"' : ''

    return `<article class="pb-card trato-order-card ${sideClass}">
      <div class="pb-card-section pb-card-section--head">
        <div class="pb-card-top">
          <span class="pb-chip pb-chip-side ${chipSideClass}">${escapeHtml(action)}</span>
          <span class="pb-chip pb-chip-plat">${escapeHtml(platformLabel(plat))}</span>
        </div>
        <div class="pb-card-action-detail">${escapeHtml(userActionDetail(side, o.fiat_code))}</div>
      </div>
      <div class="pb-card-section">
        <h2 class="pb-card-amount">${escapeHtml(o.fiat_display || o.fiat_code)}</h2>
        <div class="pb-meta pb-meta-amount">${escapeHtml(amount + premiumBit)}</div>
      </div>
      ${avatarBlockHtml(o)}
      ${paymentMethodChipsHtml(pmParts)}
      ${
        dest
          ? `<div class="pb-card-actions">
        <a class="pb-card-btn ${btnClass}" href="${escapeHtml(dest.href)}"${btnRel}>${escapeHtml(dest.label)}</a>
      </div>`
          : ''
      }
    </article>`
  }

  const SECTIONS = [
    {
      key: 'buy',
      title: 'Buy BTC',
      match: o => userSide(o.kind) === 'buy'
    },
    {
      key: 'sell',
      title: 'Sell BTC',
      match: o => userSide(o.kind) === 'sell'
    }
  ]

  function currentSortKey() {
    if (!sortSel) return SORT ? SORT.DEFAULT_KEY : 'newest'
    return SORT ? SORT.normalizeKey(sortSel.value) : sortSel.value || 'newest'
  }

  function sectionSubtitle(sectionKey) {
    const key = currentSortKey()
    if (SORT && SORT.sectionSubtitle) {
      return SORT.sectionSubtitle(key, sectionKey)
    }
    return sectionKey === 'buy'
      ? 'You pay fiat and receive sats — newest first'
      : 'You send sats and receive fiat — newest first'
  }

  function sortOrders(orders) {
    if (SORT && SORT.sort) return SORT.sort(orders, currentSortKey())
    return orders
  }

  function sectionHtml(section, orders) {
    if (!orders.length) return ''
    const countLabel = orders.length === 1 ? '1 offer' : `${orders.length} offers`
    return `<section class="pb-section" aria-labelledby="pb-section-${section.key}">
      <div class="pb-section-head">
        <div>
          <h2 class="pb-section-title" id="pb-section-${section.key}">${escapeHtml(section.title)}</h2>
          <p class="pb-section-sub">${escapeHtml(sectionSubtitle(section.key))}</p>
        </div>
        <span class="pb-section-count">${escapeHtml(countLabel)}</span>
      </div>
      <div class="pb-grid">${orders.map(cardHtml).join('')}</div>
    </section>`
  }

  function renderSectionsFragment(orders) {
    const frag = document.createDocumentFragment()
    const sorted = sortOrders(orders)
    for (const s of SECTIONS) {
      const sectionOrders = sorted.filter(s.match)
      if (!sectionOrders.length) continue
      const wrap = document.createElement('div')
      wrap.innerHTML = sectionHtml(s, sectionOrders)
      while (wrap.firstChild) frag.appendChild(wrap.firstChild)
    }
    return frag
  }

  function setSectionsContent(orders) {
    sectionsEl.replaceChildren(renderSectionsFragment(orders))
  }

  function looksLikeHtml(text) {
    const head = String(text || '')
      .trim()
      .slice(0, 64)
      .toLowerCase()
    return head.startsWith('<!doctype') || head.startsWith('<html')
  }

  function friendlyFetchError(res, text) {
    const status = res && res.status ? res.status : 0
    const body = String(text || '').trim()
    if (looksLikeHtml(body)) {
      if (status === 502 || status === 503 || status === 504) {
        return 'LNbits is restarting — wait a few seconds and refresh'
      }
      if (status === 404) {
        return 'Trato API not found — check that the extension is enabled'
      }
      return 'Server returned a web page instead of data — try refreshing in a moment'
    }
    if (status === 502 || status === 503 || status === 504) {
      return 'LNbits is temporarily unavailable — try again shortly'
    }
    if (body && !body.startsWith('{') && !body.startsWith('[')) {
      return body.slice(0, 160)
    }
    return (res && res.statusText) || 'Request failed'
  }

  function parseJsonBody(text) {
    if (!text) return null
    return JSON.parse(text)
  }

  function shouldRetryFetch(res, text) {
    const status = res && res.status ? res.status : 0
    if (status === 502 || status === 503 || status === 504) return true
    if (looksLikeHtml(text)) return true
    return false
  }

  async function fetchJson(url, attempt) {
    const tries = attempt || 0
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    })
    const text = await res.text()
    if (shouldRetryFetch(res, text) && tries < 2) {
      await new Promise(r => setTimeout(r, 400 * (tries + 1)))
      return fetchJson(url, tries + 1)
    }
    let data
    try {
      data = parseJsonBody(text)
    } catch (e) {
      throw new Error(
        res.ok ? 'Invalid JSON from server' : friendlyFetchError(res, text)
      )
    }
    if (!res.ok) {
      const detail =
        data && (data.detail || data.message)
          ? typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail)
          : friendlyFetchError(res, text)
      throw new Error(detail)
    }
    return data
  }

  async function detectLnUser() {
    try {
      const res = await fetch('/api/v1/auth', { credentials: 'same-origin' })
      if (!res.ok) return
      const data = await res.json()
      lnUserLoggedIn = Boolean(data && data.id)
      if (lnUserLoggedIn && tradeLink) {
        tradeLink.hidden = false
      }
    } catch (e) {
      /* anonymous browse */
    }
  }

  async function loadOperatorFees(orders) {
    const pubkeys = [
      ...new Set(orders.map(o => o.mostro_pubkey).filter(Boolean))
    ].slice(0, 25)
    if (!pubkeys.length) return
    try {
      const res = await fetch(`${API}/operators/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkeys })
      })
      if (res.ok) operatorFees = { ...operatorFees, ...(await res.json()) }
    } catch (e) {
      /* optional */
    }
  }

  function publicBookFilterContext() {
    return {
      side: sideSel && sideSel.value,
      fiat: fiatSel && fiatSel.value,
      settlement: settlementSel && settlementSel.value,
      payment: null,
      tratoOnly: false,
      takeableOnly: takeableCb && takeableCb.checked,
      isTakeable: isTakeableOrder,
      platformTratoSupports: () => true,
      matchMyPayments: false
    }
  }

  function populateFiat(stats, orders) {
    if (!fiatSel) return
    const FC = window.TratoBookFilterCounts
    const ctx = publicBookFilterContext()
    const filtered = FC
      ? FC.filterOrdersForCounts(orders, ctx, 'fiat')
      : orders
    const counts = FC
      ? FC.countByFiatCode(filtered)
      : fiatCounts(stats, orders)
    const prev = fiatSel.value
    fiatSel.innerHTML =
      '<option value="">All</option>' +
      Object.keys(counts)
        .sort()
        .map(c => `<option value="${c}">${c} (${counts[c]})</option>`)
        .join('')
    if (prev) fiatSel.value = prev
  }

  function isTakeableOrder(o) {
    if (!o) return false
    if (o.takeable === true) return true
    if (o.takeable === false) return false
    const plat = String(o.platform || 'mostro').toLowerCase()
    return takeablePlatforms.includes(plat)
  }

  function layerMatches(order, settlement) {
    if (!settlement || settlement === 'any') return true
    const layers =
      order && order.layers && order.layers.length
        ? order.layers
        : [order && order.layer ? order.layer : 'lightning']
    return layers.includes(settlement)
  }

  function filterLocal(orders) {
    let list = orders
    if (sideSel && sideSel.value) {
      list = list.filter(o => userSide(o.kind) === sideSel.value)
    }
    if (fiatSel && fiatSel.value) {
      const fiat = fiatSel.value.toUpperCase()
      list = list.filter(o => (o.fiat_code || '').toUpperCase() === fiat)
    }
    if (settlementSel && settlementSel.value) {
      list = list.filter(o => layerMatches(o, settlementSel.value))
    }
    if (takeableCb && takeableCb.checked) {
      list = list.filter(isTakeableOrder)
    }
    return list
  }

  function applyTakeablePlatforms(stats) {
    if (stats && Array.isArray(stats.takeable_platforms) && stats.takeable_platforms.length) {
      takeablePlatforms = stats.takeable_platforms.map(p => String(p).toLowerCase())
    }
  }

  function initFilterUi() {
    const textEl = document.getElementById('pb-takeable-text')
    const labelEl = document.getElementById('pb-takeable-label')
    if (textEl) textEl.textContent = t('public_book.filter_take_in_trato')
    if (labelEl) labelEl.title = t('tooltips.toggle_trato_only')
  }

  function setRefreshUi(active) {
    loading = active
    refreshBtn.disabled = active
    refreshBtn.classList.toggle('is-loading', active)
    refreshBtn.setAttribute('aria-busy', active ? 'true' : 'false')
    refreshBtn.textContent = active ? 'Refreshing…' : 'Refresh'
  }

  function buildQueryParams() {
    return new URLSearchParams()
  }

  function updateStatsLine(stats, orders) {
    const visible = filterLocal(orders)
    const sync = stats.last_sync
      ? new Date(stats.last_sync * 1000).toLocaleString()
      : '—'
    const relayHint = stats.last_error ? ` · relay error: ${stats.last_error}` : ''
    const filterHint = clientFilterBusy ? ' · filtering…' : ''
    statsEl.innerHTML = `<strong>${visible.length}</strong> offers shown · <strong>${stats.total || 0}</strong> on relays · updated ${escapeHtml(sync)}${escapeHtml(relayHint)}${filterHint}`
  }

  function emptyMessage(stats, orders) {
    let msg = 'No offers match your filters.'
    if (takeableCb && takeableCb.checked && (stats.total || 0) > 0) {
      msg += t('public_book.uncheck_takeable')
    } else if (stats.last_error) {
      msg =
        `Relay sync failed: ${stats.last_error}. ` +
        'Offers may be missing — ask the host to check relay URLs and that Trato is enabled.'
    } else if ((stats.total || 0) === 0 && orders.length === 0) {
      msg =
        'No offers on the relays yet. The server polls every ~60s — wait and refresh. ' +
        'If this persists, Trato may need a restart or relay configuration.'
    } else {
      msg += ' Try clearing filters or refresh.'
    }
    return msg
  }

  function paintOrders(orders, stats) {
    cachedOrders = orders
    if (stats) cachedStats = stats
    const visible = filterLocal(orders)
    renderBestDeals(orders, cachedStats)
    if (cachedStats) updateStatsLine(cachedStats, orders)
    if (!visible.length) {
      status.hidden = false
      status.className = 'pb-empty'
      status.textContent = emptyMessage(cachedStats || {}, orders)
      sectionsEl.hidden = true
      return
    }
    status.hidden = true
    sectionsEl.hidden = false
    setSectionsContent(visible)
  }

  function repaintLocal() {
    if (!cachedOrders.length && !sectionsEl.querySelector('.pb-section')) return
    clientFilterBusy = true
    populateFiat(cachedStats || {}, cachedOrders)
    if (cachedStats) updateStatsLine(cachedStats, cachedOrders)
    if (filterRepaintRaf) cancelAnimationFrame(filterRepaintRaf)
    filterRepaintRaf = requestAnimationFrame(() => {
      filterRepaintRaf = null
      clientFilterBusy = false
      paintOrders(cachedOrders, null)
    })
  }

  function onSortChange() {
    if (SORT && SORT.writeStored && sortSel) {
      SORT.writeStored(sortSel.value)
    }
    repaintLocal()
  }

  async function load() {
    const gen = ++loadGeneration
    const hasContent = cachedOrders.length > 0 || sectionsEl.querySelector('.pb-section')
    setRefreshUi(true)
    if (!hasContent) {
      status.hidden = false
      status.className = 'pb-loading'
      status.textContent = 'Loading live offers…'
      sectionsEl.hidden = true
    }
    const qs = buildQueryParams().toString()
    try {
      const ordersRaw = await fetchJson(`${API}/orderbook${qs ? '?' + qs : ''}`)
      if (gen !== loadGeneration) return
      const orders = Array.isArray(ordersRaw) ? ordersRaw : []
      paintOrders(orders, null)
      loadOperatorFees(orders).then(() => {
        if (gen !== loadGeneration) return
        paintOrders(cachedOrders, null)
      })
      fetchJson(`${API}/orderbook/stats`)
        .then(stats => {
          if (gen !== loadGeneration) return
          applyTakeablePlatforms(stats)
          populateFiat(stats, cachedOrders.length ? cachedOrders : orders)
          const orderSet = cachedOrders.length ? cachedOrders : orders
          if (
            !dealsDefaultsApplied &&
            !userPickedDealsFilters &&
            applyDealsDefaults(stats, orderSet)
          ) {
            dealsDefaultsApplied = true
          }
          paintOrders(orderSet, stats)
        })
        .catch(() => {})
    } catch (err) {
      if (gen !== loadGeneration) return
      status.hidden = false
      status.className = 'pb-error'
      const detail = err && err.message ? err.message : 'unknown error'
      status.textContent =
        `Could not load the order book: ${detail}. ` +
        'Check that Trato is enabled on this LNbits instance, then refresh.'
      if (!hasContent) sectionsEl.hidden = true
    } finally {
      if (gen === loadGeneration) setRefreshUi(false)
    }
  }

  refreshBtn.addEventListener('click', function (ev) {
    ev.preventDefault()
    load()
  })
  ;[sideSel, fiatSel, settlementSel].forEach(el => {
    if (!el) return
    el.addEventListener('change', function () {
      if (el === sideSel || el === fiatSel) userPickedDealsFilters = true
      repaintLocal()
    })
  })
  initFilterUi()
  if (takeableCb) takeableCb.addEventListener('change', repaintLocal)
  if (sortSel) {
    if (SORT && SORT.readStored) {
      sortSel.value = SORT.readStored(sortSel.value)
    }
    sortSel.addEventListener('change', onSortChange)
  }
  detectLnUser().then(load)
  setInterval(load, 60000)
})()

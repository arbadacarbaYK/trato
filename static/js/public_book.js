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
  const fiatSel = document.getElementById('pb-fiat')
  const sideSel = document.getElementById('pb-side')
  const settlementSel = document.getElementById('pb-settlement')
  const mostroCb = document.getElementById('pb-mostro')
  const sortSel = document.getElementById('pb-sort')
  const tradeLink = document.getElementById('pb-trade-link')
  const refreshBtn = document.getElementById('pb-refresh')
  const SORT = window.TratoOrderbookSort
  let operatorFees = {}
  let lnUserLoggedIn = false
  let loading = false
  let clientFilterBusy = false
  let filterRepaintRaf = null
  let loadGeneration = 0
  let cachedOrders = []
  let cachedStats = null

  if (!sectionsEl || !status || !refreshBtn) {
    if (status) {
      status.hidden = false
      status.className = 'pb-error'
      status.textContent =
        'This page failed to start — Trato may be outdated on this server. Ask the host to update the extension.'
    }
    return
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function formatSats(n) {
    if (n == null || isNaN(n)) return ''
    return Number(n).toLocaleString()
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

  function mostroTradeUrl(o) {
    const base = TRADE_URL.replace(/\/$/, '') + '/'
    const params = new URLSearchParams()
    params.set('offer', o.id || '')
    if (o.mostro_pubkey) params.set('op', o.mostro_pubkey)
    return `${base}?${params.toString()}`
  }

  function cardDestination(o) {
    const plat = String(o.platform || 'mostro').toLowerCase()
    if (plat === 'mostro' || o.takeable === true) {
      return {
        href: mostroTradeUrl(o),
        external: false,
        cta: lnUserLoggedIn
          ? 'View in Trato on this server →'
          : 'Open in Trato (LNbits login required) →'
      }
    }
    if (o.source && isHttpUrl(o.source)) {
      return {
        href: o.source,
        external: true,
        cta: `View on ${platformLabel(plat)} →`
      }
    }
    const fallback = PLATFORM_URLS[plat]
    if (fallback) {
      return {
        href: fallback,
        external: true,
        cta: `Trade on ${platformLabel(plat)} →`
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

  function cardHtml(o) {
    const side = userSide(o.kind)
    const sideClass = side === 'buy' ? 'pb-card--buy' : 'pb-card--sell'
    const chipClass = side === 'buy' ? 'pb-chip-buy' : 'pb-chip-sell'
    const action = side === 'buy' ? 'Buy BTC' : 'Sell BTC'
    const plat = (o.platform || 'mostro').toLowerCase()
    const amount = o.is_market_price
      ? 'market price'
      : `${formatSats(o.amount_sats)} sats`
    const pmParts = expandPaymentMethods(o.payment_methods)
    const pmShown = pmParts.slice(0, 4).join(', ')
    const pmMore = pmParts.length > 4 ? ` +${pmParts.length - 4}` : ''
    const pmTitle = pmParts.length
      ? ` title="${escapeHtml(pmParts.join(' · '))}"`
      : ''
    const dest = cardDestination(o)
    const tag = dest ? 'a' : 'article'
    const href = dest ? ` href="${escapeHtml(dest.href)}"` : ''
    const rel = dest && dest.external ? ' rel="noopener noreferrer" target="_blank"' : ''
    const inner = `<div class="pb-card-top">
        <span class="pb-chip ${chipClass}">${escapeHtml(action)}</span>
        <span class="pb-chip pb-chip-plat">${escapeHtml(plat)}</span>
      </div>
      <h2 class="pb-card-amount">${escapeHtml(o.fiat_display || o.fiat_code)}</h2>
      <div class="pb-meta">${escapeHtml(amount)}</div>
      <div class="pb-meta pb-meta-pm"${pmTitle}>${pmParts.length ? escapeHtml(pmShown + pmMore) : '—'}</div>
      ${avatarBlockHtml(o)}
      ${dest ? `<div class="pb-card-cta">${escapeHtml(dest.cta)}</div>` : ''}`

    return `<${tag} class="pb-card ${sideClass}"${href}${rel}>${inner}</${tag}>`
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

  async function fetchJson(url) {
    const res = await fetch(url, { credentials: 'same-origin' })
    const text = await res.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch (e) {
      throw new Error(res.ok ? 'Invalid JSON from server' : text.slice(0, 120) || res.statusText)
    }
    if (!res.ok) {
      const detail =
        data && (data.detail || data.message)
          ? typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail)
          : res.statusText || String(res.status)
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

  function populateFiat(stats, orders) {
    if (!fiatSel) return
    const codes = { ...(stats.fiat_codes || {}) }
    for (const o of orders) {
      const c = (o.fiat_code || '').toUpperCase()
      if (c) codes[c] = (codes[c] || 0) + 1
    }
    const prev = fiatSel.value
    fiatSel.innerHTML =
      '<option value="">All</option>' +
      Object.keys(codes)
        .sort()
        .map(c => `<option value="${c}">${c} (${codes[c]})</option>`)
        .join('')
    if (prev) fiatSel.value = prev
  }

  function filterLocal(orders) {
    let list = orders
    if (mostroCb && mostroCb.checked) {
      list = list.filter(o => (o.platform || '').toLowerCase() === 'mostro')
    }
    return list
  }

  function setRefreshUi(active) {
    loading = active
    refreshBtn.disabled = active
    refreshBtn.classList.toggle('is-loading', active)
    refreshBtn.setAttribute('aria-busy', active ? 'true' : 'false')
    refreshBtn.textContent = active ? 'Refreshing…' : 'Refresh'
  }

  function buildQueryParams() {
    const params = new URLSearchParams()
    if (sideSel && sideSel.value) params.set('side', sideSel.value)
    if (fiatSel && fiatSel.value) params.set('fiat', fiatSel.value)
    if (settlementSel && settlementSel.value) params.set('settlement', settlementSel.value)
    return params
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
    if (mostroCb && mostroCb.checked && (stats.total || 0) > 0) {
      msg +=
        ' Uncheck “Mostro only” to see RoboSats, Peach, and other platforms on the relays.'
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
          populateFiat(stats, cachedOrders.length ? cachedOrders : orders)
          paintOrders(cachedOrders.length ? cachedOrders : orders, stats)
        })
        .catch(() => {})
    } catch (err) {
      if (gen !== loadGeneration) return
      status.className = 'pb-error'
      status.textContent =
        `Could not load the order book: ${err && err.message ? err.message : 'unknown error'}. ` +
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
    if (el) el.addEventListener('change', load)
  })
  if (mostroCb) mostroCb.addEventListener('change', repaintLocal)
  if (sortSel) {
    if (SORT && SORT.readStored) {
      sortSel.value = SORT.readStored(sortSel.value)
    }
    sortSel.addEventListener('change', onSortChange)
  }
  detectLnUser().then(load)
  setInterval(load, 60000)
})()

/**
 * Shared fiat→sats helpers for Trato UI (book cards, detail dialog, take flow).
 * Sats are always formatted with en-US grouping so 540501 never reads as 540.501.
 */
;(function (root) {
  const PRICE_FIAT_ALIASES = {
    USDT: 'USD',
    USDC: 'USD',
    'L-USDT': 'USD',
    'L-USDC': 'USD',
    BUSD: 'USD',
    DAI: 'USD',
    TUSD: 'USD',
    USDP: 'USD',
    GUSD: 'USD',
    PYUSD: 'USD'
  }
  const SUSPICIOUS_IMPLICIT = new Set(['ALL'])
  const GLOBAL_FALLBACKS = ['USD', 'EUR']

  function normalizeFiatCode(code) {
    return String(code || 'USD')
      .trim()
      .toUpperCase()
  }

  function resolvePriceFiatCode(code) {
    const c = normalizeFiatCode(code)
    if (PRICE_FIAT_ALIASES[c]) return PRICE_FIAT_ALIASES[c]
    const compact = c.replace(/-/g, '')
    if (compact === 'LUSDT' || compact === 'LUSDC') return 'USD'
    return c
  }

  function isSafeImplicitFallback(code, primary) {
    const c = normalizeFiatCode(code)
    const p = normalizeFiatCode(primary)
    if (SUSPICIOUS_IMPLICIT.has(c) && c !== p) return false
    return Boolean(c)
  }

  function pushUnique(chain, code) {
    const c = normalizeFiatCode(code)
    if (c && !chain.includes(c)) chain.push(c)
  }

  function priceFiatFallbackChain(fiatCode, opts) {
    opts = opts || {}
    const primary = normalizeFiatCode(fiatCode)
    const chain = []
    pushUnique(chain, primary)
    const resolved = resolvePriceFiatCode(primary)
    if (resolved !== primary) pushUnique(chain, resolved)
    ;[opts.walletFiat, opts.instanceFiat, opts.filterFiat].forEach(extra => {
      if (!extra) return
      if (!isSafeImplicitFallback(extra, primary)) return
      pushUnique(chain, extra)
      const alias = resolvePriceFiatCode(extra)
      if (alias !== normalizeFiatCode(extra)) pushUnique(chain, alias)
    })
    if (opts.includeGlobal !== false) {
      GLOBAL_FALLBACKS.forEach(fb => pushUnique(chain, fb))
    }
    return chain
  }

  function orderPriceFactor(premiumPct) {
    const p = Number(premiumPct) || 0
    return 1 - p / 100
  }

  function satsFromFiat(fiatAmount, satsPerFiat, premiumPct) {
    const fiat = Number(fiatAmount)
    const rate = Number(satsPerFiat)
    if (!fiat || fiat <= 0 || !rate || rate <= 0 || isNaN(fiat) || isNaN(rate)) {
      return 0
    }
    return Math.max(
      0,
      Math.round(fiat * rate * orderPriceFactor(premiumPct))
    )
  }

  function formatSats(n) {
    if (n == null || n === '' || Number.isNaN(Number(n))) return ''
    return Math.round(Number(n)).toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      useGrouping: true
    })
  }

  function quoteCacheKey(order) {
    if (!order) return ''
    const code = normalizeFiatCode(order.fiat_code)
    return `${String(order.id || '')}:${code}`
  }

  function pickOrderFiatAmount(order, ctx) {
    ctx = ctx || {}
    if (!order) return null
    if (order.is_range) {
      const raw =
        ctx.takeFiatAmount != null
          ? ctx.takeFiatAmount
          : ctx.onDetail
            ? ctx.takeFiatAmount
            : order.fiat_min
      const v = Number(raw)
      if (isNaN(v)) return null
      if (ctx.inRange && !ctx.inRange(order, v)) return null
      return v
    }
    if (order.fiat_amount != null && order.fiat_amount !== '') {
      const v = Number(order.fiat_amount)
      return isNaN(v) ? null : v
    }
    return null
  }

  function isPlausibleSatsForFiat(amountSats, fiatAmount, satsPerFiat, premiumPct) {
    const sats = Number(amountSats) || 0
    const fiat = Number(fiatAmount) || 0
    const rate = Number(satsPerFiat) || 0
    if (sats <= 0 || fiat <= 0 || rate <= 0) return true
    const expected = satsFromFiat(fiat, rate, premiumPct)
    if (expected <= 0) return true
    const ratio = sats / expected
    return ratio >= 0.25 && ratio <= 4
  }

  function isSuspiciousPriceFiat(priceFiatCode, orderFiatCode) {
    const price = normalizeFiatCode(priceFiatCode)
    const want = resolvePriceFiatCode(orderFiatCode)
    const book = normalizeFiatCode(orderFiatCode)
    return SUSPICIOUS_IMPLICIT.has(price) && price !== want && book !== price
  }

  function resolveRateForOrder(order, ctx) {
    ctx = ctx || {}
    if (!order) return null
    const code = normalizeFiatCode(order.fiat_code)

    if (ctx.quoteSatsPerFiat && ctx.quoteFiatCode === code) {
      if (ctx.quotePriceFiatCode && isSuspiciousPriceFiat(ctx.quotePriceFiatCode, code)) {
        return null
      }
      const r = Number(ctx.quoteSatsPerFiat)
      return r > 0 ? r : null
    }

    if (ctx.orderQuotes) {
      const cached = ctx.orderQuotes[quoteCacheKey(order)]
      if (cached && cached.fiat_code === code && cached.sats_per_fiat) {
        const priceCode = cached.price_fiat_code || cached.fiat_code
        if (!isSuspiciousPriceFiat(priceCode, code)) {
          const r = Number(cached.sats_per_fiat)
          if (r > 0) return r
        }
      }
    }

    if (ctx.marketPrice) {
      const mp = ctx.marketPrice
      const mpBook = normalizeFiatCode(mp.fiat_code)
      const want = resolvePriceFiatCode(code)
      const priceCode = normalizeFiatCode(mp.price_fiat_code || mp.fiat_code)
      if (
        mp.sats_per_fiat &&
        !isSuspiciousPriceFiat(priceCode, code) &&
        (mpBook === code || mpBook === want || priceCode === want)
      ) {
        const r = Number(mp.sats_per_fiat)
        if (r > 0) return r
      }
    }
    return null
  }

  function estimateOrderBtcSats(order, ctx) {
    ctx = ctx || {}
    if (!order) return null
    const fixed = Number(order.amount_sats) || 0
    const market =
      typeof ctx.orderUsesMarketPrice === 'function'
        ? ctx.orderUsesMarketPrice(order)
        : Boolean(order.is_market_price || !(fixed > 0))
    const fiat = pickOrderFiatAmount(order, ctx)
    const rate = resolveRateForOrder(order, ctx)
    const premium = Number(order.premium) || 0

    if (fixed > 0 && !market) {
      if (fiat && rate && !isPlausibleSatsForFiat(fixed, fiat, rate, premium)) {
        return satsFromFiat(fiat, rate, premium)
      }
      return fixed
    }

    if (!fiat || !rate) return fixed > 0 ? fixed : null
    return satsFromFiat(fiat, rate, premium)
  }

  root.TratoFiatSats = {
    PRICE_FIAT_ALIASES,
    normalizeFiatCode,
    resolvePriceFiatCode,
    priceFiatFallbackChain,
    orderPriceFactor,
    satsFromFiat,
    formatSats,
    quoteCacheKey,
    pickOrderFiatAmount,
    isPlausibleSatsForFiat,
    isSuspiciousPriceFiat,
    resolveRateForOrder,
    estimateOrderBtcSats
  }
})(typeof window !== 'undefined' ? window : globalThis)

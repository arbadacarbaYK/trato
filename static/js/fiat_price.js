/**
 * Fiat → BTC helpers (mirrors trato/services/fiat_price.py).
 * Loaded before index.js — one sats-from-fiat path for cards, detail, take flow.
 */
;(function (root) {
  const FIAT_PRICE_ALIASES = {
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

  function resolvePriceFiatCode(fiatCode) {
    const code = normalizeFiatCode(fiatCode)
    return FIAT_PRICE_ALIASES[code] || code
  }

  function isSafeImplicitFallback(code, primary) {
    const c = normalizeFiatCode(code)
    const p = normalizeFiatCode(primary)
    if (SUSPICIOUS_IMPLICIT.has(c) && c !== p) return false
    return Boolean(c)
  }

  function priceFiatFallbackChain(fiatCode, opts) {
    opts = opts || {}
    const primary = normalizeFiatCode(fiatCode)
    const chain = []
    const push = c => {
      const code = normalizeFiatCode(c)
      if (code && chain.indexOf(code) === -1) chain.push(code)
    }
    push(resolvePriceFiatCode(primary))
    if (primary !== resolvePriceFiatCode(primary)) push(primary)
    ;[opts.walletFiat, opts.instanceFiat].forEach(extra => {
      if (!extra || !isSafeImplicitFallback(extra, primary)) return
      push(extra)
      const alias = resolvePriceFiatCode(extra)
      if (alias !== normalizeFiatCode(extra)) push(alias)
    })
    if (opts.includeGlobal !== false) {
      GLOBAL_FALLBACKS.forEach(fb => push(fb))
    }
    if (primary === 'ALL') push('ALL')
    return chain
  }

  function orderPriceFactor(premiumPct) {
    return 1 - (Number(premiumPct) || 0) / 100
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
    return `${String(order.id || '')}:${normalizeFiatCode(order.fiat_code)}`
  }

  function pickOrderFiatAmount(order, ctx) {
    ctx = ctx || {}
    if (!order) return null
    if (order.is_range) {
      const raw =
        ctx.takeFiatAmount != null ? ctx.takeFiatAmount : order.fiat_min
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

  function estimateOrderBtcSats(order, ctx) {
    ctx = ctx || {}
    if (!order) return null
    const fixed = Number(order.amount_sats) || 0
    const market =
      typeof ctx.orderUsesMarketPrice === 'function'
        ? ctx.orderUsesMarketPrice(order)
        : Boolean(order.is_market_price || !(fixed > 0))
    if (fixed > 0 && !market) {
      const fiat = pickOrderFiatAmount(order, ctx)
      const code = normalizeFiatCode(order.fiat_code)
      let rate = null
      if (ctx.quoteSatsPerFiat && ctx.quoteFiatCode === code) {
        rate = Number(ctx.quoteSatsPerFiat)
      } else if (ctx.orderQuotes) {
        const cached = ctx.orderQuotes[quoteCacheKey(order)]
        if (cached && cached.fiat_code === code && cached.sats_per_fiat) {
          rate = Number(cached.sats_per_fiat)
        }
      }
      if (
        fiat &&
        rate &&
        rate > 0 &&
        !isPlausibleSatsForFiat(fixed, fiat, rate, Number(order.premium) || 0)
      ) {
        return satsFromFiat(fiat, rate, Number(order.premium) || 0)
      }
      return fixed
    }

    const fiat = pickOrderFiatAmount(order, ctx)
    const code = normalizeFiatCode(order.fiat_code)
    let rate = null
    if (ctx.quoteSatsPerFiat && ctx.quoteFiatCode === code) {
      rate = Number(ctx.quoteSatsPerFiat)
    } else if (ctx.orderQuotes) {
      const cached = ctx.orderQuotes[quoteCacheKey(order)]
      if (cached && cached.fiat_code === code && cached.sats_per_fiat) {
        rate = Number(cached.sats_per_fiat)
      }
    }
    if (!rate && ctx.marketPrice) {
      const mp = ctx.marketPrice
      if (normalizeFiatCode(mp.fiat_code) === code && mp.sats_per_fiat) {
        rate = Number(mp.sats_per_fiat)
      }
    }
    if (!fiat || !rate || rate <= 0) return fixed > 0 ? fixed : null
    return satsFromFiat(fiat, rate, Number(order.premium) || 0)
  }

  const api = {
    FIAT_PRICE_ALIASES,
    normalizeFiatCode,
    resolvePriceFiatCode,
    priceFiatFallbackChain,
    orderPriceFactor,
    satsFromFiat,
    formatSats,
    quoteCacheKey,
    pickOrderFiatAmount,
    isPlausibleSatsForFiat,
    estimateOrderBtcSats
  }

  root.TratoFiatSats = api
  root.TratoFiatPrice = api
})(typeof window !== 'undefined' ? window : globalThis)

;(function () {
  const PM_LABEL_MAX = 45

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

  function userSideFromMakerKind(makerKind) {
    return makerKind === 'sell' ? 'buy' : 'sell'
  }

  function layerMatches(order, settlement) {
    if (!settlement || settlement === 'any') return true
    const layers =
      order && order.layers && order.layers.length
        ? order.layers
        : [order && order.layer ? order.layer : 'lightning']
    return layers.includes(settlement)
  }

  function orderMatchesPaymentFilter(order, needle, expandPm) {
    const expand = expandPm || expandPaymentMethods
    const n = String(needle || '').trim().toLowerCase()
    if (!n) return true
    return expand(order.payment_methods).some(pm => {
      const hay = pm.toLowerCase()
      return hay === n || hay.includes(n)
    })
  }

  /**
   * Apply active book filters for dropdown counts. Pass exclude to omit one
   * dimension (fiat | payment | side | settlement) while counting options.
   */
  function filterOrdersForCounts(orders, ctx, exclude) {
    const c = ctx || {}
    let list = orders || []
    if (c.side && exclude !== 'side') {
      list = list.filter(o => userSideFromMakerKind(o.kind) === c.side)
    }
    if (c.fiat && exclude !== 'fiat') {
      const fiat = String(c.fiat).trim().toUpperCase()
      list = list.filter(o => (o.fiat_code || '').trim().toUpperCase() === fiat)
    }
    if (c.settlement && exclude !== 'settlement') {
      list = list.filter(o => layerMatches(o, c.settlement))
    }
    if (c.takeableOnly && typeof c.isTakeable === 'function') {
      list = list.filter(o => c.isTakeable(o))
    }
    if (c.tratoOnly && typeof c.platformTratoSupports === 'function') {
      list = list.filter(o => c.platformTratoSupports(o))
    }
    if (
      c.matchMyPayments &&
      typeof c.orderMatchesMyPayments === 'function'
    ) {
      list = list.filter(o => c.orderMatchesMyPayments(o))
    }
    if (c.payment && exclude !== 'payment') {
      list = list.filter(o =>
        orderMatchesPaymentFilter(o, c.payment, expandPaymentMethods)
      )
    }
    return list
  }

  function countByFiatCode(orders) {
    const counts = {}
    for (const o of orders || []) {
      const code = (o.fiat_code || '').trim().toUpperCase()
      if (code) counts[code] = (counts[code] || 0) + 1
    }
    return counts
  }

  function countByPaymentMethod(orders) {
    const counts = {}
    for (const o of orders || []) {
      for (const pm of expandPaymentMethods(o.payment_methods)) {
        const key = pm.trim()
        if (key) counts[key] = (counts[key] || 0) + 1
      }
    }
    return counts
  }

  function truncateFilterLabel(text, maxLen) {
    const limit = maxLen || PM_LABEL_MAX
    const s = String(text || '')
    if (s.length <= limit) return s
    return s.slice(0, Math.max(1, limit - 1)) + '…'
  }

  function formatFiatOptions(counts) {
    return Object.keys(counts || {})
      .sort()
      .map(code => ({
        label: `${code} (${counts[code]})`,
        value: code,
        count: counts[code]
      }))
  }

  function formatPaymentOptions(counts, opts) {
    const bag = counts || {}
    const keys = Object.keys(bag)
    const byFreqThenName = (a, b) => {
      const diff = bag[b] - bag[a]
      return diff !== 0 ? diff : a.localeCompare(b)
    }
    const ranked = keys.slice().sort(byFreqThenName)
    const top10 = new Set(ranked.slice(0, 10))
    const top = ranked.filter(k => top10.has(k))
    const rest = keys.filter(k => !top10.has(k)).sort((a, b) => a.localeCompare(b))
    const maxLen = (opts && opts.maxLabelLen) || PM_LABEL_MAX
    return [...top, ...rest].map(value => {
      const short = truncateFilterLabel(value, maxLen)
      return {
        label: `${short} (${bag[value]})`,
        value,
        fullLabel: value,
        count: bag[value]
      }
    })
  }

  window.TratoBookFilterCounts = {
    PM_LABEL_MAX,
    expandPaymentMethods,
    userSideFromMakerKind,
    layerMatches,
    orderMatchesPaymentFilter,
    filterOrdersForCounts,
    countByFiatCode,
    countByPaymentMethod,
    truncateFilterLabel,
    formatFiatOptions,
    formatPaymentOptions
  }
})()

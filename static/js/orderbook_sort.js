;(function (global) {
  'use strict'

  const STORAGE_KEY = 'trato-orderbook-sort'
  const DEFAULT_KEY = 'newest'

  /** @type {Record<string, { label: string, hint: string }>} */
  const META = {
    newest: {
      label: 'Newest first',
      hint: 'Most recently published offers first'
    },
    oldest: {
      label: 'Oldest first',
      hint: 'Longest-listed offers first'
    },
    amount_desc: {
      label: 'Amount (BTC) — high to low',
      hint: 'Largest fixed sat amounts first; market-price offers last'
    },
    amount_asc: {
      label: 'Amount (BTC) — low to high',
      hint: 'Smallest fixed sat amounts first; market-price offers last'
    },
    fiat_desc: {
      label: 'Fiat range — high to low',
      hint: 'Largest fiat quote or range upper bound first'
    },
    fiat_asc: {
      label: 'Fiat range — low to high',
      hint: 'Smallest fiat quote or range lower bound first'
    },
    market_asc: {
      label: 'Market (currency) A–Z',
      hint: 'Group by fiat currency code'
    },
    premium_asc: {
      label: 'Premium — lowest first',
      hint: 'Closest to spot price (best for buying BTC)'
    },
    premium_desc: {
      label: 'Premium — highest first',
      hint: 'Farthest above spot (often better for selling BTC)'
    },
    platform_asc: {
      label: 'Platform A–Z',
      hint: 'Mostro, Peach, RoboSats, … alphabetically'
    },
    takeable_first: {
      label: 'Take in Trato first',
      hint: 'Offers Trato can take, then newest within each group'
    }
  }

  const ORDER = Object.keys(META)

  function eventTime(o) {
    return Number(o && o.event_created_at) || 0
  }

  function amountSats(o) {
    if (!o || o.is_market_price) return null
    const n = Number(o.amount_sats)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  function fiatLow(o) {
    if (!o) return 0
    if (o.is_range) return Number(o.fiat_min) || 0
    return Number(o.fiat_amount) || 0
  }

  function fiatHigh(o) {
    if (!o) return 0
    if (o.is_range) return Number(o.fiat_max) || 0
    return Number(o.fiat_amount) || 0
  }

  function premium(o) {
    const n = Number(o && o.premium)
    return Number.isFinite(n) ? n : 0
  }

  function platformName(o) {
    return String((o && o.platform) || '').toLowerCase()
  }

  function fiatCode(o) {
    return String((o && o.fiat_code) || '').toUpperCase()
  }

  function tieBreakNewest(a, b) {
    return eventTime(b) - eventTime(a)
  }

  function compareNullableNum(a, b, asc) {
    const aNull = a == null
    const bNull = b == null
    if (aNull && bNull) return 0
    if (aNull) return 1
    if (bNull) return -1
    return asc ? a - b : b - a
  }

  function compareStr(a, b, asc) {
    const r = String(a || '').localeCompare(String(b || ''), undefined, {
      sensitivity: 'base'
    })
    return asc ? r : -r
  }

  /** @type {Record<string, (a: object, b: object) => number>} */
  const COMPARE = {
    newest(a, b) {
      return eventTime(b) - eventTime(a)
    },
    oldest(a, b) {
      return eventTime(a) - eventTime(b)
    },
    amount_desc(a, b) {
      return compareNullableNum(amountSats(a), amountSats(b), false)
    },
    amount_asc(a, b) {
      return compareNullableNum(amountSats(a), amountSats(b), true)
    },
    fiat_desc(a, b) {
      return fiatHigh(b) - fiatHigh(a)
    },
    fiat_asc(a, b) {
      return fiatLow(a) - fiatLow(b)
    },
    market_asc(a, b) {
      return compareStr(fiatCode(a), fiatCode(b), true)
    },
    premium_asc(a, b) {
      return premium(a) - premium(b)
    },
    premium_desc(a, b) {
      return premium(b) - premium(a)
    },
    platform_asc(a, b) {
      return compareStr(platformName(a), platformName(b), true)
    },
    takeable_first(a, b) {
      const at = a && a.takeable === true ? 1 : 0
      const bt = b && b.takeable === true ? 1 : 0
      if (at !== bt) return bt - at
      return eventTime(b) - eventTime(a)
    }
  }

  function normalizeKey(key) {
    return key && META[key] ? key : DEFAULT_KEY
  }

  function sort(orders, key) {
    const k = normalizeKey(key)
    const cmp = COMPARE[k] || COMPARE.newest
    const list = Array.isArray(orders) ? orders.slice() : []
    list.sort((a, b) => {
      const primary = cmp(a, b)
      if (primary !== 0) return primary
      if (k === 'newest' || k === 'oldest' || k === 'takeable_first') return 0
      return tieBreakNewest(a, b)
    })
    return list
  }

  function optionList(labels) {
    const map = labels || {}
    return ORDER.map(value => ({
      value,
      label: (map[value] && map[value].label) || META[value].label,
      hint: (map[value] && map[value].hint) || META[value].hint
    }))
  }

  function sectionSubtitle(key, side, labels) {
    const map = labels || {}
    const k = normalizeKey(key)
    const sortLabel = (map[k] && map[k].label) || META[k].label
    if (side === 'buy') {
      return `You pay fiat and receive sats · ${sortLabel}`
    }
    return `You send sats and receive fiat · ${sortLabel}`
  }

  function readStored(fallback) {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY)
      return normalizeKey(v || fallback || DEFAULT_KEY)
    } catch (e) {
      return normalizeKey(fallback || DEFAULT_KEY)
    }
  }

  function writeStored(key) {
    try {
      sessionStorage.setItem(STORAGE_KEY, normalizeKey(key))
    } catch (e) {
      /* private mode */
    }
  }

  global.TratoOrderbookSort = {
    DEFAULT_KEY,
    STORAGE_KEY,
    ORDER,
    META,
    normalizeKey,
    sort,
    optionList,
    sectionSubtitle,
    readStored,
    writeStored
  }
})(typeof window !== 'undefined' ? window : global)

/** RoboHash avatars — deterministic robot per npub / pubkey / seed.

Extension tile + in-app logo: bundled PNG from seed ``trato`` (set1, bg2).
User avatars: same API with identity pubkeys at runtime.
Njump links: ``njumpProfileUrl`` for hex pubkey or npub.
*/
;(function (global) {
  const ROBOHASH_BASE = 'https://robohash.org'
  const DEFAULT_SET = 'set1'
  const DEFAULT_BG = 'bg2'
  const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

  function isValidHexPubkey(value) {
    const key = String(value || '').toLowerCase().trim()
    return key.length === 64 && /^[0-9a-f]+$/.test(key)
  }

  function url(seed, size) {
    size = size || 80
    const text = String(seed || 'trato-unknown').trim() || 'trato-unknown'
    return (
      `${ROBOHASH_BASE}/${encodeURIComponent(text)}.png` +
      `?size=${size}x${size}&set=${DEFAULT_SET}&bgset=${DEFAULT_BG}`
    )
  }

  /** Stable RoboHash seed: npub when possible, else hex/name/platform:id. */
  function avatarSeed(pubkey, fallbackSeed) {
    const key = String(pubkey || '').toLowerCase().trim()
    if (isValidHexPubkey(key)) {
      const npub = hexToNpub(key)
      if (npub) return npub
      return key
    }
    if (fallbackSeed) return String(fallbackSeed)
    return 'trato-unknown'
  }

  function extensionIcon(size) {
    return url('trato', size || 256)
  }

  function operatorExtensionIcon(size) {
    return url('trato-operator', size || 256)
  }

  function bech32Polymod(values) {
    const GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    let chk = 1
    for (let i = 0; i < values.length; i++) {
      const value = values[i]
      const top = chk >> 25
      chk = ((chk & 0x1ffffff) << 5) ^ value
      for (let j = 0; j < 5; j++) {
        if ((top >> j) & 1) chk ^= GENERATORS[j]
      }
    }
    return chk
  }

  function bech32HrpExpand(hrp) {
    const ret = []
    for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5)
    ret.push(0)
    for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31)
    return ret
  }

  function bech32CreateChecksum(hrp, data) {
    const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0])
    const mod = bech32Polymod(values) ^ 1
    const ret = []
    for (let p = 0; p < 6; p++) ret.push((mod >> (5 * (5 - p))) & 31)
    return ret
  }

  function bech32Encode(hrp, data) {
    const combined = data.concat(bech32CreateChecksum(hrp, data))
    let result = hrp + '1'
    for (let i = 0; i < combined.length; i++) {
      result += BECH32_CHARSET.charAt(combined[i])
    }
    return result
  }

  function convertBits(data, fromBits, toBits, pad) {
    let acc = 0
    let bits = 0
    const ret = []
    const maxv = (1 << toBits) - 1
    for (let i = 0; i < data.length; i++) {
      const value = data[i]
      if (value < 0 || value >> fromBits) return null
      acc = (acc << fromBits) | value
      bits += fromBits
      while (bits >= toBits) {
        bits -= toBits
        ret.push((acc >> bits) & maxv)
      }
    }
    if (pad) {
      if (bits > 0) ret.push((acc << (toBits - bits)) & maxv)
    } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
      return null
    }
    return ret
  }

  function hexToNpub(hex) {
    const h = String(hex || '').toLowerCase().trim()
    if (!/^[0-9a-f]{64}$/.test(h)) return null
    const bytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
    }
    const data = convertBits(Array.from(bytes), 8, 5, true)
    if (!data) return null
    return bech32Encode('npub', data)
  }

  function njumpProfileUrl(pubkeyOrNpub) {
    const raw = String(pubkeyOrNpub || '').trim()
    if (!raw) return null
    if (raw.toLowerCase().startsWith('npub')) return `https://njump.me/${raw}`
    const npub = hexToNpub(raw)
    return npub ? `https://njump.me/${npub}` : null
  }

  global.TratoAvatar = {
    url,
    avatarSeed,
    isValidHexPubkey,
    extensionIcon,
    operatorExtensionIcon,
    hexToNpub,
    njumpProfileUrl,
    EXTENSION_SEED: 'trato',
    OPERATOR_SEED: 'trato-operator',
  }
})(typeof window !== 'undefined' ? window : globalThis)

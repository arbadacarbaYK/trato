;(function () {
  if (!window.TRATO_LOCALE) return
  if (!window.localisation) window.localisation = {}
  Object.keys(window.TRATO_LOCALE).forEach(locale => {
    const base = window.localisation[locale] || {}
    Object.assign(base, window.TRATO_LOCALE[locale])
    window.localisation[locale] = base
  })
})()

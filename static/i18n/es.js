window.TRATO_LOCALE = window.TRATO_LOCALE || {}
window.TRATO_LOCALE.es = {
  trato: {
    wordmark: 'Trato',
    tagline: 'P2P sin custodia: fiat ↔ Bitcoin sobre Nostr y Lightning',
    badges: {
      browse: 'EXPLORAR',
      demo: 'DEMO',
      live: 'EN VIVO',
    },
    tooltips: {
      refresh_book: 'Actualizar libro de órdenes',
      share_public: 'Compartir libro de órdenes público (sin iniciar sesión)',
      refresh_rate: 'Actualizar tipo de cambio (feed de mercado LNbits)',
      toggle_trato_only:
        'Oculta anuncios de Peach, HodlHodl y otras plataformas solo consultables. Muestra únicamente ofertas que Trato puede aceptar (Mostro y RoboSats).',
      toggle_match_payments:
        'Mostrar solo ofertas cuyas etiquetas de pago coincidan con un método que hayas guardado (p. ej. SEPA instantáneo frente a SEPA estándar). El país se deduce de tu IBAN, no de la orden — EUR por sí solo no implica Alemania.',
      take_bond_robosats:
        'Trato reclama esta oferta y paga la fianza del tomador. El depósito y el fiat continúan en RoboSats.',
    },
    share: {
      header: 'Enlace público de consulta',
      caption:
        'Precios de la red pública — sin iniciar sesión. Compártelo en cualquier host LNbits con Trato.',
      copy: 'Copiar enlace',
      preview: 'Abrir vista previa',
    },
    tabs: {
      book: 'Libro de órdenes',
      trades: 'Mis operaciones',
      identity: 'Identidad',
      settings: 'Ajustes',
    },
    public_banner: {
      title: 'Solo consulta.',
      body:
        'Trato es un cliente de la red abierta Nostr — no un mercado curado ni un servicio KYC. No hace falta cuenta en esta página; compártela libremente (clearnet o Tor). Para aceptar una oferta, abre',
      login_link: 'Trato en LNbits',
      body_after: 'en este servidor o en cualquier otra instancia LNbits que ejecute Trato.',
    },
    public_book: {
      open_in_trato: 'Abrir en Trato',
      best_deals: {
        title: 'Mejores ofertas',
        subtitle_buy:
          'Estimación total para comprar BTC: prima + mitad de la comisión de depósito · {fiat}',
        subtitle_sell:
          'Estimación total para vender BTC: prima − mitad de la comisión de depósito · {fiat}',
        pick_filters:
          'Elige una moneda y Comprar o Vender arriba para comparar las mejores ofertas.',
        fee_est: '~{pct}% comisión',
        fees_unknown: 'comisión n/d',
        premium_only: 'solo prima',
        note:
          'Las ofertas Mostro incluyen comisión de depósito estimada; otras plataformas muestran solo la prima.',
        effective: '{score} total',
        vs_market: '{premium} vs mercado',
      },
      filter_take_in_trato: 'Aceptar en Trato',
      uncheck_takeable:
        ' Desactiva «Aceptar en Trato» para ver Peach, HodlHodl y otras plataformas solo consultables en los relays.',
    },
    filters: {
      i_want_to: 'Quiero',
      currency: 'Moneda',
      settlement: 'Liquidación',
      buy_btc: 'Comprar BTC',
      sell_btc: 'Vender BTC',
      any_settlement: 'Cualquier liquidación',
      lightning: 'Lightning',
      onchain: 'On-chain',
      payment_method: 'Método de pago',
      payment_method_empty: 'No hay métodos compatibles en este libro',
      trato_only: 'Aceptar en Trato',
      match_payments: 'Coincidir con mis métodos de pago',
      sort_by: 'Ordenar por',
    },
    sort: {
      newest: 'Más recientes primero',
      newest_hint: 'Primero las ofertas publicadas más recientemente',
      oldest: 'Más antiguas primero',
      oldest_hint: 'Primero las ofertas con más tiempo en el libro',
      amount_desc: 'Importe (BTC) — de mayor a menor',
      amount_desc_hint:
        'Primero los importes fijos en sats más altos; al final las ofertas a precio de mercado',
      amount_asc: 'Importe (BTC) — de menor a mayor',
      amount_asc_hint:
        'Primero los importes fijos en sats más bajos; al final las ofertas a precio de mercado',
      fiat_desc: 'Rango fiat — de mayor a menor',
      fiat_desc_hint: 'Primero la cotización fiat más alta o el límite superior del rango',
      fiat_asc: 'Rango fiat — de menor a mayor',
      fiat_asc_hint: 'Primero la cotización fiat más baja o el límite inferior del rango',
      market_asc: 'Mercado (moneda) A–Z',
      market_asc_hint: 'Agrupar por código de moneda fiat',
      premium_asc: 'Prima — la más baja primero',
      premium_asc_hint: 'Más cerca del precio spot (mejor para comprar BTC)',
      premium_desc: 'Prima — la más alta primero',
      premium_desc_hint: 'Más por encima del spot (a menudo mejor para vender BTC)',
      platform_asc: 'Plataforma A–Z',
      platform_asc_hint: 'Mostro, Peach, RoboSats, … en orden alfabético',
      takeable_first: 'Aceptables en Trato primero',
      takeable_first_hint: 'Ofertas que Trato puede aceptar; dentro de cada grupo, las más recientes',
    },
    market: {
      loading_price: 'Cargando precio de BTC…',
      price_unavailable: 'Precio de BTC no disponible',
      btc_line: '1 BTC ≈ {price} {fiat}',
      fiat_line: '· 1 {fiat} ≈ {sats} sats',
      market_price: 'precio de mercado',
      vs_market: '· {premium} respecto al mercado',
    },
    orderbook: {
      loading: 'Cargando libro de órdenes en vivo…',
      no_matching: 'No hay ofertas que coincidan — prueba a quitar filtros o actualizar.',
      relay_error: 'Error de relay: {error} — revisa Ajustes → Relays.',
      no_mostro_title: 'No hay ofertas de Mostro',
      no_mostro_body:
        'en tus relays ahora mismo — {summary}. Abre RoboSats / Peach en sus propias apps para operar con esos anuncios.',
      no_mostro_trato_only_title: 'No hay ofertas aceptables en el libro',
      no_mostro_trato_only_body:
        'Tus relays tienen {summary}, pero aún no hay nada que Trato pueda aceptar. Desactiva «Aceptar en Trato» para consultarlas, o quédate en modo Demo para ver ofertas de ejemplo de Mostro.',
      offer: 'oferta',
      offers: 'ofertas',
      mostro: 'Mostro',
      synced: 'sincronizado {ago}',
      relay_sync_failed: 'fallo de sincronización del relay',
      filtering: 'Filtrando…',
      connecting: 'conectando…',
      section_buy_title: 'Comprar BTC',
      section_buy_sub: 'Pagas fiat y recibes sats · primero las ofertas más recientes',
      section_sell_title: 'Vender BTC',
      section_sell_sub: 'Envías sats y recibes fiat · primero las ofertas más recientes',
      no_section: 'Ninguna oferta de {title} coincide con tus filtros.',
      no_section_filtered: 'Ninguna oferta de {title} con tus filtros actuales.',
      no_section_other:
        'No hay ofertas de {title} aquí — mira la otra sección más abajo para ofertas compatibles.',
      no_section_empty: 'No hay ofertas de {title} en el libro ahora mismo.',
      opposite_side_hint_buy:
        'No hay ofertas para comprar BTC con estos filtros — pero {count} {offers} donde vendes BTC. Prueba «Vender BTC» en Quiero.',
      opposite_side_hint_sell:
        'No hay ofertas para vender BTC con estos filtros — pero {count} {offers} donde compras BTC. Prueba «Comprar BTC» en Quiero.',
      intent_buy: 'Mostrando ofertas donde compras BTC (pagas fiat, recibes sats)',
      intent_sell: 'Mostrando ofertas donde vendes BTC (envías sats, recibes fiat)',
      fiat_empty:
        'No hay ofertas en {code} en los relays ahora mismo — prueba a quitar el filtro de moneda.',
      fiat_filtered:
        'Ninguna oferta en {code} coincide con tus filtros. Aceptar una operación en Trato no elimina anuncios del libro público.',
      fiat_filtered_trato_only:
        ' Desactiva «Aceptar en Trato» — muchos anuncios en EUR son de RoboSats/Peach.',
      platform_take: 'Trato puede aceptar ofertas de {platform}',
      platform_take_setup: ' cuando la configuración esté completa',
      platform_take_live:
        'Trato puede aceptar ofertas de {platforms} en esta app (operativa en vivo activada).',
      platform_take_demo:
        'Trato puede aceptar ofertas de {platforms} en esta app (modo práctica — desactiva Demo en Ajustes para operar en vivo).',
      platform_take_pending:
        'Trato podrá aceptar ofertas de {platforms} cuando la configuración esté completa (consulta Ajustes).',
      platform_not_takeable:
        'Los anuncios de {platform} son solo para consultar precios — abre {platform} para operar con ellos.',
      platform_browse: 'Solo consulta — abre {platform} para operar con este anuncio.',
      verified_chip: 'Verificado',
      verified_tooltip:
        'La API del coordinador confirmó que este anuncio sigue siendo público en la plataforma de origen.',
      unverified_chip: 'Solo relay',
      unverified_tooltip:
        'Visto en relays Nostr, pero aún no confirmado en vivo en la plataforma. Abre la app de origen o espera a la sincronización.',
      payment_match_tooltip: 'Coincide con tu perfil de pago',
    },
    user_action: {
      buy: 'Comprar BTC',
      sell: 'Vender BTC',
      buy_detail: 'Pagar {fiat} · recibir BTC',
      sell_detail: 'Recibir {fiat} · enviar BTC',
      money_sell: 'Envías los sats · recibes fiat',
      money_buy: 'Recibes los sats · envías fiat',
    },
    buttons: {
      take: 'Aceptar',
      take_pending: 'Aceptando…',
      fix_amount: 'Fijar importe',
      payment_sent: 'Pago enviado',
      open_platform: 'Abrir en {platform}',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      open: 'Abrir',
      create_order: 'Crear orden',
      export_taxes: 'Exportar para impuestos',
      clear_demo: 'Borrar todas las operaciones demo ({count})',
      continue: 'Continuar',
      set_spot: 'Fijar spot',
      save: 'Guardar',
      done: 'Listo',
      take_bond: 'Aceptar (fianza)',
      continue_robosats: 'Continuar en RoboSats',
    },
    trades: {
      empty_title: 'Aún no hay operaciones',
      empty_body:
        'Acepta una oferta del libro de órdenes o crea tu propia orden para empezar.',
      role_maker: 'Creador',
      role_taker: 'Aceptador',
      waiting_taker: 'Esperando aceptador',
    },
    settings: {
      trading_mostro_live:
        'Mostro — aceptación en vivo activada (mainnet + monedero con hold invoice).',
      trading_mostro_demo:
        'Mostro — operaciones de práctica mientras el modo Demo esté activo en Ajustes.',
      trading_mostro_practice:
        'Mostro — desactiva el modo Demo y activa mainnet + hold invoices LND para depósito en garantía en vivo.',
      trading_robosats_live:
        'RoboSats — reclamar oferta + fianza del tomador vía NWC; termina en RoboSats.',
      trading_robosats_demo:
        'RoboSats — recorrido completo de práctica en Demo (simulado). Conecta NWC arriba para fianzas reales.',
      trading_robosats_setup:
        'RoboSats — conecta NWC arriba para fianzas en vivo, o usa Demo para practicar.',
      trading_browse_only: 'Peach, lnp2pbot… — solo consulta; abre su app para operar.',
      robosats_bonds_title: 'RoboSats (solo fianza del tomador)',
      robosats_bonds_body:
        'Conecta NWC para reclamar una oferta RoboSats en vivo y pagar la fianza del tomador. Depósito, chat y fiat ocurren en el coordinador RoboSats, no en Trato. Demo practica localmente.',
    },
    identity: {
      subtitle: 'Identidad de trading en Nostr',
      edit_profile: 'Editar perfil',
      edit_caption:
        'El nombre y el avatar se publican en relays Nostr — otros traders los ven en el libro de órdenes.',
      display_name: 'Nombre visible',
      username: 'Nombre de usuario',
      username_hint: 'Identificador corto opcional (campo name de Nostr)',
      avatar_url: 'URL del avatar',
      avatar_hint: 'Enlace https:// a una imagen cuadrada',
      bio: 'Biografía',
      nip05: 'NIP-05',
      nip05_hint: 'Dirección verificada opcional, p. ej. tu@dominio.com',
      lud16: 'Dirección Lightning (Nostr)',
      lud16_hint:
        'lud16 opcional en tu perfil Nostr — tu@dominio.com. Trato puede ofrecerla cuando configures la recepción de Bitcoin.',
      no_public_profile:
        'Aún no hay nombre público en los relays — define uno para que otros te reconozcan.',
      loading_profile: 'Cargando perfil…',
      load_failed: 'No se pudo cargar el perfil desde los relays.',
      save_failed: 'No se pudo publicar el perfil — revisa los relays en Ajustes.',
      saved: 'Perfil publicado en Nostr',
      name_required: 'Introduce un nombre visible o un nombre de usuario.',
      bitcoin_receive_title: 'Recepción de Bitcoin',
      bitcoin_receive_sub:
        'Dirección Lightning, dirección on-chain o NWC — se comparte con el vendedor cuando compras Bitcoin',
      bitcoin_receive_add: 'Añadir',
      bitcoin_receive_empty:
        'Aún no hay dirección de recepción — añade una dirección Lightning o Bitcoin para que los vendedores sepan dónde enviarte sats.',
      bitcoin_receive_lnurlp_install: 'En esta instancia LNbits puedes crear una con la extensión',
      bitcoin_receive_pick_source:
        'Elige una dirección Lightning — de LNURLp en esta instancia y/o tu perfil Nostr:',
      bitcoin_receive_nostr_only_hint:
        'Añade lud16 en Editar perfil, o activa LNURLp en este monedero, y actualiza.',
    },
    columns: {
      role: 'Rol',
      side: 'Lado',
      fiat: 'Fiat',
      sats: 'Sats',
      status: 'Estado',
      created: 'Creado',
    },
    warnings: {
      relay_sync:
        'Problema de sincronización de relays: {error}. Revisa las URLs de relay en Ajustes y actualiza el libro.',
      health:
        'No se pudo cargar el estado de Trato — {detail}. Recarga la página o comprueba LNbits.',
      identity:
        'No se pudo cargar tu identidad de trading — {detail}. Abre la pestaña Identidad para configurarla.',
      session_expired: 'Sesión caducada — recarga la página e inicia sesión de nuevo en LNbits.',
      network:
        'Trato no pudo contactar con el servidor — comprueba que LNbits esté en marcha y actualiza.',
    },
    events: {
      you: 'Tú',
      partner: 'Contraparte',
      mostro: 'Mostro',
      rated_you: 'Tu contraparte te valoró {stars}/5',
      rated_you_short: 'Tu contraparte te valoró',
      can_rate: 'Puedes valorar a tu contraparte',
    },
    actions: {
      take_buy: 'Aceptaste la orden de compra',
      take_sell: 'Aceptaste la orden de venta',
      pay_invoice: 'Pagar factura de depósito en garantía',
      hold_accepted: 'Depósito en garantía financiado',
      add_invoice: 'Factura del comprador solicitada',
      buyer_invoice_accepted: 'Factura del comprador aceptada',
      fiat_sent: 'Pago enviado',
      release: 'Bitcoin liberado',
      cancel: 'Operación cancelada',
      dispute: 'Disputa abierta',
      take: 'Orden aceptada',
      rate: 'Valoración disponible',
      rate_received: 'Valoración recibida',
    },
    trade: {
      dispute_banner_title: 'Disputa abierta — esperando a un mediador',
      pay_seller: 'Pagar al vendedor',
      pay_via: 'Pagar vía {method}',
      payment_sent_hint: 'Usa la referencia del chat si hace falta. Después pulsa «Pago enviado».',
      waiting_release:
        'Marcaste el pago como enviado. El vendedor debería liberar los sats a tu dirección de recepción — consulta el chat para novedades.',
      seller_release_title: 'El comprador marcó el pago como enviado — libera el Bitcoin',
      waiting_seller_pay:
        'Esperando a que el vendedor indique cómo pagar. Consulta el chat de abajo.',
      completed_title: 'Operación completada',
      completed_onchain_buy:
        'El Bitcoin debería llegar a la dirección de tu monedero. Deja tiempo para las confirmaciones de la red.',
      completed_lightning_buy: 'Los sats deberían aparecer en tu monedero Lightning en breve.',
      completed_sell: 'Liberaste el Bitcoin. Esta operación ha terminado.',
      privacy_tip_expand: 'Opcional — mejorar la privacidad',
      privacy_tip_expand_caption: 'Mezcla tus monedas para que cueste más vincularlas a esta operación',
      privacy_tip_intro:
        'El Bitcoin on-chain es público. Opcionalmente puedes mezclarlo con monedas de otras personas — un proceso llamado coinjoin — para que cueste más rastrearlo hasta esta operación.',
      privacy_tip_step1: 'Instala Wasabi Wallet en tu ordenador (gratis, código abierto)',
      privacy_tip_step2: 'Cuando llegue tu Bitcoin, envíalo a tu monedero Wasabi',
      privacy_tip_step3:
        'En Wasabi, inicia una ronda de coinjoin — tus monedas se mezclan con las de otros',
      privacy_tip_wasabi: 'Guía de configuración de Wasabi',
      privacy_tip_guide: '¿Qué es coinjoin?',
      privacy_tip_dismiss: 'No volver a mostrar',
      robosats_continue_banner: 'Fianza del tomador pagada. Continúa depósito y fiat en RoboSats.',
      robosats_live_chip: 'Fianza pagada — termina en RoboSats',
      robosats_timeline_note:
        'Fianza pagada en Trato. Depósito y fiat continúan en RoboSats — usa el enlace de arriba.',
    },
    notify: {
      copied: 'Copiado',
      browse_copied: 'Enlace de consulta copiado',
      rating_sent: 'Valoración enviada',
      order_created: 'Orden creada — continúa en tu operación',
      order_canceled: 'Orden cancelada',
      trade_removed: 'Operación eliminada',
      tax_exported: 'Exportación fiscal descargada',
      login_first: 'Primero inicia sesión en LNbits en este servidor.',
      enter_fiat: 'Introduce un importe en fiat',
      enter_sats: 'Introduce un importe en sats o usa precio de mercado',
      no_demo_trades: 'No hay operaciones demo que borrar',
      profile_ready: 'Perfil de trader listo',
      clearing_demo: 'Borrando operaciones demo…',
      robosats_bond_paid: 'Fianza del tomador pagada — continúa en RoboSats',
    },
    confirm: {
      cancel_order_title: '¿Cancelar esta orden?',
      cancel_order_ok: 'Cancelar orden',
      remove_history_title: '¿Eliminar del historial?',
      delete_demo_title: '¿Eliminar las {count} operaciones demo?',
      delete_all: 'Eliminar todo',
    },
    detail: {
      pick_payment_method:
        'Las comisiones y el paso de pago usan esta vía — elígela antes de aceptar.',
      robosats_live_banner:
        'Trato solo reclama esta oferta y paga la fianza del tomador. Depósito y fiat continúan en el coordinador RoboSats.',
      robosats_live_link: 'Abrir en RoboSats',
    },
    market_hint: {
      default:
        'Precio de BTC según tipos de cambio LNbits. Elige un filtro de moneda para cambiarlo.',
      wallet:
        'Precio de BTC en {fiat} — según tu monedero LNbits / valor por defecto de la instancia. Elige una moneda en el filtro para sustituirlo.',
    }
  }
}

window.TRATO_LOCALE = window.TRATO_LOCALE || {}
window.TRATO_LOCALE.pt = {
  trato: {
    wordmark: 'Trato',
    tagline: 'P2P sem custódia: fiat ↔ Bitcoin via Nostr e Lightning',
    badges: {
      browse: 'EXPLORAR',
      demo: 'DEMO',
      live: 'AO VIVO',
    },
    tooltips: {
      refresh_book: 'Atualizar livro de ofertas',
      share_public: 'Compartilhar livro de ofertas público (sem login)',
      refresh_rate: 'Atualizar cotação (feed de mercado LNbits)',
      toggle_trato_only:
        'Oculta anúncios da Peach, HodlHodl e outras plataformas só para consulta. Mostra apenas ofertas que o Trato pode aceitar (Mostro e RoboSats).',
      toggle_match_payments:
        'Mostrar apenas ofertas cujas tags de pagamento correspondam a um método que você salvou (ex.: SEPA Instantâneo vs SEPA padrão). O país vem do seu IBAN, não da ordem — EUR sozinho não significa Alemanha.',
      take_bond_robosats:
        'O Trato reivindica esta oferta e paga o título do tomador. Escrow e fiat continuam no RoboSats.',
    },
    share: {
      header: 'Link público de consulta',
      caption:
        'Preços da rede pública — sem login. Compartilhe em qualquer host LNbits com Trato.',
      copy: 'Copiar link',
      preview: 'Abrir prévia',
    },
    tabs: {
      book: 'Livro de ofertas',
      trades: 'Minhas negociações',
      identity: 'Identidade',
      settings: 'Configurações',
    },
    public_banner: {
      title: 'Somente consulta.',
      body:
        'Trato é um cliente da rede aberta Nostr — não um mercado curado nem serviço de KYC. Sem conta nesta página; compartilhe livremente (clearnet ou Tor). Para aceitar uma oferta, abra',
      login_link: 'Trato no LNbits',
      body_after: 'neste servidor ou em qualquer outra instância LNbits que rode Trato.',
    },
    public_book: {
      open_in_trato: 'Abrir no Trato',
      best_deals: {
        title: 'Melhores ofertas',
        subtitle_buy:
          'Estimativa total para comprar BTC: prémio + metade da taxa de escrow · {fiat}',
        subtitle_sell:
          'Estimativa total para vender BTC: prémio − metade da taxa de escrow · {fiat}',
        pick_filters:
          'Escolha uma moeda e Comprar ou Vender acima para comparar as melhores ofertas.',
        fee_est: '~{pct}% taxa',
        fees_unknown: 'taxa n/d',
        premium_only: 'só prémio',
        note:
          'Ofertas Mostro incluem taxa de escrow estimada; outras plataformas mostram só o prémio.',
        effective: '{score} total',
        vs_market: '{premium} vs mercado',
        loading: 'A carregar melhores ofertas…',
        no_offers:
          'Ainda não há ofertas classificadas para {fiat} — tente outra moeda ou atualize.',
      },
      filter_take_in_trato: 'Aceitar no Trato',
      uncheck_takeable:
        ' Desative “Aceitar no Trato” para ver Peach, HodlHodl e outras plataformas só para consulta nos relays.',
    },
    filters: {
      i_want_to: 'Quero',
      currency: 'Moeda',
      settlement: 'Liquidação',
      buy_btc: 'Comprar BTC',
      sell_btc: 'Vender BTC',
      any_settlement: 'Qualquer liquidação',
      lightning: 'Lightning',
      onchain: 'On-chain',
      payment_method: 'Forma de pagamento',
      payment_method_empty: 'Nenhum método compatível neste livro',
      trato_only: 'Aceitar no Trato',
      match_payments: 'Combinar com meus métodos de pagamento',
      sort_by: 'Ordenar por',
    },
    sort: {
      newest: 'Mais recentes primeiro',
      newest_hint: 'Ofertas publicadas mais recentemente primeiro',
      oldest: 'Mais antigas primeiro',
      oldest_hint: 'Ofertas há mais tempo no livro primeiro',
      amount_desc: 'Valor (BTC) — maior para menor',
      amount_desc_hint:
        'Maiores valores fixos em sats primeiro; ofertas a preço de mercado por último',
      amount_asc: 'Valor (BTC) — menor para maior',
      amount_asc_hint:
        'Menores valores fixos em sats primeiro; ofertas a preço de mercado por último',
      fiat_desc: 'Faixa fiat — maior para menor',
      fiat_desc_hint: 'Maior cotação fiat ou limite superior da faixa primeiro',
      fiat_asc: 'Faixa fiat — menor para maior',
      fiat_asc_hint: 'Menor cotação fiat ou limite inferior da faixa primeiro',
      market_asc: 'Mercado (moeda) A–Z',
      market_asc_hint: 'Agrupar por código da moeda fiat',
      premium_asc: 'Prêmio — menor primeiro',
      premium_asc_hint: 'Mais próximo do preço spot (melhor para comprar BTC)',
      premium_desc: 'Prêmio — maior primeiro',
      premium_desc_hint: 'Mais acima do spot (geralmente melhor para vender BTC)',
      platform_asc: 'Plataforma A–Z',
      platform_asc_hint: 'Mostro, Peach, RoboSats, … em ordem alfabética',
      takeable_first: 'Aceitáveis no Trato primeiro',
      takeable_first_hint: 'Ofertas que o Trato pode aceitar; dentro de cada grupo, as mais recentes',
    },
    market: {
      loading_price: 'Carregando preço do BTC…',
      price_unavailable: 'Preço do BTC indisponível',
      btc_line: '1 BTC ≈ {price} {fiat}',
      fiat_line: '· 1 {fiat} ≈ {sats} sats',
      market_price: 'preço de mercado',
      vs_market: '· {premium} vs mercado',
    },
    orderbook: {
      loading: 'Carregando livro de ofertas ao vivo…',
      no_matching: 'Nenhuma oferta compatível — tente limpar os filtros ou atualizar.',
      relay_error: 'Erro de relay: {error} — verifique Configurações → Relays.',
      no_mostro_title: 'Nenhuma oferta Mostro',
      no_mostro_body:
        'nos seus relays agora — {summary}. Abra RoboSats / Peach nos apps deles para negociar esses anúncios.',
      no_mostro_trato_only_title: 'Nenhuma oferta aceitável no livro',
      no_mostro_trato_only_body:
        'Seus relays têm {summary}, mas ainda não há nada que o Trato possa aceitar. Desative “Aceitar no Trato” para consultá-las, ou fique no modo Demo para ofertas Mostro de exemplo.',
      offer: 'oferta',
      offers: 'ofertas',
      mostro: 'Mostro',
      synced: 'sincronizado {ago}',
      relay_sync_failed: 'falha na sincronização do relay',
      filtering: 'Filtrando…',
      connecting: 'conectando…',
      section_buy_title: 'Comprar BTC',
      section_buy_sub: 'Você paga fiat e recebe sats · ofertas mais recentes primeiro',
      section_sell_title: 'Vender BTC',
      section_sell_sub: 'Você envia sats e recebe fiat · ofertas mais recentes primeiro',
      no_section: 'Nenhuma oferta de {title} combina com seus filtros.',
      no_section_filtered: 'Nenhuma oferta de {title} com seus filtros atuais.',
      no_section_other:
        'Nenhuma oferta de {title} aqui — veja a outra seção abaixo para ofertas compatíveis.',
      no_section_empty: 'Nenhuma oferta de {title} no livro agora.',
      opposite_side_hint_buy:
        'Nenhuma oferta para comprar BTC com estes filtros — mas {count} {offers} em que você vende BTC. Tente “Vender BTC” em Quero.',
      opposite_side_hint_sell:
        'Nenhuma oferta para vender BTC com estes filtros — mas {count} {offers} em que você compra BTC. Tente “Comprar BTC” em Quero.',
      intent_buy: 'Mostrando ofertas em que você compra BTC (paga fiat, recebe sats)',
      intent_sell: 'Mostrando ofertas em que você vende BTC (envia sats, recebe fiat)',
      fiat_empty:
        'Nenhuma oferta em {code} nos relays agora — tente limpar o filtro de moeda.',
      fiat_filtered:
        'Nenhuma oferta em {code} combina com seus filtros. Aceitar uma negociação no Trato não remove anúncios do livro público.',
      fiat_filtered_trato_only:
        ' Desative “Aceitar no Trato” — muitos anúncios em EUR são RoboSats/Peach.',
      platform_take: 'Trato pode aceitar ofertas {platform}',
      platform_take_setup: ' quando a configuração estiver completa',
      platform_take_live:
        'Trato pode aceitar ofertas {platforms} neste app (negociação ao vivo ativada).',
      platform_take_demo:
        'Trato pode aceitar ofertas {platforms} neste app (modo prática — desative Demo em Configurações para ao vivo).',
      platform_take_pending:
        'Trato poderá aceitar ofertas {platforms} quando a configuração estiver completa (veja Configurações).',
      platform_not_takeable:
        'Anúncios {platform} servem só para consultar preços — abra {platform} para negociar.',
      platform_browse: 'Somente consulta — abra {platform} para negociar este anúncio.',
      verified_chip: 'Verificado',
      verified_tooltip:
        'A API do coordenador confirmou que este anúncio ainda está público na plataforma de origem.',
      unverified_chip: 'Só relay',
      unverified_tooltip:
        'Visto nos relays Nostr, mas ainda não confirmado ao vivo na plataforma. Abra o app de origem ou aguarde a sincronização.',
      payment_match_tooltip: 'Combina com seu perfil de pagamento',
    },
    user_action: {
      buy: 'Comprar BTC',
      sell: 'Vender BTC',
      buy_detail: 'Pagar {fiat} · receber BTC',
      sell_detail: 'Receber {fiat} · enviar BTC',
      money_sell: 'Você envia os sats · recebe fiat',
      money_buy: 'Você recebe os sats · envia fiat',
    },
    buttons: {
      take: 'Aceitar',
      take_pending: 'Aceitando…',
      fix_amount: 'Fixar valor',
      payment_sent: 'Pagamento enviado',
      open_platform: 'Abrir no {platform}',
      cancel: 'Cancelar',
      delete: 'Excluir',
      open: 'Abrir',
      create_order: 'Criar ordem',
      export_taxes: 'Exportar para impostos',
      clear_demo: 'Limpar todas as negociações demo ({count})',
      continue: 'Continuar',
      set_spot: 'Definir spot',
      save: 'Salvar',
      done: 'Concluído',
      take_bond: 'Aceitar (título)',
      continue_robosats: 'Continuar no RoboSats',
    },
    trades: {
      empty_title: 'Nenhuma negociação ainda',
      empty_body:
        'Aceite uma oferta do livro de ofertas ou crie sua própria ordem para começar.',
      role_maker: 'Criador',
      role_taker: 'Aceitante',
      waiting_taker: 'Aguardando aceitante',
    },
    settings: {
      trading_mostro_live:
        'Mostro — aceitação ao vivo ativada (mainnet + carteira com hold invoice).',
      trading_mostro_demo:
        'Mostro — negociações de prática enquanto o modo Demo estiver ativo em Configurações.',
      trading_mostro_practice:
        'Mostro — desative o modo Demo e ative mainnet + hold invoices LND para escrow ao vivo.',
      trading_robosats_live: 'RoboSats — reivindicar oferta + título via NWC; conclua no RoboSats.',
      trading_robosats_demo:
        'RoboSats — fluxo completo de prática no Demo (simulado). Conecte NWC acima para títulos reais.',
      trading_robosats_setup:
        'RoboSats — conecte NWC acima para títulos ao vivo, ou use Demo para praticar.',
      trading_browse_only: 'Peach, lnp2pbot… — só consulta; abra o app deles para negociar.',
      robosats_bonds_title: 'RoboSats (apenas título do tomador)',
      robosats_bonds_body:
        'Conecte NWC para reivindicar uma oferta RoboSats ao vivo e pagar o título do tomador. Escrow, chat e fiat ocorrem no coordenador RoboSats — não no Trato. Demo pratica localmente.',
      relay_added: 'Relay added — save settings to use it.',
      relay_already_listed: 'That relay is already in your list.',
    },
    identity: {
      subtitle: 'Identidade de trading no Nostr',
      edit_profile: 'Editar perfil',
      edit_caption:
        'Nome e avatar são publicados nos relays Nostr — outros traders os veem no livro de ofertas.',
      display_name: 'Nome de exibição',
      username: 'Nome de usuário',
      username_hint: 'Identificador curto opcional (campo name do Nostr)',
      avatar_url: 'URL do avatar',
      avatar_hint: 'Link https:// para uma imagem quadrada',
      bio: 'Bio',
      nip05: 'NIP-05',
      nip05_hint: 'Endereço verificado opcional, ex.: voce@dominio.com',
      lud16: 'Endereço Lightning (Nostr)',
      lud16_hint:
        'lud16 opcional no seu perfil Nostr — voce@dominio.com. Trato pode oferecê-lo quando você configurar recebimento de Bitcoin.',
      no_public_profile:
        'Ainda não há nome público nos relays — defina um para que outros o reconheçam.',
      loading_profile: 'Carregando perfil…',
      load_failed: 'Não foi possível carregar o perfil dos relays.',
      save_failed:
        'Não foi possível publicar o perfil — verifique os relays em Configurações.',
      saved: 'Perfil publicado no Nostr',
      name_required: 'Informe um nome de exibição ou nome de usuário.',
      bitcoin_receive_title: 'Recebimento de Bitcoin',
      bitcoin_receive_sub:
        'Endereço Lightning, endereço on-chain ou NWC — compartilhado com o vendedor quando você compra Bitcoin',
      bitcoin_receive_add: 'Adicionar',
      bitcoin_receive_empty:
        'Nenhum endereço de recebimento ainda — adicione um endereço Lightning ou Bitcoin para que os vendedores saibam onde enviar sats.',
      bitcoin_receive_lnurlp_install: 'Nesta instância LNbits você pode criar um com a extensão',
      bitcoin_receive_pick_source:
        'Escolha um endereço Lightning — do LNURLp nesta instância e/ou do seu perfil Nostr:',
      bitcoin_receive_nostr_only_hint:
        'Adicione lud16 em Editar perfil, ou ative LNURLp nesta carteira, e atualize.',
    },
    columns: {
      role: 'Papel',
      side: 'Lado',
      fiat: 'Fiat',
      sats: 'Sats',
      status: 'Status',
      created: 'Criado',
    },
    warnings: {
      relay_sync:
        'Problema na sincronização de relays: {error}. Verifique as URLs de relay em Configurações e atualize o livro.',
      health:
        'Não foi possível carregar o status do Trato — {detail}. Recarregue a página ou verifique o LNbits.',
      identity:
        'Não foi possível carregar sua identidade de trading — {detail}. Abra a aba Identidade para configurar.',
      session_expired: 'Sessão expirada — recarregue a página e faça login no LNbits novamente.',
      network:
        'Trato não conseguiu alcançar o servidor — verifique se o LNbits está rodando e atualize.',
    },
    events: {
      you: 'Você',
      partner: 'Contraparte',
      mostro: 'Mostro',
      rated_you: 'Contraparte avaliou você {stars}/5',
      rated_you_short: 'Contraparte avaliou você',
      can_rate: 'Você pode avaliar sua contraparte',
    },
    actions: {
      take_buy: 'Você aceitou a ordem de compra',
      take_sell: 'Você aceitou a ordem de venda',
      pay_invoice: 'Pagar fatura de escrow',
      hold_accepted: 'Escrow financiado',
      add_invoice: 'Fatura do comprador solicitada',
      buyer_invoice_accepted: 'Fatura do comprador aceita',
      fiat_sent: 'Pagamento enviado',
      release: 'Bitcoin liberado',
      cancel: 'Negociação cancelada',
      dispute: 'Disputa aberta',
      take: 'Ordem aceita',
      rate: 'Avaliação disponível',
      rate_received: 'Avaliação recebida',
    },
    trade: {
      dispute_banner_title: 'Disputa aberta — aguardando mediador',
      pay_seller: 'Pagar ao vendedor',
      pay_via: 'Pagar via {method}',
      payment_sent_hint:
        'Use a referência do chat se necessário. Depois toque em “Pagamento enviado”.',
      waiting_release:
        'Você marcou o pagamento como enviado. O vendedor deve liberar os sats para seu endereço de recebimento — acompanhe o chat.',
      seller_release_title: 'Comprador marcou pagamento como enviado — libere o Bitcoin',
      waiting_seller_pay: 'Aguardando o vendedor informar como pagar. Veja o chat abaixo.',
      completed_title: 'Negociação concluída',
      completed_onchain_buy:
        'O Bitcoin deve chegar ao endereço da sua carteira. Aguarde as confirmações da rede.',
      completed_lightning_buy: 'Os sats devem aparecer na sua carteira Lightning em breve.',
      completed_sell: 'Você liberou o Bitcoin. Esta negociação terminou.',
      privacy_tip_expand: 'Opcional — melhorar privacidade',
      privacy_tip_expand_caption: 'Misture suas moedas para dificultar a ligação com esta negociação',
      privacy_tip_intro:
        'Bitcoin on-chain é público. Opcionalmente você pode misturá-lo com moedas de outras pessoas — um processo chamado coinjoin — para dificultar o rastreamento até esta negociação.',
      privacy_tip_step1: 'Instale o Wasabi Wallet no seu computador (grátis, código aberto)',
      privacy_tip_step2: 'Quando seu Bitcoin chegar, envie para sua carteira Wasabi',
      privacy_tip_step3:
        'No Wasabi, inicie uma rodada de coinjoin — suas moedas são misturadas com as de outros',
      privacy_tip_wasabi: 'Guia de configuração do Wasabi',
      privacy_tip_guide: 'O que é coinjoin?',
      privacy_tip_dismiss: 'Não mostrar novamente',
      robosats_continue_banner: 'Título do tomador pago. Continue escrow e fiat no RoboSats.',
      robosats_live_chip: 'Título pago — conclua no RoboSats',
      robosats_timeline_note:
        'Título pago no Trato. Escrow e fiat continuam no RoboSats — use o link acima.',
    },
    notify: {
      copied: 'Copiado',
      browse_copied: 'Link de consulta copiado',
      rating_sent: 'Avaliação enviada',
      order_created: 'Ordem criada — continue na sua negociação',
      order_canceled: 'Ordem cancelada',
      trade_removed: 'Negociação removida',
      tax_exported: 'Exportação fiscal baixada',
      login_first: 'Faça login no LNbits neste servidor primeiro.',
      enter_fiat: 'Informe um valor em fiat',
      enter_sats: 'Informe um valor em sats ou use preço de mercado',
      no_demo_trades: 'Nenhuma negociação demo para limpar',
      profile_ready: 'Perfil de trader pronto',
      clearing_demo: 'Limpando negociações demo…',
      robosats_bond_paid: 'Título do tomador pago — continue no RoboSats',
    },
    confirm: {
      cancel_order_title: 'Cancelar esta ordem?',
      cancel_order_ok: 'Cancelar ordem',
      remove_history_title: 'Remover do histórico?',
      delete_demo_title: 'Excluir todas as {count} negociação(ões) demo?',
      delete_all: 'Excluir tudo',
    },
    detail: {
      pick_payment_method: 'Taxas e a etapa de pagamento usam este meio — escolha antes de aceitar.',
      robosats_live_banner:
        'O Trato apenas reivindica esta oferta e paga o título do tomador. Escrow e fiat continuam no coordenador RoboSats.',
      robosats_live_link: 'Abrir no RoboSats',
    },
    market_hint: {
      default:
        'Preço do BTC pelas cotações LNbits. Escolha um filtro de moeda para alterar.',
      wallet:
        'Preço do BTC em {fiat} — da sua carteira LNbits / padrão da instância. Escolha uma moeda no filtro para substituir.',
    }
  }
}

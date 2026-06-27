window.TRATO_LOCALE = window.TRATO_LOCALE || {}
window.TRATO_LOCALE.ru = {
  trato: {
    wordmark: 'Trato',
    tagline: 'Некастодиальный P2P обмен фиат ↔ Bitcoin через Nostr и Lightning',
    badges: {
      browse: 'ОБЗОР',
      demo: 'ДЕМО',
      live: 'LIVE',
    },
    tooltips: {
      refresh_book: 'Обновить книгу ордеров',
      share_public: 'Поделиться публичной книгой ордеров (без входа)',
      refresh_rate: 'Обновить курс (рыночные данные LNbits)',
      toggle_trato_only:
        'Скрывает объявления Peach, HodlHodl и других платформ только для просмотра. Показывает только предложения, которые Trato может принять (Mostro и RoboSats).',
      toggle_match_payments:
        'Показывать только объявления с тегами оплаты, совпадающими с вашими сохранёнными методами (например, SEPA Instant и обычный SEPA). Страна берётся из вашего IBAN, а не из ордера — EUR сам по себе не означает Германию.',
      take_bond_robosats:
        'Trato принимает предложение и платит залог тейкера. Эскроу и фиат — на координаторе RoboSats.',
    },
    share: {
      header: 'Публичная ссылка для просмотра',
      caption:
        'Публичные сетевые цены — без входа. Можно делиться с любого хоста LNbits с Trato.',
      copy: 'Копировать ссылку',
      preview: 'Открыть предпросмотр',
    },
    tabs: {
      book: 'Книга ордеров',
      trades: 'Мои сделки',
      identity: 'Профиль',
      settings: 'Настройки',
    },
    public_banner: {
      title: 'Только просмотр.',
      body:
        'Trato — клиент для открытой сети Nostr, а не курируемая биржа или сервис KYC. На этой странице нет аккаунта; делитесь свободно (clearnet или Tor). Чтобы принять предложение, откройте',
      login_link: 'Trato в LNbits',
      body_after: 'на этом сервере или на любом другом экземпляре LNbits с Trato.',
    },
    public_book: {
      open_in_trato: 'Открыть в Trato',
      best_deals: {
        title: 'Лучшие предложения',
        subtitle_buy: 'Полная оценка покупки BTC: премия + половина комиссии эскроу · {fiat}',
        subtitle_sell: 'Полная оценка продажи BTC: премия − половина комиссии эскроу · {fiat}',
        pick_filters:
          'Выберите валюту и «Купить» или «Продать» выше, чтобы сравнить лучшие предложения.',
        fee_est: '~{pct}% комиссия',
        fees_unknown: 'комиссия н/д',
        premium_only: 'только премия',
        note:
          'В предложениях Mostro учтена оценка комиссии эскроу; на других платформах показана только премия.',
        effective: '{score} всего',
        vs_market: '{premium} к рынку',
      },
      filter_take_in_trato: 'Принять в Trato',
      uncheck_takeable:
        ' Снимите «Принять в Trato», чтобы увидеть Peach, HodlHodl и другие платформы только для просмотра на реле.',
    },
    filters: {
      i_want_to: 'Я хочу',
      currency: 'Валюта',
      settlement: 'Расчёт',
      buy_btc: 'Купить BTC',
      sell_btc: 'Продать BTC',
      any_settlement: 'Любой расчёт',
      lightning: 'Lightning',
      onchain: 'On-chain',
      payment_method: 'Способ оплаты',
      payment_method_empty: 'На этой книге нет подходящих методов',
      trato_only: 'Принять в Trato',
      match_payments: 'Совпадать с моими способами оплаты',
      sort_by: 'Сортировать',
    },
    sort: {
      newest: 'Сначала новые',
      newest_hint: 'Сначала недавно опубликованные предложения',
      oldest: 'Сначала старые',
      oldest_hint: 'Сначала предложения, которые дольше всего в списке',
      amount_desc: 'Сумма (BTC) — от большей к меньшей',
      amount_desc_hint:
        'Сначала крупнейшие фиксированные суммы в sat; предложения по рыночной цене — в конце',
      amount_asc: 'Сумма (BTC) — от меньшей к большей',
      amount_asc_hint:
        'Сначала наименьшие фиксированные суммы в sat; предложения по рыночной цене — в конце',
      fiat_desc: 'Диапазон фиата — от большего к меньшему',
      fiat_desc_hint: 'Сначала наибольшая фиатная сумма или верхняя граница диапазона',
      fiat_asc: 'Диапазон фиата — от меньшего к большему',
      fiat_asc_hint: 'Сначала наименьшая фиатная сумма или нижняя граница диапазона',
      market_asc: 'Рынок (валюта) А–Я',
      market_asc_hint: 'Группировка по коду фиатной валюты',
      premium_asc: 'Премия — сначала ниже',
      premium_asc_hint: 'Ближе к спотовой цене (лучше для покупки BTC)',
      premium_desc: 'Премия — сначала выше',
      premium_desc_hint: 'Дальше от спота (часто лучше для продажи BTC)',
      platform_asc: 'Платформа А–Я',
      platform_asc_hint: 'Mostro, Peach, RoboSats, … по алфавиту',
      takeable_first: 'Сначала доступные в Trato',
      takeable_first_hint:
        'Предложения, которые Trato может принять, затем новые внутри каждой группы',
    },
    market: {
      loading_price: 'Загрузка цены BTC…',
      price_unavailable: 'Цена BTC недоступна',
      btc_line: '1 BTC ≈ {price} {fiat}',
      fiat_line: '· 1 {fiat} ≈ {sats} sats',
      market_price: 'рыночная цена',
      vs_market: '· {premium} к рынку',
    },
    orderbook: {
      loading: 'Загрузка живой книги ордеров…',
      no_matching: 'Нет подходящих предложений — сбросьте фильтры или обновите.',
      relay_error: 'Ошибка реле: {error} — проверьте Настройки → Реле.',
      no_mostro_title: 'Нет предложений Mostro',
      no_mostro_body:
        'на ваших реле прямо сейчас — {summary}. Откройте RoboSats / Peach в их приложениях, чтобы торговать по этим объявлениям.',
      no_mostro_trato_only_title: 'Нет доступных предложений в книге',
      no_mostro_trato_only_body:
        'На ваших реле есть {summary}, но Trato пока не может ничего принять. Отключите «Принять в Trato», чтобы просмотреть их, или оставайтесь в режиме Демо для примеров Mostro.',
      offer: 'предложение',
      offers: 'предложения',
      mostro: 'Mostro',
      synced: 'синхронизировано {ago}',
      relay_sync_failed: 'сбой синхронизации реле',
      filtering: 'Фильтрация…',
      connecting: 'подключение…',
      section_buy_title: 'Купить BTC',
      section_buy_sub: 'Вы платите фиат и получаете sats · сначала новые предложения',
      section_sell_title: 'Продать BTC',
      section_sell_sub: 'Вы отправляете sats и получаете фиат · сначала новые предложения',
      no_section: 'Нет предложений «{title}» по вашим фильтрам.',
      no_section_filtered: 'Нет предложений «{title}» с текущими фильтрами.',
      no_section_other:
        'Здесь нет предложений «{title}» — подходящие смотрите в другом разделе ниже.',
      no_section_empty: 'Сейчас в книге нет предложений «{title}».',
      opposite_side_hint_buy:
        'Нет предложений на покупку BTC с этими фильтрами — но {count} {offers}, где вы продаёте BTC. Попробуйте «Продать BTC» в «Я хочу».',
      opposite_side_hint_sell:
        'Нет предложений на продажу BTC с этими фильтрами — но {count} {offers}, где вы покупаете BTC. Попробуйте «Купить BTC» в «Я хочу».',
      intent_buy:
        'Показаны предложения, где вы покупаете BTC (платите фиат, получаете sats)',
      intent_sell:
        'Показаны предложения, где вы продаёте BTC (отправляете sats, получаете фиат)',
      fiat_empty:
        'На реле сейчас нет предложений в {code} — попробуйте сбросить фильтр валюты.',
      fiat_filtered:
        'Нет предложений в {code} по вашим фильтрам. Принятие сделки в Trato не удаляет объявления из публичной книги.',
      fiat_filtered_trato_only:
        ' Отключите «Принять в Trato» — многие объявления в EUR — это RoboSats/Peach.',
      platform_take: 'Trato может принять предложения {platform}',
      platform_take_setup: ' после завершения настройки',
      platform_take_live:
        'Trato может принять предложения {platforms} в этом приложении (реальная торговля включена).',
      platform_take_demo:
        'Trato может принять предложения {platforms} в этом приложении (режим практики — отключите Демо в Настройках для реальной торговли).',
      platform_take_pending:
        'Trato сможет принять предложения {platforms} после завершения настройки (см. Настройки).',
      platform_not_takeable:
        'Объявления {platform} только для оценки цен — откройте {platform}, чтобы торговать.',
      platform_browse:
        'Только просмотр — откройте {platform}, чтобы торговать по этому объявлению.',
      verified_chip: 'Проверено',
      verified_tooltip:
        'API координатора подтвердил, что объявление всё ещё публично на исходной платформе.',
      unverified_chip: 'Только реле',
      unverified_tooltip:
        'Видно на реле Nostr, но ещё не подтверждено на платформе. Откройте исходное приложение или дождитесь синхронизации.',
      payment_match_tooltip: 'Совпадает с вашим профилем оплаты',
    },
    user_action: {
      buy: 'Купить BTC',
      sell: 'Продать BTC',
      buy_detail: 'Заплатить {fiat} · получить BTC',
      sell_detail: 'Получить {fiat} · отправить BTC',
      money_sell: 'Вы отправляете sats · получаете фиат',
      money_buy: 'Вы получаете sats · отправляете фиат',
    },
    buttons: {
      take: 'Принять',
      take_pending: 'Принять…',
      fix_amount: 'Указать сумму',
      payment_sent: 'Оплата отправлена',
      open_platform: 'Открыть в {platform}',
      cancel: 'Отмена',
      delete: 'Удалить',
      open: 'Открыть',
      create_order: 'Создать ордер',
      export_taxes: 'Экспорт для налогов',
      clear_demo: 'Очистить все демо-сделки ({count})',
      continue: 'Продолжить',
      set_spot: 'Установить спот',
      save: 'Сохранить',
      done: 'Готово',
      take_bond: 'Принять (залог)',
      continue_robosats: 'Продолжить на RoboSats',
    },
    trades: {
      empty_title: 'Сделок пока нет',
      empty_body:
        'Примите предложение из книги ордеров или создайте свой ордер, чтобы начать.',
      role_maker: 'Мейкер',
      role_taker: 'Тейкер',
      waiting_taker: 'Ожидание тейкера',
    },
    settings: {
      trading_mostro_live: 'Mostro — реальное принятие включено (mainnet + кошелёк с hold-invoice).',
      trading_mostro_demo: 'Mostro — тренировочные сделки, пока включён режим Демо в Настройках.',
      trading_mostro_practice:
        'Mostro — отключите режим Демо и включите mainnet + LND hold invoices для реального эскроу.',
      trading_robosats_live:
        'RoboSats — принять предложение + залог тейкера через NWC; завершите сделку на RoboSats.',
      trading_robosats_demo:
        'RoboSats — полный тренировочный проход в Демо (симуляция). Подключите NWC для реального залога.',
      trading_robosats_setup:
        'RoboSats — подключите NWC для залога вживую или используйте Демо для практики.',
      trading_browse_only: 'Peach, lnp2pbot… — только просмотр; откройте их приложение для торговли.',
      robosats_bonds_title: 'RoboSats (только залог тейкера)',
      robosats_bonds_body:
        'Подключите NWC, чтобы принять живое предложение RoboSats и оплатить залог тейкера. Эскроу, чат и фиат — на координаторе RoboSats, не в Trato. В Демо — локальная тренировка.',
    },
    identity: {
      subtitle: 'Торговая личность Nostr',
      edit_profile: 'Редактировать профиль',
      edit_caption:
        'Имя и аватар публикуются на реле Nostr — другие трейдеры видят их в книге ордеров.',
      display_name: 'Отображаемое имя',
      username: 'Имя пользователя',
      username_hint: 'Необязательный короткий ник (поле name в Nostr)',
      avatar_url: 'URL аватара',
      avatar_hint: 'Ссылка https:// на квадратное изображение',
      bio: 'О себе',
      nip05: 'NIP-05',
      nip05_hint: 'Необязательный подтверждённый адрес, например you@domain.com',
      lud16: 'Lightning-адрес (Nostr)',
      lud16_hint:
        'Необязательный lud16 в профиле Nostr — you@domain.com. Trato может предложить его при настройке получения Bitcoin.',
      no_public_profile: 'Публичного имени на реле пока нет — укажите, чтобы вас узнавали.',
      loading_profile: 'Загрузка профиля…',
      load_failed: 'Не удалось загрузить профиль с реле.',
      save_failed: 'Не удалось опубликовать профиль — проверьте реле в Настройках.',
      saved: 'Профиль опубликован в Nostr',
      name_required: 'Введите отображаемое имя или имя пользователя.',
      bitcoin_receive_title: 'Получение Bitcoin',
      bitcoin_receive_sub:
        'Lightning-адрес, on-chain адрес или NWC — передаётся продавцу, когда вы покупаете Bitcoin',
      bitcoin_receive_add: 'Добавить',
      bitcoin_receive_empty:
        'Адреса для получения пока нет — добавьте Lightning-адрес или Bitcoin-адрес, чтобы продавцы знали, куда отправлять sats.',
      bitcoin_receive_lnurlp_install: 'На этом экземпляре LNbits можно создать его с помощью',
      bitcoin_receive_pick_source:
        'Выберите Lightning-адрес — из LNURLp на этом экземпляре и/или из профиля Nostr:',
      bitcoin_receive_nostr_only_hint:
        'Добавьте lud16 в редактировании профиля или включите LNURLp на этом кошельке, затем обновите.',
    },
    columns: {
      role: 'Роль',
      side: 'Сторона',
      fiat: 'Фиат',
      sats: 'Sats',
      status: 'Статус',
      created: 'Создано',
    },
    warnings: {
      relay_sync:
        'Проблема синхронизации реле: {error}. Проверьте URL реле в Настройках, затем обновите книгу.',
      health:
        'Не удалось загрузить статус Trato — {detail}. Перезагрузите страницу или проверьте LNbits.',
      identity:
        'Не удалось загрузить вашу торговую личность — {detail}. Откройте вкладку Профиль для настройки.',
      session_expired: 'Сессия истекла — перезагрузите страницу и снова войдите в LNbits.',
      network:
        'Trato не смог связаться с сервером — проверьте, что LNbits работает, и обновите страницу.',
    },
    events: {
      you: 'Вы',
      partner: 'Контрагент',
      mostro: 'Mostro',
      rated_you: 'Контрагент оценил вас на {stars}/5',
      rated_you_short: 'Контрагент оценил вас',
      can_rate: 'Вы можете оценить контрагента',
    },
    actions: {
      take_buy: 'Вы приняли ордер на покупку',
      take_sell: 'Вы приняли ордер на продажу',
      pay_invoice: 'Оплатить эскроу-счёт',
      hold_accepted: 'Эскроу пополнен',
      add_invoice: 'Запрошен счёт покупателя',
      buyer_invoice_accepted: 'Счёт покупателя принят',
      fiat_sent: 'Оплата отправлена',
      release: 'Bitcoin отправлен',
      cancel: 'Сделка отменена',
      dispute: 'Открыт спор',
      take: 'Ордер принят',
      rate: 'Можно поставить оценку',
      rate_received: 'Оценка получена',
    },
    trade: {
      dispute_banner_title: 'Спор открыт — ожидание арбитра',
      pay_seller: 'Оплатите продавцу',
      pay_via: 'Оплатить через {method}',
      payment_sent_hint:
        'При необходимости используйте реквизиты из чата. Затем нажмите «Оплата отправлена».',
      waiting_release:
        'Вы отметили, что оплата отправлена. Продавец должен отправить sats на ваш адрес получения — следите за обновлениями в чате.',
      seller_release_title: 'Покупатель отметил оплату — отправьте Bitcoin',
      waiting_seller_pay: 'Ожидание реквизитов от продавца. Смотрите чат ниже.',
      completed_title: 'Сделка завершена',
      completed_onchain_buy:
        'Bitcoin поступит на адрес вашего кошелька. Дождитесь подтверждений в сети.',
      completed_lightning_buy: 'Sats скоро появятся в вашем Lightning-кошельке.',
      completed_sell: 'Вы отправили Bitcoin. Сделка завершена.',
      privacy_tip_expand: 'По желанию — улучшить конфиденциальность',
      privacy_tip_expand_caption: 'Смешайте монеты, чтобы их было сложнее связать с этой сделкой',
      privacy_tip_intro:
        'On-chain Bitcoin виден всем. По желанию вы можете смешать его с монетами других людей — это называется coinjoin — чтобы было сложнее отследить связь с этой сделкой.',
      privacy_tip_step1: 'Установите Wasabi Wallet на компьютер (бесплатно, открытый исходный код)',
      privacy_tip_step2: 'Когда Bitcoin поступит, переведите его в Wasabi Wallet',
      privacy_tip_step3: 'В Wasabi запустите раунд coinjoin — ваши монеты смешаются с чужими',
      privacy_tip_wasabi: 'Руководство по настройке Wasabi',
      privacy_tip_guide: 'Что такое coinjoin?',
      privacy_tip_dismiss: 'Больше не показывать',
      robosats_continue_banner: 'Залог тейкера оплачен. Продолжите эскроу и фиат на RoboSats.',
      robosats_live_chip: 'Залог оплачен — завершите на RoboSats',
      robosats_timeline_note:
        'Залог оплачен в Trato. Эскроу и фиат продолжаются на RoboSats — откройте ссылку выше.',
    },
    notify: {
      copied: 'Скопировано',
      browse_copied: 'Ссылка для просмотра скопирована',
      rating_sent: 'Оценка отправлена',
      order_created: 'Ордер создан — продолжите в сделке',
      order_canceled: 'Ордер отменён',
      trade_removed: 'Сделка удалена',
      tax_exported: 'Экспорт для налогов загружен',
      login_first: 'Сначала войдите в LNbits на этом сервере.',
      enter_fiat: 'Введите сумму в фиате',
      enter_sats: 'Введите сумму в sats или используйте рыночную цену',
      no_demo_trades: 'Нет демо-сделок для очистки',
      profile_ready: 'Профиль трейдера готов',
      clearing_demo: 'Очистка демо-сделок…',
      robosats_bond_paid: 'Залог тейкера оплачен — продолжите на RoboSats',
    },
    confirm: {
      cancel_order_title: 'Отменить этот ордер?',
      cancel_order_ok: 'Отменить ордер',
      remove_history_title: 'Удалить из истории?',
      delete_demo_title: 'Удалить все {count} демо-сделок?',
      delete_all: 'Удалить все',
    },
    detail: {
      pick_payment_method: 'Комиссии и шаг оплаты зависят от этого способа — выберите до принятия.',
      robosats_live_banner:
        'Trato только принимает предложение и платит залог тейкера. Эскроу и фиат — на координаторе RoboSats.',
      robosats_live_link: 'Открыть на RoboSats',
    },
    market_hint: {
      default:
        'Цена BTC из курсов обмена LNbits. Выберите фильтр валюты, чтобы изменить.',
      wallet:
        'Цена BTC в {fiat} — по умолчанию из вашего кошелька / экземпляра LNbits. Выберите валюту в фильтре, чтобы переопределить.',
    }
  }
}

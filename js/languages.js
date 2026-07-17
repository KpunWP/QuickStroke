(function (global) {
  'use strict';

  /*
   * Central language registry for QuickStroke.
   * To add another language later:
   * 1) Add one object here.
   * 2) Add locales/<locale>/ui.json with every required section.
   * The existing language pickers will render the new language automatically.
   */
  const LANGUAGE_LIST = Object.freeze([
    Object.freeze({
      code: 'th',
      locale: 'th-TH',
      shortLabel: 'TH',
      nativeLabel: 'ไทย',
      fullNativeLabel: 'ภาษาไทย',
      englishLabel: 'Thai',
      flag: '🇹🇭',
      ariaLabel: 'ภาษาไทย'
    }),
    Object.freeze({
      code: 'en',
      locale: 'en-US',
      shortLabel: 'EN',
      nativeLabel: 'English',
      fullNativeLabel: 'English',
      englishLabel: 'English',
      flag: '🇬🇧',
      ariaLabel: 'English'
    }),
    Object.freeze({
      code: 'ja',
      locale: 'ja-JP',
      shortLabel: 'JA',
      nativeLabel: '日本語',
      fullNativeLabel: '日本語',
      englishLabel: 'Japanese',
      flag: '🇯🇵',
      ariaLabel: '日本語'
    })
  ]);

  const BY_CODE = Object.freeze(Object.fromEntries(
    LANGUAGE_LIST.map((language) => [language.code, language])
  ));

  const CODES = Object.freeze(LANGUAGE_LIST.map((language) => language.code));
  const LOCALE_MAP = Object.freeze(Object.fromEntries(
    LANGUAGE_LIST.map((language) => [language.code, language.locale])
  ));

  function normalise(value, fallback = 'th') {
    const shortCode = String(value || '').split('-')[0].toLowerCase();
    return BY_CODE[shortCode] ? shortCode : (BY_CODE[fallback] ? fallback : CODES[0]);
  }

  function getLanguage(code) {
    return BY_CODE[normalise(code)];
  }

  function safeHandlerName(value, fallback) {
    const candidate = String(value || fallback || '').trim();
    return /^[A-Za-z_$][\w$]*$/.test(candidate) ? candidate : fallback;
  }

  function parseOrder(value) {
    if (!value) return LANGUAGE_LIST;
    const requested = String(value).split(',').map((item) => item.trim()).filter(Boolean);
    const ordered = requested.map((code) => BY_CODE[code]).filter(Boolean);
    const remaining = LANGUAGE_LIST.filter((language) => !requested.includes(language.code));
    return [...ordered, ...remaining];
  }

  function makeOption(language, options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.lang = language.code;
    button.classList.add('qs-language-option');

    if (options.buttonClass) {
      String(options.buttonClass).split(/\s+/).filter(Boolean).forEach((className) => {
        button.classList.add(className);
      });
    }

    if (options.idPrefix) button.id = `${options.idPrefix}${language.code}`;
    button.setAttribute('aria-label', language.ariaLabel);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('onclick', `${options.handler}('${language.code}')`);

    switch (options.variant) {
      case 'native':
        button.textContent = language.nativeLabel;
        break;

      case 'card-detailed': {
        const flag = document.createElement('span');
        flag.className = 'lang-flag';
        flag.textContent = language.flag;

        const textWrap = document.createElement('div');
        const englishName = document.createElement('span');
        englishName.className = 'lang-name';
        englishName.textContent = language.englishLabel;
        const nativeName = document.createElement('span');
        nativeName.className = 'lang-native';
        nativeName.textContent = language.fullNativeLabel;

        textWrap.append(englishName, nativeName);
        button.append(flag, textWrap);
        break;
      }

      case 'card-simple': {
        const flag = document.createElement('span');
        flag.className = 'lang-flag';
        flag.textContent = language.flag;
        const label = document.createElement('span');
        label.className = 'lang-text';
        label.textContent = language.fullNativeLabel;
        button.append(flag, label);
        break;
      }

      case 'compact':
      default:
        button.textContent = language.shortLabel;
        break;
    }

    return button;
  }

  function setActive(target, requestedCode, activeClass) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return;

    const code = normalise(requestedCode);
    const className = activeClass || container.dataset.activeClass || 'active';

    container.querySelectorAll('.qs-language-option[data-lang]').forEach((button) => {
      const isActive = button.dataset.lang === code;
      button.classList.toggle(className, isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    const trigger = container.querySelector('.qs-language-trigger');
    if (trigger) {
      const language = getLanguage(code);
      trigger.textContent = language.shortLabel;
      trigger.setAttribute('aria-label', `${language.ariaLabel} · Change language`);
    }
  }

  function renderPicker(target, suppliedOptions = {}) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return null;

    const options = {
      variant: suppliedOptions.variant || container.dataset.languageVariant || 'compact',
      handler: safeHandlerName(
        suppliedOptions.handler || container.dataset.languageHandler,
        'setLang'
      ),
      activeClass: suppliedOptions.activeClass || container.dataset.activeClass || 'active',
      buttonClass: suppliedOptions.buttonClass || container.dataset.buttonClass || '',
      idPrefix: suppliedOptions.idPrefix || container.dataset.idPrefix || '',
      order: suppliedOptions.order || container.dataset.languageOrder || '',
      activeCode: suppliedOptions.activeCode || sessionStorage.getItem('fast_lang') || 'th'
    };

    const languages = parseOrder(options.order);
    container.replaceChildren();
    container.dataset.languageReady = 'true';

    /* Current TH/EN/JA remains visible. If a fourth language is added,
       compact pickers automatically become a single accessible menu. */
    if (options.variant === 'compact' && languages.length > 3) {
      container.classList.add('qs-language-menu');

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'qs-language-trigger';
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');

      const popover = document.createElement('div');
      popover.className = 'qs-language-popover';
      popover.hidden = true;
      popover.setAttribute('role', 'menu');

      languages.forEach((language) => {
        const option = makeOption(language, {
          ...options,
          variant: 'native',
          buttonClass: 'qs-language-menu-option'
        });
        option.setAttribute('role', 'menuitemradio');
        option.addEventListener('click', () => {
          popover.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
        });
        popover.appendChild(option);
      });

      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const willOpen = popover.hidden;
        popover.hidden = !willOpen;
        trigger.setAttribute('aria-expanded', String(willOpen));
      });

      container.append(trigger, popover);
    } else {
      container.classList.remove('qs-language-menu');
      const fragment = document.createDocumentFragment();
      languages.forEach((language) => fragment.appendChild(makeOption(language, options)));
      container.appendChild(fragment);
    }

    setActive(container, options.activeCode, options.activeClass);
    return container;
  }

  function renderAll(root = document) {
    root.querySelectorAll('[data-language-picker]').forEach((container) => {
      if (container.dataset.languageReady !== 'true') renderPicker(container);
    });
  }

  function injectSharedStyles() {
    if (document.getElementById('qs-language-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'qs-language-shared-styles';
    style.textContent = `
      .qs-language-menu{position:relative}
      .qs-language-trigger{min-width:48px}
      .qs-language-popover{position:absolute;right:0;top:calc(100% + 8px);z-index:1000;min-width:170px;padding:8px;background:#fff;border:1px solid rgba(27,42,58,.14);border-radius:14px;box-shadow:0 14px 34px rgba(27,42,58,.18)}
      .qs-language-popover[hidden]{display:none!important}
      .qs-language-menu-option{display:block;width:100%;min-height:44px;padding:8px 12px;border:0;border-radius:10px;background:transparent;color:#1B2A3A;text-align:left;font:600 15px/1.2 inherit;cursor:pointer}
      .qs-language-menu-option.active,.qs-language-menu-option.on{background:#EAF3FF;color:#135CA8}
    `;
    document.head.appendChild(style);
  }

  injectSharedStyles();
  document.addEventListener('click', () => {
    document.querySelectorAll('.qs-language-popover:not([hidden])').forEach((popover) => {
      popover.hidden = true;
      popover.previousElementSibling?.setAttribute('aria-expanded', 'false');
    });
  });

  global.QuickStrokeLanguages = Object.freeze({
    list: LANGUAGE_LIST,
    codes: CODES,
    localeMap: LOCALE_MAP,
    normalise,
    getLanguage,
    renderPicker,
    renderAll,
    setActive
  });
})(window);

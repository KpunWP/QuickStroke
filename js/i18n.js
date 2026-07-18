// ======================================================
// QuickStroke i18n core
// โหลดและแสดงข้อความจาก locales/<locale>/ui.json
// ======================================================

(function () {
  "use strict";

  const SETTINGS = Object.freeze({
    defaultLocale: "th-TH",
    fallbackLocale: "en-US",
    supportedLocales: ["th-TH", "en-US", "ja-JP"],
    storageKey: "quickstroke_locale",

    // รองรับระบบเดิมชั่วคราว
    legacyStorageKey: "fast_lang"
  });

  const LOCALE_ALIASES = Object.freeze({
    th: "th-TH",
    en: "en-US",
    ja: "ja-JP"
  });

  let activeLocale = SETTINGS.defaultLocale;
  let activeMessages = {};

  /**
   * แปลงค่าภาษา เช่น th → th-TH
   */
  function normalizeLocale(locale) {
    if (!locale) return null;

    const value = String(locale).trim();

    if (LOCALE_ALIASES[value]) {
      return LOCALE_ALIASES[value];
    }

    if (SETTINGS.supportedLocales.includes(value)) {
      return value;
    }

    const lowerValue = value.toLowerCase();

    if (lowerValue.startsWith("th")) return "th-TH";
    if (lowerValue.startsWith("en")) return "en-US";
    if (lowerValue.startsWith("ja")) return "ja-JP";

    return null;
  }

  /**
   * อ่านภาษาที่เคยเลือกไว้
   */
  function getSavedLocale() {
    const currentValue = localStorage.getItem(SETTINGS.storageKey);
    const legacyValue = localStorage.getItem(SETTINGS.legacyStorageKey);

    return (
      normalizeLocale(currentValue) ||
      normalizeLocale(legacyValue) ||
      normalizeLocale(navigator.language) ||
      SETTINGS.defaultLocale
    );
  }

  /**
   * โหลดไฟล์ JSON ของภาษาที่เลือก
   */
  async function fetchLocalePack(locale) {
    const path = `./locales/${locale}/ui.json`;

    const response = await fetch(path, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `Unable to load locale "${locale}" from ${path} (${response.status})`
      );
    }

    const localePack = await response.json();

    if (!localePack || typeof localePack !== "object") {
      throw new Error(`Invalid locale pack: ${locale}`);
    }

    return localePack;
  }

  /**
   * โหลดภาษาที่เลือก หากล้มเหลวให้ fallback เป็นอังกฤษ
   */
  async function loadLocalePack(requestedLocale) {
    const locale =
      normalizeLocale(requestedLocale) || SETTINGS.defaultLocale;

    try {
      return {
        locale,
        messages: await fetchLocalePack(locale)
      };
    } catch (error) {
      console.error(error);

      if (locale === SETTINGS.fallbackLocale) {
        throw error;
      }

      console.warn(
        `Falling back from ${locale} to ${SETTINGS.fallbackLocale}`
      );

      return {
        locale: SETTINGS.fallbackLocale,
        messages: await fetchLocalePack(SETTINGS.fallbackLocale)
      };
    }
  }

  /**
   * อ่านข้อความจาก key แบบ index.title
   */
  function getValueByPath(object, path) {
    return String(path)
      .split(".")
      .reduce((value, key) => {
        if (
          value &&
          typeof value === "object" &&
          Object.prototype.hasOwnProperty.call(value, key)
        ) {
          return value[key];
        }

        return undefined;
      }, object);
  }

  /**
   * แทนค่าตัวแปร เช่น {{number}}
   */
  function interpolate(text, variables = {}) {
    return String(text).replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (match, key) => {
        return Object.prototype.hasOwnProperty.call(variables, key)
          ? String(variables[key])
          : match;
      }
    );
  }

  /**
   * เรียกข้อความด้วย key
   */
  function t(key, variables = {}, fallbackText = "") {
    const value = getValueByPath(activeMessages, key);

    if (typeof value === "string") {
      return interpolate(value, variables);
    }

    console.warn(`Missing translation key: ${key}`);

    return fallbackText || `[${key}]`;
  }

  /**
   * แปล element หนึ่งตัว
   */
  function translateElement(element) {
    const textKey = element.dataset.i18n;
    const htmlKey = element.dataset.i18nHtml;
    const placeholderKey = element.dataset.i18nPlaceholder;
    const ariaLabelKey = element.dataset.i18nAriaLabel;
    const titleKey = element.dataset.i18nTitle;

    if (textKey) {
      element.textContent = t(textKey, {}, element.textContent);
    }

    if (htmlKey) {
      // ใช้ได้กับข้อความที่มี <br> หรือ <b>
      // เนื้อหาต้องมาจาก locale pack ที่โครงการควบคุมเท่านั้น
      element.innerHTML = t(htmlKey, {}, element.innerHTML);
    }

    if (placeholderKey) {
      element.setAttribute(
        "placeholder",
        t(
          placeholderKey,
          {},
          element.getAttribute("placeholder") || ""
        )
      );
    }

    if (ariaLabelKey) {
      element.setAttribute(
        "aria-label",
        t(
          ariaLabelKey,
          {},
          element.getAttribute("aria-label") || ""
        )
      );
    }

    if (titleKey) {
      element.setAttribute(
        "title",
        t(titleKey, {}, element.getAttribute("title") || "")
      );
    }
  }

  /**
   * แปลข้อความทั้งหมดในหน้า
   */
  function applyTranslations(root = document) {
    const selector = [
      "[data-i18n]",
      "[data-i18n-html]",
      "[data-i18n-placeholder]",
      "[data-i18n-aria-label]",
      "[data-i18n-title]"
    ].join(",");

    root.querySelectorAll(selector).forEach(translateElement);

    document.documentElement.lang = activeLocale;
    document.documentElement.dir =
      activeMessages?.meta?.direction || "ltr";
  }

  /**
   * เปลี่ยนภาษา
   */
  async function setLocale(
    requestedLocale,
    options = {}
  ) {
    const {
      persist = true,
      apply = true
    } = options;

    const result = await loadLocalePack(requestedLocale);

    activeLocale = result.locale;
    activeMessages = result.messages;

    if (persist) {
      localStorage.setItem(
        SETTINGS.storageKey,
        activeLocale
      );

      // เก็บค่าแบบเดิมไว้ชั่วคราว เพื่อไม่ให้หน้าอื่นพัง
      localStorage.setItem(
        SETTINGS.legacyStorageKey,
        activeLocale.split("-")[0]
      );
    }

    if (apply) {
      applyTranslations();
    }

    document.dispatchEvent(
      new CustomEvent("quickstroke:localechange", {
        detail: {
          locale: activeLocale,
          messages: activeMessages,
          meta: activeMessages?.meta || null,
          packVersion: activeMessages?.meta?.packVersion || null
        }
      })
    );

    return activeLocale;
  }

  /**
   * เริ่มระบบภาษา
   */
  async function init(options = {}) {
    const requestedLocale =
      options.locale || getSavedLocale();

    return setLocale(requestedLocale, {
      persist: options.persist !== false,
      apply: options.apply !== false
    });
  }

  /**
   * API ที่หน้าอื่นเรียกใช้งานได้
   */
  window.QuickStrokeI18n = Object.freeze({
    init,
    setLocale,
    t,
    applyTranslations,

    getLocale() {
      return activeLocale;
    },

    getMessages() {
      return activeMessages;
    },

    getMeta() {
      return activeMessages?.meta ? { ...activeMessages.meta } : null;
    },

    getPackVersion() {
      return activeMessages?.meta?.packVersion || null;
    },

    getSupportedLocales() {
      return [...SETTINGS.supportedLocales];
    },

    normalizeLocale
  });
})();
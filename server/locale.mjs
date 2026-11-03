export const LOCALES = Object.freeze(["zh-TW", "zh-HK", "zh-CN", "en"]);

export function validLocale(value) {
  return (
    LOCALES.find(
      (locale) => locale.toLowerCase() === String(value ?? "").toLowerCase(),
    ) ?? null
  );
}

export function savedLocale(cookie = "") {
  const matches = String(cookie)
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("hackit-locale="));
  if (matches.length !== 1) return null;
  try {
    return validLocale(
      decodeURIComponent(matches[0].slice("hackit-locale=".length)),
    );
  } catch {
    return null;
  }
}

export function browserLocale(header = "") {
  const choices = String(header)
    .split(",")
    .slice(0, 32)
    .map((part, index) => {
      const [rawTag, ...parameters] = part.trim().split(";");
      const quality = parameters.find((parameter) => /^\s*q=/i.test(parameter));
      const value = quality?.trim().slice(2);
      const q =
        value === undefined
          ? 1
          : /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value)
            ? Number(value)
            : 0;
      return { tag: rawTag.toLowerCase(), q, index };
    })
    .filter((choice) => choice.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of choices) {
    if (/^zh-(?:hant-)?(?:hk|mo)(?:-|$)/.test(tag)) return "zh-HK";
    if (/^zh-(?:tw|hant)(?:-|$)/.test(tag)) return "zh-TW";
    if (/^zh(?:-|$)/.test(tag)) return "zh-CN";
    if (/^en(?:-|$)/.test(tag)) return "en";
  }
  return null;
}

// Country metadata is deliberately unavailable in this deployment. Client and
// proxy country headers are never an authentication mechanism for geolocation.
export function resolveLocale({ query, path, cookie, acceptLanguage } = {}) {
  return (
    validLocale(query) ||
    validLocale(path) ||
    savedLocale(cookie) ||
    browserLocale(acceptLanguage) ||
    "zh-TW"
  );
}

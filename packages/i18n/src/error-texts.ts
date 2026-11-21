import { LOCALE_COOKIE, isLocaleCode, type LocaleCode, type TextDirection } from "./locales.js";

/**
 * The words on the error page and the "page not found" page, in every supported language.
 *
 * Kept apart from the message catalogs on purpose: these screens must still work when the
 * thing that failed is the translation provider or the page tree around it, and the browser
 * side of them must not pull every language catalog into its download — which is why this is
 * its own entry point (`@world-vitality/i18n/error-texts`) rather than part of the package
 * index. The set is small (a title, a sentence and two buttons per screen), so a plain table
 * is enough; typing it as `Record<LocaleCode, …>` makes the compiler refuse a language added
 * to `LOCALES` without its error words.
 */
export type ErrorLocale = LocaleCode;

export interface ErrorTexts {
  dir: TextDirection;
  errorTitle: string;
  errorBody: string;
  retry: string;
  home: string;
  /** "Reference: abc123", shown when the failure carries a code support can look up. */
  reference: (code: string) => string;
  notFoundTitle: string;
  notFoundBody: string;
  explore: string;
}

export const ERROR_TEXTS: Record<ErrorLocale, ErrorTexts> = {
  en: {
    dir: "ltr",
    errorTitle: "Something went wrong on our side",
    errorBody:
      "The page couldn’t load, and nothing you did caused it. Try again, or go back to the home page.",
    retry: "Try again",
    home: "Go to the home page",
    reference: (code) => `Reference: ${code}`,
    notFoundTitle: "We can’t find that page",
    notFoundBody: "The link may be old or mistyped. Here are two good places to start.",
    explore: "Explore the planet",
  },
  es: {
    dir: "ltr",
    errorTitle: "Algo salió mal de nuestro lado",
    errorBody:
      "No se pudo cargar la página, y no fue por nada de lo que hiciste. Inténtalo de nuevo o vuelve a la página de inicio.",
    retry: "Intentar de nuevo",
    home: "Ir a la página de inicio",
    reference: (code) => `Referencia: ${code}`,
    notFoundTitle: "No encontramos esa página",
    notFoundBody:
      "Puede que el enlace sea antiguo o tenga un error. Estos son dos buenos lugares para empezar.",
    explore: "Explorar el planeta",
  },
  fr: {
    dir: "ltr",
    errorTitle: "Un problème est survenu de notre côté",
    errorBody:
      "La page n’a pas pu se charger, et rien de ce que vous avez fait n’en est la cause. Réessayez ou retournez à la page d’accueil.",
    retry: "Réessayer",
    home: "Aller à la page d’accueil",
    reference: (code) => `Référence : ${code}`,
    notFoundTitle: "Cette page est introuvable",
    notFoundBody: "Le lien est peut-être ancien ou mal saisi. Voici deux bons points de départ.",
    explore: "Explorer la planète",
  },
  pt: {
    dir: "ltr",
    errorTitle: "Algo correu mal do nosso lado",
    errorBody:
      "Não foi possível carregar a página, e nada do que fez a causou. Tente novamente ou volte à página inicial.",
    retry: "Tentar novamente",
    home: "Ir para a página inicial",
    reference: (code) => `Referência: ${code}`,
    notFoundTitle: "Não encontramos essa página",
    notFoundBody: "O link pode ser antigo ou ter um erro. Aqui ficam dois bons pontos de partida.",
    explore: "Explorar o planeta",
  },
  ar: {
    dir: "rtl",
    errorTitle: "حدثت مشكلة من جانبنا",
    errorBody:
      "تعذّر تحميل الصفحة، ولم يكن ذلك بسبب أي شيء فعلته. حاول مرة أخرى أو عُد إلى الصفحة الرئيسية.",
    retry: "حاول مرة أخرى",
    home: "الذهاب إلى الصفحة الرئيسية",
    reference: (code) => `المرجع: ${code}`,
    notFoundTitle: "لم نعثر على هذه الصفحة",
    notFoundBody: "ربما يكون الرابط قديمًا أو به خطأ. إليك مكانان جيدان للبدء.",
    explore: "استكشف الكوكب",
  },
};

export function isErrorLocale(value: unknown): value is ErrorLocale {
  return isLocaleCode(value);
}

/**
 * Which language to write the error page in, from what the browser can see: the device's saved
 * choice (the `wv_lang` cookie), else the first of the browser's languages we have, else English.
 * Pure, so it can be tested without a browser.
 */
export function errorLocaleFromBrowser(
  cookieHeader: string,
  languages: readonly string[],
): ErrorLocale {
  const saved = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  if (isErrorLocale(saved)) return saved;
  for (const tag of languages) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isErrorLocale(primary)) return primary;
  }
  return "en";
}

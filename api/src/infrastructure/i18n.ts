import en from '@/locales/en.json';
import es from '@/locales/es.json';
import es_AR from '@/locales/es_AR.json';

type Locale = 'en' | 'es' | 'es_AR';
type Messages = Record<string, unknown>;

const messages: Record<Locale, Messages> = {
  en: en as Messages,
  es: es as Messages,
  es_AR: es_AR as Messages,
};

const FALLBACK_CHAIN: Record<Locale, Locale[]> = {
  en: ['en'],
  es: ['es', 'en'],
  es_AR: ['es_AR', 'es', 'en'],
};

function getValue(obj: Messages, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

/**
 * Translate a key for the given locale with fallback chain (es_AR → es → en).
 * @param locale - User locale (en, es, es_AR)
 * @param key - Dot-notation key (e.g. 'push.newMessage', 'email.verifyTitle')
 * @param vars - Optional interpolation vars (e.g. { count: 5, displayName: 'X' })
 */
export function t(
  locale: string | null | undefined,
  key: string,
  vars?: Record<string, string | number>
): string {
  const normalized = (locale === 'es_AR' || locale === 'es' ? locale : 'en') as Locale;
  const chain = FALLBACK_CHAIN[normalized] ?? FALLBACK_CHAIN.en;

  for (const l of chain) {
    const value = getValue(messages[l], key);
    if (value) {
      return vars ? interpolate(value, vars) : value;
    }
  }
  return key;
}

/**
 * Parse Accept-Language header and return best supported locale.
 * Supports: en, es, es_AR (es-AR).
 */
export function parseAcceptLanguage(header: string | undefined): Locale {
  if (!header?.trim()) return 'en';
  const parts = header.split(',').map((s) => {
    const [lang, q = '1'] = s.trim().split(';q=');
    return { lang: lang.trim().toLowerCase(), q: parseFloat(q) || 1 };
  });
  parts.sort((a, b) => b.q - a.q);

  for (const { lang } of parts) {
    if (lang === 'es-ar' || lang.startsWith('es-ar')) return 'es_AR';
    if (lang === 'es' || lang.startsWith('es-')) return 'es';
    if (lang === 'en' || lang.startsWith('en-')) return 'en';
  }
  return 'en';
}

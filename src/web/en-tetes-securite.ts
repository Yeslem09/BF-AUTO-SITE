/**
 * En-têtes de sécurité posés sur toutes les réponses. La politique de contenu
 * interdit tout script, style ou gestionnaire d'événement en ligne : le HTML ne
 * charge que des fichiers servis par le site lui-même.
 */
export const POLITIQUE_CONTENU = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const DEUX_ANS_EN_SECONDES = 63_072_000

export function enTetesSecurite(urlPublique: string): Readonly<Record<string, string>> {
  const enTetes: Record<string, string> = {
    'content-security-policy': POLITIQUE_CONTENU,
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'cross-origin-opener-policy': 'same-origin',
    'x-frame-options': 'DENY',
  }
  // HSTS n'a de sens que servi en HTTPS : en local, il bloquerait le site.
  if (urlPublique.startsWith('https://')) {
    enTetes['strict-transport-security'] = `max-age=${DEUX_ANS_EN_SECONDES}; includeSubDomains`
  }
  return enTetes
}

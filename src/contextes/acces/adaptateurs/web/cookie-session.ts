import type { CookieSerializeOptions } from '@fastify/cookie'
import { CHEMINS } from '../../../../contrats/index.js'
import type { Session } from '../../domaine/session.js'

const MS_PAR_SECONDE = 1000

/**
 * Attributs du cookie de session (Kano D5, US-33) :
 * - `HttpOnly` : aucun script ne le lit ;
 * - `SameSite=Lax` : un lien de notification ouvert depuis une messagerie web
 *   (navigation d'un autre site) garde la session, alors qu'un POST venu d'un
 *   autre site part sans elle ; `Origin` et le jeton anti-falsification ferment
 *   le reste ;
 * - `Path=/garagiste` : jamais envoyé aux pages publiques ;
 * - `Secure` dès que le site est servi en https (toujours le cas en ligne) ;
 *   en local http, le navigateur refuserait sinon de le garder.
 */
function attributsCommuns(urlPublique: string): CookieSerializeOptions {
  return {
    path: CHEMINS.garagiste,
    httpOnly: true,
    sameSite: 'lax',
    secure: urlPublique.startsWith('https://'),
  }
}

/** Le cookie vit exactement aussi longtemps que la session en base. */
export function optionsCookieSession(
  urlPublique: string,
  session: Session,
  maintenant: Date,
): CookieSerializeOptions {
  const restant = Math.max(0, session.expireLe.getTime() - maintenant.getTime())
  return { ...attributsCommuns(urlPublique), maxAge: Math.floor(restant / MS_PAR_SECONDE) }
}

export function optionsEffacementCookie(urlPublique: string): CookieSerializeOptions {
  return attributsCommuns(urlPublique)
}

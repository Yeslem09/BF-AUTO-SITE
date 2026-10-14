/**
 * Forme d'un jeton opaque (lien de connexion, session) : base64url, assez long
 * pour porter au moins 128 bits d'aléa. Toute autre valeur est écartée avant
 * même d'être cherchée en base.
 */
const FORME_JETON = /^[A-Za-z0-9_-]{22,128}$/

export function estFormeDeJeton(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && FORME_JETON.test(valeur)
}

import { estFormeDeJeton } from '../domaine/jeton.js'
import { prolongationDue, sessionValide, type Session } from '../domaine/session.js'
import type { DepotAcces, Hachage, Horloge } from './ports.js'

export type IdentifierSession = (jetonSession: unknown) => Session | null

/**
 * Session désignée par le jeton du cookie, ou `null` (absente, expirée,
 * révoquée). Une session utilisée est prolongée : 90 jours glissants.
 */
export function creerIdentifierSession(dependances: {
  readonly depot: DepotAcces
  readonly hachage: Hachage
  readonly horloge: Horloge
}): IdentifierSession {
  const { depot, hachage, horloge } = dependances
  return (jetonSession) => {
    if (!estFormeDeJeton(jetonSession)) return null
    const session = depot.trouverSession(hachage.empreinte(jetonSession))
    const maintenant = horloge.maintenant()
    if (session === null || !sessionValide(session, maintenant)) return null
    const echeance = prolongationDue(session, maintenant)
    if (echeance === null) return session
    depot.prolongerSession(session.empreinte, echeance)
    return { ...session, expireLe: echeance }
  }
}

import type { Session } from '../domaine/session.js'
import type { DepotAcces } from './ports.js'

export type FermerSession = (session: Session) => void

/** Déconnexion : la session est oubliée en base, son cookie ne vaut plus rien. */
export function creerFermerSession(dependances: { readonly depot: DepotAcces }): FermerSession {
  return (session) => dependances.depot.supprimerSession(session.empreinte)
}

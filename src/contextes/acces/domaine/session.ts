import { DUREE_SESSION_MS, PAS_DE_PROLONGATION_MS } from './regles.js'

/** Session ouverte sur un téléphone du garagiste, connue par l'empreinte de son jeton. */
export interface Session {
  readonly empreinte: string
  readonly creeLe: Date
  readonly expireLe: Date
}

export function nouvelleSession(empreinte: string, maintenant: Date): Session {
  return {
    empreinte,
    creeLe: maintenant,
    expireLe: new Date(maintenant.getTime() + DUREE_SESSION_MS),
  }
}

export function sessionValide(session: Session, maintenant: Date): boolean {
  return maintenant.getTime() < session.expireLe.getTime()
}

/**
 * Nouvelle échéance d'une session utilisée à `maintenant` (90 jours glissants),
 * ou `null` si la prolonger ne la repousserait pas d'au moins un jour : on
 * évite ainsi d'écrire en base à chaque page.
 */
export function prolongationDue(session: Session, maintenant: Date): Date | null {
  const echeance = maintenant.getTime() + DUREE_SESSION_MS
  return echeance - session.expireLe.getTime() >= PAS_DE_PROLONGATION_MS ? new Date(echeance) : null
}

import type { Demande } from './demande.js'
import { MINUTE_MS } from './temps.js'

/**
 * Doublons possibles (J4, passe 1 du jury) : le même numéro à moins de
 * 30 minutes d'écart. Le plus souvent le même client qui a renvoyé sa
 * demande ; le site ne fusionne rien, il le signale au garagiste, qui
 * rappelle une fois.
 */
export const FENETRE_DOUBLON_MS = 30 * MINUTE_MS

export function sontDoublons(a: Demande, b: Demande): boolean {
  return (
    a.id !== b.id &&
    a.contact.telephone.lien === b.contact.telephone.lien &&
    Math.abs(a.recueLe.getTime() - b.recueLe.getTime()) <= FENETRE_DOUBLON_MS
  )
}

/** Les autres demandes du même numéro reçues dans la fenêtre, de la plus ancienne à la plus récente. */
export function doublonsDe(demande: Demande, candidates: readonly Demande[]): readonly Demande[] {
  return candidates
    .filter((candidate) => sontDoublons(demande, candidate))
    .sort((a, b) => a.recueLe.getTime() - b.recueLe.getTime())
}

/** Pour chaque demande qui en a, ses doublons possibles parmi celles de la liste. */
export function doublonsPossibles(
  demandes: readonly Demande[],
): ReadonlyMap<string, readonly Demande[]> {
  const doublons = new Map<string, readonly Demande[]>()
  for (const demande of demandes) {
    const trouves = doublonsDe(demande, demandes)
    if (trouves.length > 0) doublons.set(demande.id, trouves)
  }
  return doublons
}

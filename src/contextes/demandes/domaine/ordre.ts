import { urgenceDe, type Demande } from './demande.js'
import { rangUrgence } from './message-notification.js'

/**
 * Ordre de la liste du garagiste (D5, US-22, US-30) : les demandes « À rappeler »
 * d'abord, niveau « Ne roulez pas » en tête, puis de la plus récente à la plus
 * ancienne ; ensuite les demandes traitées, la plus récemment traitée d'abord,
 * comme le dit la légende de leur tableau (colonne « Traitée le »).
 */
export function ordonnerPourLeGaragiste(demandes: readonly Demande[]): readonly Demande[] {
  return [...demandes].sort(
    (a, b) =>
      rangStatut(a) - rangStatut(b) ||
      rangPriorite(b) - rangPriorite(a) ||
      instantDeTri(b) - instantDeTri(a),
  )
}

/** À rappeler : l'arrivée ; traitée : le passage à « Traitée ». */
function instantDeTri(demande: Demande): number {
  const instant =
    demande.statut === 'traitee' ? (demande.statutChangeLe ?? demande.recueLe) : demande.recueLe
  return instant.getTime()
}

function rangStatut(demande: Demande): number {
  return demande.statut === 'a-rappeler' ? 0 : 1
}

/** Seul « Ne roulez pas » passe devant : les autres niveaux suivent l'ordre d'arrivée. */
function rangPriorite(demande: Demande): number {
  if (demande.statut !== 'a-rappeler') return 0
  return rangUrgence(urgenceDe(demande)) === rangUrgence('ne-pas-rouler') ? 1 : 0
}

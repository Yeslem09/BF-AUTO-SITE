import type { SurveillerNotifications } from '../../../contrats/index.js'
import { DUREE_ECHEC_ALERTE_MS } from '../domaine/etat-notification.js'
import type { DepotDemandes, Horloge } from './ports.js'

export interface DependancesSurveillerNotifications {
  readonly depot: DepotDemandes
  readonly horloge: Horloge
  /** Premier relevé en échec d'une série en cours ; absent sans lecture de la boîte. */
  readonly releveEnEchecDepuis?: () => Date | null
}

/** Nom du connecteur signalé à la sonde quand la lecture de la boîte est en panne. */
export const CONNECTEUR_LECTURE = 'Lecture de la boîte'

export function creerSurveillerNotifications(
  dependances: DependancesSurveillerNotifications,
): SurveillerNotifications {
  return async () => {
    const limite = new Date(dependances.horloge.maintenant().getTime() - DUREE_ECHEC_ALERTE_MS)
    const echecsDurables = await dependances.depot.compterEchecsDepuis(limite)
    const releveEnEchecDepuis = dependances.releveEnEchecDepuis?.() ?? null
    const connecteursEnEchec =
      releveEnEchecDepuis !== null && releveEnEchecDepuis < limite ? [CONNECTEUR_LECTURE] : []
    const degradee = echecsDurables > 0 || connecteursEnEchec.length > 0
    return { etat: degradee ? 'degradee' : 'ok', echecsDurables, connecteursEnEchec }
  }
}

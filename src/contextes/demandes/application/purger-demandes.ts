import { limiteDeConservation, limiteEnvoisSuspects } from '../domaine/conservation.js'
import type { DepotDemandes, Horloge, Journal, RegistreEnvoisSuspects } from './ports.js'

export interface BilanPurge {
  readonly demandes: number
  readonly envoisSuspects: number
}

export interface DependancesPurgerDemandes {
  readonly depot: DepotDemandes
  readonly registre: RegistreEnvoisSuspects
  readonly horloge: Horloge
  readonly journal: Journal
}

/**
 * Purge des demandes 12 mois après leur dernière activité (D5, US-34), et des
 * envois suspects d'un mois. Exécutée au démarrage puis chaque jour, dans le
 * processus. Le journal compte les suppressions.
 */
export type PurgerDemandes = () => Promise<BilanPurge>

export function creerPurgerDemandes(dependances: DependancesPurgerDemandes): PurgerDemandes {
  return async () => {
    const maintenant = dependances.horloge.maintenant()
    const bilan: BilanPurge = {
      demandes: await dependances.depot.purger(limiteDeConservation(maintenant)),
      envoisSuspects: await dependances.registre.purger(limiteEnvoisSuspects(maintenant)),
    }
    dependances.journal.info(
      `Purge des demandes : ${bilan.demandes} demande(s) et ${bilan.envoisSuspects} envoi(s) non confirmé(s) supprimé(s)`,
      { ...bilan },
    )
    return bilan
  }
}

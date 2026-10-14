import { debutTraiteesAffichees } from '../domaine/conservation.js'
import type { Demande } from '../domaine/demande.js'
import { doublonsPossibles } from '../domaine/doublons.js'
import { ordonnerPourLeGaragiste } from '../domaine/ordre.js'
import type { GarageFermeAujourdhui } from '../../../contrats/index.js'
import { dateAParis, debutDeSemaine } from '../domaine/temps.js'
import { fermeAujourdhui } from './capacites-espace.js'
import type { DepotDemandes, Horloge, RegistreEnvoisSuspects } from './ports.js'

export interface TableauDemandes {
  readonly maintenant: Date
  /** À rappeler (« Ne roulez pas » en tête), puis traitées des 30 derniers jours. */
  readonly demandes: readonly Demande[]
  readonly illisibles: readonly string[]
  /** Envois suspects restés sans confirmation depuis lundi (D9, US-15). */
  readonly envoisNonConfirmes: number
  /** Doublons possibles de chaque demande qui en a : même numéro, moins de 30 minutes d'écart. */
  readonly doublons: ReadonlyMap<string, readonly Demande[]>
  /**
   * Garage fermé aujourd'hui (fermeture exceptionnelle) : la date du jour à
   * Paris (`AAAA-MM-JJ`), pour marquer les rappels promis à reporter ; `null` sinon.
   */
  readonly fermeLe: string | null
}

export interface DependancesListerDemandes {
  readonly depot: DepotDemandes
  readonly registre: RegistreEnvoisSuspects
  readonly horloge: Horloge
  readonly garageFermeAujourdhui?: GarageFermeAujourdhui
}

export type ListerDemandes = () => Promise<TableauDemandes>

export function creerListerDemandes(dependances: DependancesListerDemandes): ListerDemandes {
  return async () => {
    const maintenant = dependances.horloge.maintenant()
    const [liste, envoisNonConfirmes, ferme] = await Promise.all([
      dependances.depot.listerPourLeGaragiste(debutTraiteesAffichees(maintenant)),
      dependances.registre.compterNonConfirmesDepuis(debutDeSemaine(maintenant)),
      fermeAujourdhui(dependances.garageFermeAujourdhui),
    ])
    return {
      maintenant,
      demandes: ordonnerPourLeGaragiste(liste.demandes),
      illisibles: liste.illisibles,
      envoisNonConfirmes,
      doublons: doublonsPossibles(liste.demandes),
      fermeLe: ferme ? dateAParis(maintenant) : null,
    }
  }
}

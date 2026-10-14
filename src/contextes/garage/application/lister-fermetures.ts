import { fermetureCouvrant, type Fermeture } from '../domaine/fermeture.js'
import { instantLocal, type DateCalendaire } from '../domaine/temps-local.js'
import type { DepotFermetures, Horloge } from './ports.js'

export interface EtatFermetures {
  readonly aujourdhui: DateCalendaire
  /** Fermeture qui couvre aujourd'hui, ou `null`. */
  readonly fermetureDuJour: Fermeture | null
  /** Fermetures en cours et à venir, dans l'ordre. */
  readonly prevues: readonly Fermeture[]
}

export type ListerFermetures = () => Promise<EtatFermetures>

export function creerListerFermetures(depot: DepotFermetures, horloge: Horloge): ListerFermetures {
  return async () => {
    const aujourdhui = instantLocal(horloge.maintenant()).date
    const prevues = await depot.listerDepuis(aujourdhui)
    return { aujourdhui, fermetureDuJour: fermetureCouvrant(prevues, aujourdhui), prevues }
  }
}

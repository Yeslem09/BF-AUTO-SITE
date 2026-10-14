import type { ModeSite } from '../../../contrats/index.js'
import type { CalendrierOuverture } from '../domaine/calendrier.js'
import type { Fermeture } from '../domaine/fermeture.js'
import type { Garage } from '../domaine/garage.js'
import type { DateCalendaire } from '../domaine/temps-local.js'
import { publier } from '../domaine/valeur-publiee.js'
import type { DepotFermetures } from './ports.js'

export interface CalendrierPublie {
  readonly calendrier: CalendrierOuverture
  /** Fermetures en cours et à venir, dans l'ordre. */
  readonly fermetures: readonly Fermeture[]
  /** Mode relecture : la semaine affichée est une proposition à valider. */
  readonly semaineASurligner: boolean
}

/**
 * Le calendrier tel que le public peut le voir dans ce mode : la semaine type
 * si elle est publiable, et toutes les fermetures déclarées, qui sont des faits.
 */
export async function lireCalendrierPublie(
  garage: Garage,
  depot: DepotFermetures,
  mode: ModeSite,
  aujourdhui: DateCalendaire,
): Promise<CalendrierPublie> {
  const semaine = publier(garage.horaires, mode)
  const fermetures = await depot.listerDepuis(aujourdhui)
  return {
    calendrier: { semaine: semaine.visible ? semaine.valeur : null, fermetures },
    fermetures,
    semaineASurligner: semaine.visible && semaine.aSurligner,
  }
}

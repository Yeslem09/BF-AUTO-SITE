import type { AnnoncerRappel, ModeSite } from '../../../contrats/index.js'
import { estConnu } from '../domaine/calendrier.js'
import { annoncerRappel } from '../domaine/rappel.js'
import { instantLocal } from '../domaine/temps-local.js'
import { publier } from '../domaine/valeur-publiee.js'
import { lireCalendrierPublie } from './calendrier-publie.js'
import type { DepotFermetures, SourceIdentiteGarage } from './ports.js'

/**
 * Offert aux demandes (Kano AT-3, US-13) : « Nous vous rappelons jeudi matin. »,
 * « jeudi, en fin de journée » selon le moment où le client peut répondre.
 * `null`, donc aucune promesse, tant que le délai de rappel ou les horaires ne
 * sont pas publiables, ou qu'aucune ouverture n'est en vue.
 */
export function creerAnnoncerRappel(
  source: SourceIdentiteGarage,
  depot: DepotFermetures,
  mode: ModeSite,
): AnnoncerRappel {
  return async (envoi, moment) => {
    const garage = await source.charger()
    if (!publier(garage.suivi.delaiRappel, mode).visible) return null
    const local = instantLocal(envoi)
    const { calendrier } = await lireCalendrierPublie(garage, depot, mode, local.date)
    return estConnu(calendrier) ? annoncerRappel(calendrier, local, moment) : null
  }
}

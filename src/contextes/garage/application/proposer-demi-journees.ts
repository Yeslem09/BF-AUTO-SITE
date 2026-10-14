import type { ModeSite, ProposerDemiJournees } from '../../../contrats/index.js'
import { estConnu } from '../domaine/calendrier.js'
import {
  codeDemiJournee,
  libelleDemiJournee,
  NOMBRE_DEMI_JOURNEES_PROPOSEES,
  prochainesDemiJournees,
} from '../domaine/demi-journees.js'
import { instantLocal } from '../domaine/temps-local.js'
import { lireCalendrierPublie } from './calendrier-publie.js'
import type { DepotFermetures, SourceIdentiteGarage } from './ports.js'

/**
 * Offert aux demandes (Kano D4) : les prochaines demi-journées d'ouverture,
 * horaires publiés moins les fermetures exceptionnelles. Liste vide tant
 * qu'aucune semaine n'est publiable : jamais une demi-journée inventée.
 */
export function creerProposerDemiJournees(
  source: SourceIdentiteGarage,
  depot: DepotFermetures,
  mode: ModeSite,
): ProposerDemiJournees {
  return async (maintenant) => {
    const local = instantLocal(maintenant)
    const { calendrier } = await lireCalendrierPublie(
      await source.charger(),
      depot,
      mode,
      local.date,
    )
    if (!estConnu(calendrier)) return []
    return prochainesDemiJournees(calendrier, local, NOMBRE_DEMI_JOURNEES_PROPOSEES).map(
      (demiJournee) => ({
        code: codeDemiJournee(demiJournee),
        libelle: libelleDemiJournee(demiJournee),
      }),
    )
  }
}

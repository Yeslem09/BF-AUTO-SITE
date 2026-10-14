import type {
  AnnoncerRappel,
  MomentReponse,
  ProposerDemiJournees,
} from '../../../contrats/index.js'
import { echeanceDuRappel, type PromesseRappel } from '../domaine/promesse.js'
import type { Journal } from './ports.js'

export interface DependancesPromettreRappel {
  readonly annoncerRappel: AnnoncerRappel
  readonly proposerDemiJournees: ProposerDemiJournees
  readonly journal: Journal
}

/**
 * Ce que la confirmation promettra au client, retenu à l'envoi (Kano AT-3) :
 * la phrase du garage et sa demi-journée. `null` quand le garage ne promet
 * rien (aucun délai validé) ou ne répond pas : la demande part quand même, et
 * la confirmation s'affiche sans promesse.
 */
export type PromettreRappel = (envoi: Date, moment: MomentReponse) => Promise<PromesseRappel | null>

export function creerPromettreRappel(dependances: DependancesPromettreRappel): PromettreRappel {
  const { journal } = dependances
  return async (envoi, moment) => {
    try {
      const phrase = await dependances.annoncerRappel(envoi, moment)
      if (phrase === null) return null
      const echeance = echeanceDuRappel(await dependances.proposerDemiJournees(envoi), moment)
      if (echeance === null) {
        journal.avertir('Rappel annoncé sans demi-journée retrouvée : promesse non datée')
        return null
      }
      return { ...echeance, phrase }
    } catch (erreur) {
      journal.erreur('Capacité « annoncerRappel » en échec : aucune promesse retenue', {
        erreur: erreur instanceof Error ? erreur.message : String(erreur),
      })
      return null
    }
  }
}

import { noterTentativeAppel, retirerDerniereTentative } from '../domaine/demande.js'
import type { DepotDemandes, Horloge, Journal } from './ports.js'

export interface DependancesNoterTentative {
  readonly depot: DepotDemandes
  readonly horloge: Horloge
  readonly journal: Journal
}

export type IssueTentative = 'notee' | 'inchangee' | 'absente'

/**
 * « Pas de réponse » (J4, passe 1 du jury) : l'appel resté sans réponse est
 * daté, la demande reste « À rappeler ». Rien ne change sur une demande
 * traitée, ni pour un second appui dans la minute.
 */
export type NoterTentative = (id: string) => Promise<IssueTentative>

export function creerNoterTentative(dependances: DependancesNoterTentative): NoterTentative {
  return async (id) => {
    const lecture = await dependances.depot.trouver(id)
    if (lecture.etat !== 'trouvee') return 'absente'
    const notee = noterTentativeAppel(lecture.demande, dependances.horloge.maintenant())
    if (notee === lecture.demande) return 'inchangee'
    await dependances.depot.noterTentativesAppel(id, notee.tentativesAppel)
    dependances.journal.info('Appel sans réponse noté', { demande: id })
    return 'notee'
  }
}

/** Annule le dernier « Pas de réponse » noté : la tentative est retirée, la demande reste à rappeler. */
export type AnnulerTentative = (id: string) => Promise<IssueTentative>

export function creerAnnulerTentative(dependances: DependancesNoterTentative): AnnulerTentative {
  return async (id) => {
    const lecture = await dependances.depot.trouver(id)
    if (lecture.etat !== 'trouvee') return 'absente'
    const corrigee = retirerDerniereTentative(lecture.demande)
    if (corrigee === lecture.demande) return 'inchangee'
    await dependances.depot.noterTentativesAppel(id, corrigee.tentativesAppel)
    dependances.journal.info('Appel sans réponse annulé', { demande: id })
    return 'notee'
  }
}

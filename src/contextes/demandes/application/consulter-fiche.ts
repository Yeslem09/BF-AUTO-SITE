import { noterConsultation } from '../domaine/demande.js'
import type { Demande } from '../domaine/demande.js'
import { doublonsDe, FENETRE_DOUBLON_MS } from '../domaine/doublons.js'
import type { SuiviCourriel } from '../domaine/suivi-courriel.js'
import type { DepotDemandes, Horloge, LectureDemande } from './ports.js'

export interface DependancesConsulterFiche {
  readonly depot: DepotDemandes
  readonly horloge: Horloge
}

/**
 * Ouvre la fiche d'une demande pour le garagiste. La première ouverture est
 * datée (US-30) : c'est un plancher de lecture, pas une mesure du rappel.
 */
/**
 * La demande, ce que la boîte du garage en a appris (Kano connecteurs, C5) et
 * ses doublons possibles (même numéro, moins de 30 minutes d'écart).
 */
export type LectureFiche =
  | {
      readonly etat: 'trouvee'
      readonly demande: Demande
      readonly suivi: SuiviCourriel
      readonly doublons: readonly Demande[]
    }
  | Exclude<LectureDemande, { readonly etat: 'trouvee' }>

export type ConsulterFiche = (id: string) => Promise<LectureFiche>

export function creerConsulterFiche(dependances: DependancesConsulterFiche): ConsulterFiche {
  return async (id) => {
    const lecture = await dependances.depot.trouver(id)
    if (lecture.etat !== 'trouvee') return lecture
    const consultee = noterConsultation(lecture.demande, dependances.horloge.maintenant())
    if (consultee !== lecture.demande && consultee.premiereConsultationLe !== null) {
      await dependances.depot.noterPremiereConsultation(id, consultee.premiereConsultationLe)
    }
    const recue = consultee.recueLe.getTime()
    const [suivi, voisines] = await Promise.all([
      dependances.depot.suiviCourriel(id),
      dependances.depot.listerRecuesEntre(
        new Date(recue - FENETRE_DOUBLON_MS),
        new Date(recue + FENETRE_DOUBLON_MS),
      ),
    ])
    return {
      etat: 'trouvee',
      demande: consultee,
      suivi,
      doublons: doublonsDe(consultee, voisines.demandes),
    }
  }
}

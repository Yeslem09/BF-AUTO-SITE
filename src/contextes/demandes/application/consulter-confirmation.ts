import type { AnnoncerRappel, MomentReponse } from '../../../contrats/index.js'
import type { Demande } from '../domaine/demande.js'
import { HEURE_MS } from '../domaine/temps.js'
import type { DepotDemandes, Horloge, Journal } from './ports.js'

/** Au-delà, la confirmation ne montre plus le récapitulatif (US-12) : lien partagé ou gardé trop longtemps. */
export const DUREE_RECAPITULATIF_MS = HEURE_MS

/** Un jeton de confirmation fait 22 caractères ; au-delà de cette longueur, rien n'est cherché. */
const LONGUEUR_MAX_JETON = 64

export type Confirmation =
  | { readonly etat: 'introuvable' }
  /** Jeton connu mais trop ancien, ou demande illisible : page neutre, sans récapitulatif. */
  | { readonly etat: 'neutre' }
  | {
      readonly etat: 'disponible'
      readonly demande: Demande
      /** Suite annoncée par le garage (AT-3), `null` tant qu'aucun délai n'est validé. */
      readonly suite: string | null
    }

export interface DependancesConsulterConfirmation {
  readonly depot: DepotDemandes
  readonly horloge: Horloge
  readonly journal: Journal
  readonly annoncerRappel: AnnoncerRappel
}

export type ConsulterConfirmation = (jeton: string) => Promise<Confirmation>

export function creerConsulterConfirmation(
  dependances: DependancesConsulterConfirmation,
): ConsulterConfirmation {
  const { depot, horloge, journal } = dependances
  return async (jeton) => {
    if (jeton === '' || jeton.length > LONGUEUR_MAX_JETON) return { etat: 'introuvable' }
    const lecture = await depot.trouverParConfirmation(jeton)
    if (lecture.etat === 'absente') return { etat: 'introuvable' }
    if (lecture.etat === 'illisible') return { etat: 'neutre' }
    const { demande } = lecture
    if (horloge.maintenant().getTime() - demande.recueLe.getTime() > DUREE_RECAPITULATIF_MS) {
      return { etat: 'neutre' }
    }
    return {
      etat: 'disponible',
      demande,
      // La promesse retenue à l'envoi : celle que voit le garagiste. Les
      // demandes plus anciennes la redemandent au garage.
      suite: demande.promesse?.phrase ?? (await annoncer(demande.recueLe, demande.contact.moment)),
    }
  }

  /** Le garage ne sait pas encore dire : on ne promet rien, et la confirmation s'affiche quand même. */
  async function annoncer(envoi: Date, moment: MomentReponse): Promise<string | null> {
    try {
      return await dependances.annoncerRappel(envoi, moment)
    } catch (erreur) {
      journal.erreur('Capacité « annoncerRappel » en échec : aucune suite annoncée', {
        erreur: erreur instanceof Error ? erreur.message : String(erreur),
      })
      return null
    }
  }
}

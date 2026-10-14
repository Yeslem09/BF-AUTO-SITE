import { redigerSignalement } from '../domaine/messages.js'
import {
  lireSignalement,
  type ErreursSignalement,
  type SaisieSignalement,
  type Signalement,
} from '../domaine/signalement.js'
import type { Canal, Remise } from './ports.js'

export type ResultatSignalement =
  | { readonly issue: 'envoye'; readonly signalement: Signalement; readonly remise: Remise }
  | {
      readonly issue: 'invalide'
      readonly saisie: SaisieSignalement
      readonly erreurs: ErreursSignalement
    }
  | { readonly issue: 'canal-absent'; readonly saisie: SaisieSignalement }
  | { readonly issue: 'echec-envoi'; readonly saisie: SaisieSignalement; readonly erreur: unknown }

export type SignalerChangement = (recue: {
  readonly nature?: unknown
  readonly texte?: unknown
}) => Promise<ResultatSignalement>

/**
 * « Signaler un changement » (US-49) : un message structuré part vers Anthony.
 * Le fichier de données n'est jamais touché ; en cas d'échec, la saisie est
 * rendue intacte au formulaire.
 */
export function creerSignalerChangement(dependances: {
  readonly canalResponsable: Canal | null
}): SignalerChangement {
  return async (recue) => {
    const lecture = lireSignalement(recue)
    if (!lecture.valide) {
      return { issue: 'invalide', saisie: lecture.saisie, erreurs: lecture.erreurs }
    }
    const { signalement } = lecture
    const saisie: SaisieSignalement = signalement
    const canal = dependances.canalResponsable
    if (canal === null) return { issue: 'canal-absent', saisie }
    try {
      await canal.messagerie.envoyer({
        destinataire: canal.destinataire,
        ...redigerSignalement(signalement),
      })
    } catch (erreur) {
      return { issue: 'echec-envoi', saisie, erreur }
    }
    return { issue: 'envoye', signalement, remise: canal.remise }
  }
}

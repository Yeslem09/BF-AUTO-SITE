import type { ExpediteurCourriel } from '../../../../infrastructure/courriel/envoi/ports.js'
import { ErreurConnecteur } from '../../../../infrastructure/erreurs.js'
import type { Notificateur } from '../../application/ports.js'
import { ErreurNotification } from '../../domaine/erreurs.js'

/** Rang de la notification dans le fil de la demande (la relance serait le rang 2). */
const RANG_NOTIFICATION = 1
const INVITATION_REPONSE =
  '\nUne fois le client rappelé, répondez simplement « fait » à ce courriel : la demande sera rangée « Traitée », sans vous connecter.\n'

export interface OptionsNotificateurCourriel {
  /** Vrai si la boîte est lue : le message propose de répondre « fait » (Kano connecteurs, AT-C1). */
  readonly invitationReponse: boolean
}

/**
 * Courriel au garage par l'expéditeur partagé (SMTP ou console) : référence
 * de la demande en fin d'objet, identifiant stable (un renvoi ne crée pas de
 * doublon), texte brut lisible sans se connecter (D5, US-50).
 */
export function creerNotificateurCourriel(
  expediteur: ExpediteurCourriel,
  destinataire: string,
  options: OptionsNotificateurCourriel,
): Notificateur {
  return {
    canal: expediteur.canal === 'smtp' ? 'courriel' : 'console',
    async envoyer(message) {
      try {
        await expediteur.envoyer({
          destinataire,
          objet: message.sujet,
          texte: options.invitationReponse
            ? `${message.texte}${INVITATION_REPONSE}`
            : message.texte,
          fil: { reference: message.reference, rang: RANG_NOTIFICATION },
        })
      } catch (erreur) {
        throw new ErreurNotification(
          erreur instanceof ErreurConnecteur
            ? `${erreur.message} ${erreur.remede}`
            : `Envoi du courriel refusé : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
        )
      }
    },
  }
}

/**
 * Production sans envoi ni destinataire : personne ne serait prévenu. C'est
 * un échec, affiché sur la fiche et signalé par la sonde, jamais une réussite
 * silencieuse (piège 2).
 */
export const notificateurIndisponible: Notificateur = {
  canal: 'aucun',
  async envoyer() {
    throw new ErreurNotification(
      'Aucun canal de notification configuré : SMTP_UTILISATEUR, SMTP_MOT_DE_PASSE (Gmail) et COURRIEL_GARAGE sont nécessaires.',
    )
  },
}

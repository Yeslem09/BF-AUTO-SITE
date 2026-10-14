import type { ExpediteurCourriel } from '../../../../infrastructure/courriel/envoi/ports.js'
import type { Messagerie } from '../../application/ports.js'

/**
 * Envoi par l'expéditeur partagé du site (Gmail par défaut, Kano
 * connecteurs) : liens de connexion, signalements et alertes, sans
 * référence de demande. Un échec remonte avec sa cause et son remède.
 */
export function creerMessagerieCourriel(expediteur: ExpediteurCourriel): Messagerie {
  return {
    envoyer: async (message) => {
      await expediteur.envoyer({
        destinataire: message.destinataire,
        objet: message.objet,
        texte: message.texte,
      })
    },
  }
}

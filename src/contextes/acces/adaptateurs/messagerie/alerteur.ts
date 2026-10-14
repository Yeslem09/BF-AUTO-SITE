import type { Alerteur, Canal } from '../../application/ports.js'

/**
 * Alerte Anthony par son canal s'il est configuré ; sinon, ou si l'envoi
 * échoue, l'alerte s'écrit dans le journal d'erreur du serveur. Une alerte ne
 * fait jamais échouer la requête qui l'a déclenchée.
 */
export function creerAlerteur(
  canalResponsable: Canal | null,
  ecrireErreur: (texte: string) => void = (texte) => console.error(texte),
): Alerteur {
  return {
    alerter: async (objet, texte) => {
      if (canalResponsable === null) {
        ecrireErreur(`${objet} (aucune adresse d’alerte configurée)\n${texte}`)
        return
      }
      try {
        await canalResponsable.messagerie.envoyer({
          destinataire: canalResponsable.destinataire,
          objet,
          texte,
        })
      } catch (erreur) {
        const cause = erreur instanceof Error ? erreur.message : String(erreur)
        ecrireErreur(`${objet} (envoi de l’alerte impossible : ${cause})\n${texte}`)
      }
    },
  }
}

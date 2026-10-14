import type { Messagerie, MessageSortant } from '../../application/ports.js'

/** Mise en forme d'un message écrit en console : lisible, et facile à retrouver dans un journal. */
export function formaterPourConsole(message: MessageSortant): string {
  return [
    '---- Message (console, aucun envoi réel) ----',
    `À : ${message.destinataire}`,
    `Objet : ${message.objet}`,
    '',
    message.texte,
    '---- Fin du message ----',
    '',
  ].join('\n')
}

/**
 * Messagerie de développement et de démonstration : le message s'écrit sur la
 * sortie standard du serveur au lieu de partir. Aucun serveur d'envoi requis.
 */
export function creerMessagerieConsole(
  ecrire: (texte: string) => void = (texte) => process.stdout.write(texte),
): Messagerie {
  return {
    envoyer: async (message) => {
      ecrire(formaterPourConsole(message))
    },
  }
}

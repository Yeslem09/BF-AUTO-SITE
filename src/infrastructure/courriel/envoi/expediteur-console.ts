import { composerCourriel, type IdentiteExpediteur } from './composer.js'
import type { ExpediteurCourriel } from './ports.js'

/** Adresse d'expédition de démonstration, dans le domaine réservé `.invalid` : elle ne désigne personne. */
export const EXPEDITEUR_CONSOLE: IdentiteExpediteur = {
  adresse: 'site@demonstration.invalid',
  nom: null,
  repondreA: null,
}
const IDENTIFIANT_SANS_FIL = '<console@demonstration.invalid>'

/**
 * Développement et démonstration : le courriel s'écrit dans le journal, avec
 * l'objet et l'identifiant qu'il porterait réellement, et ne part pas.
 */
export function creerExpediteurConsole(
  ecrire: (texte: string) => void,
  identite: IdentiteExpediteur = EXPEDITEUR_CONSOLE,
): ExpediteurCourriel {
  return {
    canal: 'console',
    async envoyer(courriel) {
      const compose = composerCourriel(courriel, identite)
      const identifiant = compose.messageId ?? IDENTIFIANT_SANS_FIL
      ecrire(
        [
          '---- Courriel (console, aucun envoi réel) ----',
          `À : ${courriel.destinataire}`,
          `Objet : ${String(compose.subject)}`,
          `Identifiant : ${identifiant}`,
          '',
          courriel.texte,
          '---- Fin du courriel ----',
          '',
        ].join('\n'),
      )
      return { identifiantMessage: identifiant }
    },
    async verifier() {},
  }
}

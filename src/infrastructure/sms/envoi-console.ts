import type { EnvoiSms } from './ports.js'
import { preparerTexteSms } from './texte-sms.js'

/**
 * Développement et démonstration : le SMS s'écrit dans le journal, tel qu'il
 * partirait (alphabet GSM, nombre de SMS facturés), et ne part pas.
 */
export function creerEnvoiSmsConsole(ecrire: (texte: string) => void): EnvoiSms {
  return {
    fournisseur: 'console',
    async envoyer(sms) {
      const { texte, segments } = preparerTexteSms(sms.texte)
      ecrire(
        [
          '---- SMS (console, aucun envoi réel) ----',
          `À : ${sms.destinataire}`,
          `SMS facturés : ${segments}`,
          '',
          texte,
          '---- Fin du SMS ----',
          '',
        ].join('\n'),
      )
      return { identifiant: null, segments }
    },
    async verifier() {
      return { creditsRestants: null }
    },
  }
}

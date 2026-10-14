import type { EnvoiSms } from '../../../../infrastructure/sms/ports.js'
import type { AlerteSms } from '../../application/ports.js'

/** SMS « Ne roulez pas » au mobile du garagiste, par le fournisseur configuré (Kano connecteurs, C6). */
export function creerAlerteSms(envoi: EnvoiSms, destinataire: string): AlerteSms {
  return {
    async envoyer(texte) {
      await envoi.envoyer({ destinataire, texte })
    },
  }
}

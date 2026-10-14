/**
 * SMS par l'API transactionnelle de Brevo : `POST /transactionalSMS/send`,
 * en-tête `api-key`, destinataire avec l'indicatif et sans « + ».
 */
import { appelerJson, echecHttp, estSucces, lireChamp, messageDuCorps } from '../http.js'
import type { EnvoiSms } from './ports.js'
import type { ReglagesBrevo } from './reglages.js'
import { preparerTexteSms } from './texte-sms.js'

const CONNECTEUR = 'SMS Brevo'
const PLUS_INTERNATIONAL = /^\+/
const REMEDE_IDENTIFIANTS =
  'Vérifiez SMS_BREVO_CLE_API : une clé API Brevo (Paramètres, Clés API), pas une clé SMTP.'
/** Ligne du plan Brevo qui porte les crédits SMS. */
const TYPE_PLAN_SMS = 'sms'

export function creerEnvoiSmsBrevo(reglages: ReglagesBrevo): EnvoiSms {
  const enTetes = { 'api-key': reglages.cleApi }
  return {
    fournisseur: 'brevo',
    async envoyer(sms) {
      const { texte, segments } = preparerTexteSms(sms.texte)
      const reponse = await appelerJson(
        {
          methode: 'POST',
          url: `${reglages.pointAcces}/transactionalSMS/send`,
          enTetes,
          corps: JSON.stringify({
            sender: reglages.expediteur,
            recipient: sms.destinataire.replace(PLUS_INTERNATIONAL, ''),
            content: texte,
            type: 'transactional',
            unicodeEnabled: false,
          }),
        },
        CONNECTEUR,
      )
      if (!estSucces(reponse)) {
        throw echecHttp(reponse, CONNECTEUR, messageDuCorps(reponse.corps), REMEDE_IDENTIFIANTS)
      }
      const identifiant = lireChamp(reponse.corps, 'messageId')
      return { identifiant: identifiant === undefined ? null : String(identifiant), segments }
    },
    async verifier() {
      const reponse = await appelerJson(
        { methode: 'GET', url: `${reglages.pointAcces}/account`, enTetes },
        CONNECTEUR,
      )
      if (!estSucces(reponse)) {
        throw echecHttp(reponse, CONNECTEUR, messageDuCorps(reponse.corps), REMEDE_IDENTIFIANTS)
      }
      return { creditsRestants: creditsSms(lireChamp(reponse.corps, 'plan')) }
    },
  }
}

/** Crédits de la ligne « sms » du plan ; `null` si Brevo ne les donne pas (jamais 0 inventé). */
function creditsSms(plan: unknown): number | null {
  if (!Array.isArray(plan)) return null
  const ligne: unknown = plan.find((element) => lireChamp(element, 'type') === TYPE_PLAN_SMS)
  const credits = lireChamp(ligne, 'credits')
  return typeof credits === 'number' ? credits : null
}

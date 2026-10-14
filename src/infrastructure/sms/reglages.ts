/**
 * Réglages du SMS au garagiste lus dans l'environnement (Kano connecteurs, C6).
 * Actif dès que les identifiants d'un fournisseur sont fournis ; sans
 * identifiant, désactivé (le courriel reste le canal).
 *
 * | Variable                   | Défaut                       | Rôle                                            |
 * |----------------------------|------------------------------|-------------------------------------------------|
 * | SMS_FOURNISSEUR            | déduit des identifiants      | ovh, brevo ou console ; lève une ambiguïté       |
 * | SMS_DESTINATAIRE           | téléphone de garage.json     | Mobile qui reçoit les SMS (06, 07 ou +...)      |
 * | SMS_OVH_CLE_APPLICATION    | (aucun)                      | Application Key de l'API OVHcloud               |
 * | SMS_OVH_SECRET_APPLICATION | (aucun)                      | Application Secret (secret)                     |
 * | SMS_OVH_CLE_CONSOMMATEUR   | (aucun)                      | Consumer Key (secret)                           |
 * | SMS_OVH_SERVICE            | (aucun)                      | Compte SMS, par exemple sms-ab12345-1           |
 * | SMS_OVH_EXPEDITEUR         | numéro court de réponse      | Expéditeur déclaré chez OVHcloud, facultatif    |
 * | SMS_OVH_POINT_ACCES        | https://eu.api.ovh.com/1.0   | Adresse de l'API                                |
 * | SMS_BREVO_CLE_API          | (aucun)                      | Clé API Brevo (secret)                          |
 * | SMS_BREVO_EXPEDITEUR       | SiteBFAuto                   | 3 à 11 lettres et chiffres, ou 3 à 15 chiffres  |
 * | SMS_BREVO_POINT_ACCES      | https://api.brevo.com/v3     | Adresse de l'API                                |
 */
import type { LecteurEnvironnement } from '../environnement.js'
import { lireNumeroMobile } from './numero.js'
import { FOURNISSEURS_SMS, type FournisseurSms } from './ports.js'

export interface ReglagesOvh {
  readonly cleApplication: string
  readonly secretApplication: string
  readonly cleConsommateur: string
  readonly service: string
  /** `null` : numéro court de réponse d'OVHcloud, sans expéditeur à déclarer. */
  readonly expediteur: string | null
  readonly pointAcces: string
}

export interface ReglagesBrevo {
  readonly cleApi: string
  readonly expediteur: string
  readonly pointAcces: string
}

/**
 * `destinataire` au format international ; `null` : le téléphone du garage, à
 * résoudre par `resoudreDestinataireSms` une fois l'identité du garage lue.
 */
export type ReglagesSms =
  | { readonly fournisseur: 'ovh'; readonly destinataire: string | null; readonly ovh: ReglagesOvh }
  | {
      readonly fournisseur: 'brevo'
      readonly destinataire: string | null
      readonly brevo: ReglagesBrevo
    }
  | { readonly fournisseur: 'console'; readonly destinataire: string | null }

export interface LectureSms {
  /** `null` : SMS désactivé. */
  readonly reglages: ReglagesSms | null
  readonly avertissements: readonly string[]
}

export const POINT_ACCES_OVH = 'https://eu.api.ovh.com/1.0'
export const POINT_ACCES_BREVO = 'https://api.brevo.com/v3'
/** Expéditeur affiché par défaut chez Brevo : le site qui prévient le garage. */
export const EXPEDITEUR_BREVO_PAR_DEFAUT = 'SiteBFAuto'
const EXPEDITEUR_ALPHANUMERIQUE = /^[A-Za-z0-9]{3,11}$/
const EXPEDITEUR_NUMERIQUE = /^\d{3,15}$/
const VARIABLES_OVH = [
  'SMS_OVH_CLE_APPLICATION',
  'SMS_OVH_SECRET_APPLICATION',
  'SMS_OVH_CLE_CONSOMMATEUR',
  'SMS_OVH_SERVICE',
] as const
const VARIABLE_BREVO = 'SMS_BREVO_CLE_API'

/**
 * `telephoneGarage` : le numéro de `garage.json` ; `undefined` s'il n'est pas
 * encore lu (la destination reste alors à résoudre, `destinataire: null`).
 */
export function lireReglagesSms(
  lecteur: LecteurEnvironnement,
  telephoneGarage: string | null | undefined,
): LectureSms {
  const fournisseur = choisirFournisseur(lecteur)
  if (fournisseur === null) {
    return {
      reglages: null,
      avertissements: [
        'SMS désactivé : aucun identifiant de fournisseur (SMS_OVH_* ou SMS_BREVO_CLE_API) ; les demandes « Ne roulez pas » ne partent que par courriel.',
      ],
    }
  }
  const destinataire = lireDestinataire(lecteur, telephoneGarage)
  if (destinataire === INVALIDE) return { reglages: null, avertissements: [] }
  if (fournisseur === 'console')
    return { reglages: { fournisseur, destinataire }, avertissements: [] }
  if (fournisseur === 'ovh') {
    const ovh = lireOvh(lecteur)
    return {
      reglages: ovh === null ? null : { fournisseur, destinataire, ovh },
      avertissements: [],
    }
  }
  const brevo = lireBrevo(lecteur)
  return {
    reglages: brevo === null ? null : { fournisseur, destinataire, brevo },
    avertissements: [],
  }
}

/**
 * Destinataire à défaut de `SMS_DESTINATAIRE` : le téléphone du garage, qui
 * doit être un mobile. Renvoie le problème à signaler sinon.
 */
export function resoudreDestinataireSms(
  reglages: ReglagesSms,
  telephoneGarage: string,
): { readonly reglages: ReglagesSms } | { readonly probleme: string } {
  if (reglages.destinataire !== null) return { reglages }
  const lecture = lireNumeroMobile(telephoneGarage)
  return lecture.valide
    ? { reglages: { ...reglages, destinataire: lecture.international } }
    : {
        probleme: `SMS_DESTINATAIRE : le téléphone du garage « ${telephoneGarage} » ne convient pas (${lecture.raison}) ; renseignez un mobile`,
      }
}

/** Destinataire illisible : le problème est déjà signalé. */
const INVALIDE = Symbol('destinataire invalide')

function choisirFournisseur(lecteur: LecteurEnvironnement): FournisseurSms | null {
  const explicite = lecteur.choix('SMS_FOURNISSEUR', FOURNISSEURS_SMS)
  if (explicite !== null) return explicite
  if (lecteur.definie('SMS_FOURNISSEUR')) return null
  const ovh = VARIABLES_OVH.some((nom) => lecteur.definie(nom))
  const brevo = lecteur.definie(VARIABLE_BREVO)
  if (ovh && brevo) {
    lecteur.signaler(
      'SMS_FOURNISSEUR : identifiants OVHcloud et Brevo fournis ensemble, choisissez ovh ou brevo',
    )
    return null
  }
  if (ovh) return 'ovh'
  if (brevo) return 'brevo'
  return null
}

function lireDestinataire(
  lecteur: LecteurEnvironnement,
  telephoneGarage: string | null | undefined,
): string | null | typeof INVALIDE {
  const saisi = lecteur.texte('SMS_DESTINATAIRE')
  if (saisi === null && telephoneGarage === undefined) return null
  const numero = saisi ?? telephoneGarage ?? null
  if (numero === null) {
    lecteur.signaler('SMS_DESTINATAIRE : obligatoire (aucun téléphone du garage connu)')
    return INVALIDE
  }
  const lecture = lireNumeroMobile(numero)
  if (!lecture.valide) {
    lecteur.signaler(
      saisi === null
        ? `SMS_DESTINATAIRE : le téléphone du garage « ${numero} » ne convient pas (${lecture.raison}) ; renseignez un mobile`
        : `SMS_DESTINATAIRE : « ${numero} », ${lecture.raison}`,
    )
    return INVALIDE
  }
  return lecture.international
}

function lireOvh(lecteur: LecteurEnvironnement): ReglagesOvh | null {
  const manquantes = VARIABLES_OVH.filter((nom) => !lecteur.definie(nom))
  if (manquantes.length > 0) {
    lecteur.signaler(`${manquantes.join(', ')} : obligatoire(s) pour envoyer des SMS par OVHcloud`)
  }
  const expediteur = lireExpediteur(lecteur, 'SMS_OVH_EXPEDITEUR')
  const pointAcces = lecteur.url('SMS_OVH_POINT_ACCES', POINT_ACCES_OVH)
  const cleApplication = lecteur.secret('SMS_OVH_CLE_APPLICATION')
  const secretApplication = lecteur.secret('SMS_OVH_SECRET_APPLICATION')
  const cleConsommateur = lecteur.secret('SMS_OVH_CLE_CONSOMMATEUR')
  const service = lecteur.texte('SMS_OVH_SERVICE')
  if (
    cleApplication === null ||
    secretApplication === null ||
    cleConsommateur === null ||
    service === null
  ) {
    return null
  }
  return { cleApplication, secretApplication, cleConsommateur, service, expediteur, pointAcces }
}

function lireBrevo(lecteur: LecteurEnvironnement): ReglagesBrevo | null {
  const cleApi = lecteur.secret(VARIABLE_BREVO)
  if (cleApi === null)
    lecteur.signaler(`${VARIABLE_BREVO} : obligatoire pour envoyer des SMS par Brevo`)
  const expediteur = lireExpediteur(lecteur, 'SMS_BREVO_EXPEDITEUR') ?? EXPEDITEUR_BREVO_PAR_DEFAUT
  const pointAcces = lecteur.url('SMS_BREVO_POINT_ACCES', POINT_ACCES_BREVO)
  return cleApi === null ? null : { cleApi, expediteur, pointAcces }
}

function lireExpediteur(lecteur: LecteurEnvironnement, nom: string): string | null {
  const expediteur = lecteur.texte(nom)
  if (expediteur === null) return null
  if (!EXPEDITEUR_ALPHANUMERIQUE.test(expediteur) && !EXPEDITEUR_NUMERIQUE.test(expediteur)) {
    lecteur.signaler(
      `${nom} : « ${expediteur} », 3 à 11 lettres et chiffres sans espace, ou 3 à 15 chiffres`,
    )
    return null
  }
  return expediteur
}

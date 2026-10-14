import { HEURE_MS, MINUTE_MS } from './temps.js'

/**
 * Où en est l'avis envoyé au garagiste pour une demande. La demande est
 * toujours enregistrée AVANT toute notification (B-24) : un échec n'efface
 * rien, il se voit sur la fiche et relance la file de renvoi.
 */
export type EtatNotification =
  | { readonly etat: 'en-attente' }
  | { readonly etat: 'envoyee'; readonly envoyeeLe: Date }
  | {
      readonly etat: 'en-echec'
      readonly premierEchecLe: Date
      readonly essais: number
      readonly prochainEssaiLe: Date
      readonly derniereErreur: string
    }

/** Nouveaux essais à 1 minute, 10 minutes et 1 heure après le premier échec (D5, US-16)... */
const ESSAIS_APRES_PREMIER_ECHEC_MS = [MINUTE_MS, 10 * MINUTE_MS, HEURE_MS] as const
/** ... puis toutes les heures, tant que la demande reste à rappeler : elle n'est jamais abandonnée. */
const INTERVALLE_ENSUITE_MS = HEURE_MS
/** Jamais deux essais à moins d'une minute, même après un long arrêt du service. */
const ECART_MINIMAL_MS = MINUTE_MS
/**
 * Une notification jamais tentée depuis ce délai est reprise par la file :
 * le service a pu s'arrêter entre l'enregistrement et l'envoi.
 */
export const DELAI_REPRISE_EN_ATTENTE_MS = MINUTE_MS
/** Au-delà, l'échec est durable : la sonde de santé doit alerter Anthony (D5). */
export const DUREE_ECHEC_ALERTE_MS = HEURE_MS

/**
 * Instant du prochain essai après `essaisFaits` tentatives, toutes en échec,
 * la première ayant échoué à `premierEchecLe`.
 */
export function prochainEssai(premierEchecLe: Date, essaisFaits: number, maintenant: Date): Date {
  const rang = Math.max(essaisFaits, 1) - 1
  const prevu =
    ESSAIS_APRES_PREMIER_ECHEC_MS[rang] ??
    HEURE_MS + (rang - ESSAIS_APRES_PREMIER_ECHEC_MS.length + 1) * INTERVALLE_ENSUITE_MS
  return new Date(
    Math.max(premierEchecLe.getTime() + prevu, maintenant.getTime() + ECART_MINIMAL_MS),
  )
}

/** Échec qui dure depuis plus d'une heure : à signaler (sonde, D5). */
export function estEchecDurable(notification: EtatNotification, maintenant: Date): boolean {
  return (
    notification.etat === 'en-echec' &&
    maintenant.getTime() - notification.premierEchecLe.getTime() > DUREE_ECHEC_ALERTE_MS
  )
}

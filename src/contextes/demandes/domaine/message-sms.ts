import { estUrgente, type Demande } from './demande.js'
import { MOMENTS_RAPPEL, libelleDe } from './referentiels.js'
import { referenceDeDemande } from './reference.js'

/** Au plus un SMS facturé : 160 caractères de l'alphabet GSM (Kano connecteurs, C6, PC-04). */
export const LONGUEUR_MAX_SMS = 160

/**
 * SMS au garagiste, pour une demande « Ne roulez pas » seulement (C6) :
 * l'urgence, le prénom, le téléphone composable, le moment où le client
 * répond et la référence du courriel qui porte le détail. `null` sinon.
 */
export function redigerSms(demande: Demande): string | null {
  if (!estUrgente(demande)) return null
  const { contact } = demande
  const rediger = (prenom: string) =>
    `BF Auto : NE ROULEZ PAS. Rappelez ${prenom} au ${contact.telephone.affichable}, ${libelleDe(MOMENTS_RAPPEL, contact.moment).toLowerCase()}. Détail par courriel [${referenceDeDemande(demande.id)}].`
  const complet = rediger(contact.prenom)
  const exces = complet.length - LONGUEUR_MAX_SMS
  // Seul le prénom se raccourcit : le téléphone et la référence restent entiers.
  return exces <= 0
    ? complet
    : rediger(contact.prenom.slice(0, Math.max(1, contact.prenom.length - exces)))
}

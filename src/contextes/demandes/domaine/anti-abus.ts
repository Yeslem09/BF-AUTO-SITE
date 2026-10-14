import { HEURE_MS } from './temps.js'

/**
 * Anti-abus sans captcha tiers et sans rejet silencieux (D9, B-23, AE-35).
 *
 * Un envoi suspect n'est jamais jeté : il reçoit l'écran « Confirmez l'envoi »,
 * formulaire rempli. Seul l'envoi confirmé est enregistré ; les envois restés
 * sans confirmation sont comptés pour le garagiste.
 */

/** Délai minimal entre l'affichage du formulaire et son envoi (D9). */
export const DELAI_MINIMAL_SAISIE_MS = 3_000

/**
 * Nature d'un jeton de formulaire : émis avec le formulaire, ou avec l'écran
 * « Confirmez l'envoi ». Le second vaut confirmation humaine : le délai ne
 * s'y applique plus, sinon un client rapide tournerait en rond.
 */
export type NatureJeton = 'formulaire' | 'confirmation'

export interface JetonLu {
  readonly nature: NatureJeton
  readonly emisLe: Date
}

export type MotifSoupcon =
  'champ-piege' | 'jeton-absent' | 'envoi-trop-rapide' | 'formulaire-deja-envoye'

export type EvaluationEnvoi =
  { readonly verdict: 'conforme' } | { readonly verdict: 'suspect'; readonly motif: MotifSoupcon }

export interface EnvoiRecu {
  /** Le champ piège, invisible pour un humain, contient quelque chose. */
  readonly piegeRempli: boolean
  /** Jeton lu et authentifié, `null` s'il manque ou s'il a été altéré. */
  readonly jeton: JetonLu | null
  /**
   * Le jeton a déjà servi à enregistrer une AUTRE demande : le client est
   * revenu en arrière et envoie une nouvelle demande avec le même formulaire.
   * Ce n'est pas un double envoi : la nouvelle demande n'est jamais jetée,
   * elle est confirmée sous un jeton neuf (AE-35).
   */
  readonly formulaireDejaEnvoye: boolean
  readonly recuLe: Date
}

export function evaluerEnvoi(envoi: EnvoiRecu): EvaluationEnvoi {
  if (envoi.piegeRempli) return { verdict: 'suspect', motif: 'champ-piege' }
  if (envoi.jeton === null) return { verdict: 'suspect', motif: 'jeton-absent' }
  if (envoi.formulaireDejaEnvoye) return { verdict: 'suspect', motif: 'formulaire-deja-envoye' }
  if (envoi.jeton.nature === 'confirmation') return { verdict: 'conforme' }
  const ecoule = envoi.recuLe.getTime() - envoi.jeton.emisLe.getTime()
  return ecoule < DELAI_MINIMAL_SAISIE_MS
    ? { verdict: 'suspect', motif: 'envoi-trop-rapide' }
    : { verdict: 'conforme' }
}

/** Limitation de débit par adresse client (D9, US-47) : cinq envois par heure. */
export const ENVOIS_MAXIMUM_PAR_FENETRE = 5
export const FENETRE_LIMITATION_MS = HEURE_MS

/** Envois encore comptés à l'instant donné : ceux de la dernière fenêtre. */
export function envoisDansLaFenetre(
  horodatages: readonly number[],
  maintenant: Date,
): readonly number[] {
  const debut = maintenant.getTime() - FENETRE_LIMITATION_MS
  return horodatages.filter((instant) => instant > debut)
}

export function limiteAtteinte(horodatages: readonly number[], maintenant: Date): boolean {
  return envoisDansLaFenetre(horodatages, maintenant).length >= ENVOIS_MAXIMUM_PAR_FENETRE
}

import { CONSERVATION_LIEN_MS, DUREE_LIEN_MS } from './regles.js'

/**
 * Lien de connexion envoyé au garagiste. Seule l'empreinte du jeton est
 * connue : le jeton lui-même ne vit que dans le message envoyé.
 */
export interface LienConnexion {
  readonly empreinte: string
  readonly creeLe: Date
  readonly expireLe: Date
  readonly utiliseLe: Date | null
  /** Page de l'espace où revenir après l'ouverture de session. */
  readonly retour: string
}

export type EtatLien = 'valide' | 'expire' | 'deja-utilise' | 'inconnu'

export function nouveauLien(empreinte: string, maintenant: Date, retour: string): LienConnexion {
  return {
    empreinte,
    creeLe: maintenant,
    expireLe: new Date(maintenant.getTime() + DUREE_LIEN_MS),
    utiliseLe: null,
    retour,
  }
}

/**
 * État d'un lien présenté. Un lien déjà servi le reste même une fois expiré :
 * c'est la cause la plus utile à dire au garagiste.
 */
export function etatDuLien(lien: LienConnexion | null, maintenant: Date): EtatLien {
  if (lien === null) return 'inconnu'
  if (lien.utiliseLe !== null) return 'deja-utilise'
  if (maintenant.getTime() >= lien.expireLe.getTime()) return 'expire'
  return 'valide'
}

/** Instant avant lequel un lien expiré peut être oublié. */
export function limiteConservationLiens(maintenant: Date): Date {
  return new Date(maintenant.getTime() - CONSERVATION_LIEN_MS)
}

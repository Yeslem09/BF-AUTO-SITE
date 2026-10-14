/**
 * Banc d'essai des cas d'usage : vrai moteur SQLite en mémoire, vraie
 * empreinte SHA-256, horloge réglable et jetons prévisibles. Réservé aux tests.
 */
import type { Hachage } from '../../application/ports.js'
import { hachageSha256 } from '../crypto/jetons.js'
import {
  BASE_EN_MEMOIRE,
  creerDepotAccesSqlite,
  type DepotAccesSqlite,
} from '../sqlite/depot-acces-sqlite.js'
import {
  creerGenerateurSequentiel,
  creerHorlogeReglable,
  type HorlogeReglable,
} from './doublures.js'

export const DEBUT_ESSAI = new Date('2026-09-23T08:00:00Z')

export interface BancAcces {
  readonly depot: DepotAccesSqlite
  readonly horloge: HorlogeReglable
  readonly generateur: ReturnType<typeof creerGenerateurSequentiel>
  readonly hachage: Hachage
}

export function creerBancAcces(): BancAcces {
  return {
    depot: creerDepotAccesSqlite(BASE_EN_MEMOIRE),
    horloge: creerHorlogeReglable(DEBUT_ESSAI),
    generateur: creerGenerateurSequentiel(),
    hachage: hachageSha256,
  }
}

const MOTIF_LIEN = /\/garagiste\/connexion\/lien\?jeton=([A-Za-z0-9_-]+)/

/** Jeton du lien contenu dans un texte (message envoyé, page de démonstration). */
export function jetonDuLien(texte: string): string {
  const jeton = MOTIF_LIEN.exec(texte)?.[1]
  if (jeton === undefined) throw new Error(`Aucun lien de connexion dans : ${texte}`)
  return jeton
}

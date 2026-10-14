import type { ModeSite } from '../../../contrats/index.js'

/**
 * Politique de publication (Kano D8) : chaque valeur du fichier du garage porte
 * un statut. Une valeur `valide` est confirmée, avec sa source ; une valeur
 * `a_valider` porte une note qui dit ce qu'il reste à obtenir, et parfois une
 * proposition (horaires types, engagements) destinée à la démonstration.
 */
export const STATUTS_VALEUR = ['valide', 'a_valider'] as const

export type StatutValeur = (typeof STATUTS_VALEUR)[number]

export interface ValeurPubliee<T> {
  readonly statut: StatutValeur
  /** `null` : rien de connu, pas même une proposition. */
  readonly valeur: T | null
  /** D'où vient la valeur (« proposition » pour une valeur de démonstration). */
  readonly source: string | null
  /** Ce qu'il reste à obtenir ; obligatoire pour une valeur à valider. */
  readonly note: string | null
}

/** Valeur sans laquelle aucune page ne se rend (nom, adresse, téléphone). */
export type ValeurIndispensable<T> = ValeurPubliee<T> & { readonly valeur: T }

/**
 * Ce qu'une vue reçoit d'une valeur, selon le mode du site.
 * - visible : la valeur s'affiche ; `aSurligner` en mode relecture si elle est à valider ;
 * - masquée : rien ne s'affiche. La note ne voyage qu'en mode relecture : en
 *   production et en démonstration, ce qui est masqué n'est pas transmis.
 */
export type Publication<T> =
  | { readonly visible: true; readonly valeur: T; readonly aSurligner: boolean }
  | { readonly visible: false; readonly noteDeRelecture: string | null }

const MASQUEE: Publication<never> = { visible: false, noteDeRelecture: null }

/**
 * Règles du Kano D8 et de l'arbitrage 3 :
 * - production : seule une valeur validée s'affiche ;
 * - démonstration : une proposition s'affiche normalement (le bandeau l'annonce) ;
 * - relecture : une proposition s'affiche surlignée, un manque se signale avec sa note.
 */
export function publier<T>(valeur: ValeurPubliee<T>, mode: ModeSite): Publication<T> {
  if (valeur.valeur === null) {
    return mode === 'relecture' ? { visible: false, noteDeRelecture: valeur.note } : MASQUEE
  }
  if (valeur.statut === 'valide') return { visible: true, valeur: valeur.valeur, aSurligner: false }
  switch (mode) {
    case 'production':
      return MASQUEE
    case 'demonstration':
      return { visible: true, valeur: valeur.valeur, aSurligner: false }
    case 'relecture':
      return { visible: true, valeur: valeur.valeur, aSurligner: true }
  }
}

/** La valeur si elle est publiée, `null` sinon. */
export function valeurPubliee<T>(publication: Publication<T>): T | null {
  return publication.visible ? publication.valeur : null
}

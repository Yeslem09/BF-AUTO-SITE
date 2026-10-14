import { estObjet, sousChemin, verifierCles, type Rapport } from './lecture-json.js'
import {
  STATUTS_VALEUR,
  type StatutValeur,
  type ValeurIndispensable,
  type ValeurPubliee,
} from './valeur-publiee.js'

/** Lit une valeur brute ; signale ses défauts dans le rapport et rend ce qu'il peut. */
export type Lecteur<T> = (brut: unknown, chemin: string, rapport: Rapport) => T

const CLES_VALEUR = ['statut', 'valeur'] as const
const CLES_VALEUR_FACULTATIVES = ['source', 'note'] as const
const LONGUEUR_MAX_META = 400

function estStatut(valeur: unknown): valeur is StatutValeur {
  return typeof valeur === 'string' && (STATUTS_VALEUR as readonly string[]).includes(valeur)
}

function lireMeta(brut: unknown, chemin: string, rapport: Rapport): string | null {
  if (brut === undefined || brut === null) return null
  if (typeof brut !== 'string' || brut.trim() === '') {
    rapport.signaler(chemin, 'texte non vide attendu (ou champ absent)')
    return null
  }
  if (brut.length > LONGUEUR_MAX_META) {
    rapport.signaler(chemin, `${brut.length} caractères, ${LONGUEUR_MAX_META} au plus`)
  }
  return brut.trim()
}

/**
 * Lit `{ "statut", "valeur", "source", "note" }`. Règles :
 * - une valeur validée a une valeur et une source (qui l'a confirmée, quand) ;
 * - une valeur à valider a une note (ce qu'il reste à obtenir) ;
 * - une proposition (valeur à valider non nulle) dit sa source, « proposition » en démonstration.
 */
export function lireValeur<T>(
  brut: unknown,
  chemin: string,
  rapport: Rapport,
  lire: Lecteur<T>,
): ValeurPubliee<T> {
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet { "statut", "valeur", "source", "note" } attendu')
    return { statut: 'a_valider', valeur: null, source: null, note: null }
  }
  verifierCles(brut, chemin, CLES_VALEUR, rapport, CLES_VALEUR_FACULTATIVES)
  const statutBrut = brut['statut']
  const statut: StatutValeur = estStatut(statutBrut) ? statutBrut : 'a_valider'
  if (!estStatut(statutBrut)) {
    rapport.signaler(sousChemin(chemin, 'statut'), '« valide » ou « a_valider » attendu')
  }
  const source = lireMeta(brut['source'], sousChemin(chemin, 'source'), rapport)
  const note = lireMeta(brut['note'], sousChemin(chemin, 'note'), rapport)
  const valeurBrute = brut['valeur']
  const valeur =
    valeurBrute === null || valeurBrute === undefined
      ? null
      : lire(valeurBrute, sousChemin(chemin, 'valeur'), rapport)

  if (statut === 'valide' && valeur === null) {
    rapport.signaler(
      chemin,
      'valeur validée absente : passer le statut à « a_valider » avec une note',
    )
  }
  if (statut === 'valide' && source === null) {
    rapport.signaler(sousChemin(chemin, 'source'), 'obligatoire pour une valeur validée')
  }
  if (statut === 'a_valider' && note === null) {
    rapport.signaler(sousChemin(chemin, 'note'), 'obligatoire : dire ce qu’il reste à obtenir')
  }
  if (statut === 'a_valider' && valeur !== null && source === null) {
    rapport.signaler(
      sousChemin(chemin, 'source'),
      'obligatoire pour une proposition (« proposition » pour la démonstration)',
    )
  }
  return { statut, valeur, source, note }
}

/** Valeur sans laquelle aucune page ne se rend : elle doit exister, validée ou non. */
export function lireValeurIndispensable<T>(
  brut: unknown,
  chemin: string,
  rapport: Rapport,
  lire: Lecteur<T>,
  secours: T,
): ValeurIndispensable<T> {
  const lue = lireValeur(brut, chemin, rapport, lire)
  if (lue.valeur === null) {
    rapport.signaler(sousChemin(chemin, 'valeur'), 'indispensable au rendu du site : la renseigner')
    return { ...lue, valeur: secours }
  }
  return { ...lue, valeur: lue.valeur }
}

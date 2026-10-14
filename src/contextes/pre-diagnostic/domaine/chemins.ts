import type { Arbre, Branche, Choix, Question, Resultat } from './arbre.js'
import { ErreurArbreIncoherent } from './erreurs.js'

/**
 * Chemins d'une branche, de sa première question à un résultat. Servent à la
 * porte (longueur, planchers, orphelins) et au livret de relecture.
 */

/** Questions en tête de tout parcours : le symptôme, puis les signes de danger. */
export const QUESTIONS_COMMUNES = 2
/** Cinq questions au plus sur un chemin, de la première question au résultat. */
export const MAX_QUESTIONS_PAR_CHEMIN = 5
export const MAX_QUESTIONS_PAR_BRANCHE = MAX_QUESTIONS_PAR_CHEMIN - QUESTIONS_COMMUNES

export interface Pas {
  readonly question: Question
  readonly choix: Choix
}

/**
 * Un chemin complet, ou interrompu parce qu'il dépasse le maximum de questions
 * (ce qui arrête aussi une boucle) : `resultat` vaut alors `null`.
 */
export interface Chemin {
  readonly pas: readonly Pas[]
  readonly resultat: Resultat | null
}

export function questionDe(arbre: Arbre, code: string): Question {
  const question = arbre.questions.get(code)
  if (question === undefined) throw new ErreurArbreIncoherent(`Question inconnue : ${code}.`)
  return question
}

export function resultatDe(arbre: Arbre, code: string): Resultat {
  const resultat = arbre.resultats.get(code)
  if (resultat === undefined) throw new ErreurArbreIncoherent(`Résultat inconnu : ${code}.`)
  return resultat
}

/** Tous les chemins de la branche, en profondeur, dans l'ordre des choix. */
export function cheminsDeBranche(arbre: Arbre, branche: Branche): readonly Chemin[] {
  const chemins: Chemin[] = []
  const explorer = (question: Question, pas: readonly Pas[]): void => {
    if (pas.length >= MAX_QUESTIONS_PAR_BRANCHE) {
      chemins.push({ pas, resultat: null })
      return
    }
    for (const choix of question.choix) {
      const suivants = [...pas, { question, choix }]
      if (choix.suite.vers === 'resultat') {
        chemins.push({ pas: suivants, resultat: resultatDe(arbre, choix.suite.code) })
      } else {
        explorer(questionDe(arbre, choix.suite.code), suivants)
      }
    }
  }
  explorer(questionDe(arbre, branche.depart), [])
  return chemins
}

/** Nombre de questions posées sur un chemin, symptôme et signes de danger compris. */
export function questionsPosees(chemin: Chemin): number {
  return QUESTIONS_COMMUNES + chemin.pas.length + (chemin.resultat === null ? 1 : 0)
}

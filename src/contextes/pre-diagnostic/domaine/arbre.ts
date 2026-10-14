import type { NiveauUrgence } from '../../../contrats/index.js'

/**
 * L'arbre du pré-diagnostic, tel que le domaine le manipule une fois lu et
 * vérifié. Il vient d'un fichier versionné (`donnees/pre-diagnostic.json`).
 *
 * Un parcours : la première question (le symptôme) choisit une branche ; la
 * deuxième (les signes de danger) est toujours posée ; puis la branche pose
 * une à trois questions jusqu'à un résultat. Cinq questions au plus en tout.
 */

/** Code du choix « Je ne sais pas », présent sur chaque question, y compris la première. */
export const CODE_NE_SAIS_PAS = 'ne-sais-pas'

/** Code du choix « Aucun de ces signes » de la question des signes de danger. */
export const CODE_AUCUN_SIGNE = 'aucun'

/** Code réservé de la deuxième question (signes de danger) : aucune question du fichier ne le porte. */
export const CODE_QUESTION_SIGNES = 'signes'

export const LIBELLE_AUCUN_SIGNE = 'Aucun de ces signes'
export const LIBELLE_NE_SAIS_PAS = 'Je ne sais pas'

/** Actions proposées sous un résultat. */
export const ACTIONS_RESULTAT = ['appeler', 'rappel', 'imprimer'] as const

export type ActionResultat = (typeof ACTIONS_RESULTAT)[number]

/** Une piste : une phrase simple, puis ce que l'atelier vérifiera. */
export interface Piste {
  readonly texte: string
  readonly verification: string
  /**
   * Famille d'intervention concernée (identifiant du catalogue, « freinage »),
   * ou null quand la piste n'en désigne pas une seule. Le résultat montre
   * alors la figure technique de la famille.
   */
  readonly famille: string | null
}

export interface Resultat {
  readonly code: string
  readonly niveau: NiveauUrgence
  readonly pistes: readonly Piste[]
}

export type Suite =
  | { readonly vers: 'question'; readonly code: string }
  | { readonly vers: 'resultat'; readonly code: string }

export interface Choix {
  readonly code: string
  readonly libelle: string
  readonly suite: Suite
}

export interface Question {
  readonly code: string
  readonly intitule: string
  readonly aide: string | null
  readonly choix: readonly Choix[]
}

/** Signe de danger proposé à la deuxième question. */
export interface SigneDanger {
  readonly code: string
  readonly libelle: string
  /** Conduite qu'impose ce signe ; la porte exige `ne-pas-rouler` pour tous. */
  readonly niveau: NiveauUrgence
}

/** Une branche : un choix de la première question et la suite qu'il ouvre. */
export interface Branche {
  readonly code: string
  /** Libellé du choix de la première question, dans les mots du conducteur. */
  readonly libelle: string
  /** Niveau en dessous duquel aucun résultat de la branche ne descend. */
  readonly plancher: NiveauUrgence
  /** Codes des signes de danger proposés en deuxième question, dans l'ordre d'affichage. */
  readonly signes: readonly string[]
  /** Code de la première question propre à la branche. */
  readonly depart: string
}

/** Relecture datée par le garagiste : sans elle, rien n'est publié en production. */
export interface Relecture {
  readonly reluPar: string
  /** Date de la séance, au format AAAA-MM-JJ. */
  readonly reluLe: string
}

export interface Arbre {
  readonly version: string
  readonly relecture: Relecture | null
  /** Branches refusées à la relecture : leurs résultats ne sont plus rendus. */
  readonly branchesNonValidees: ReadonlySet<string>
  /** Mention portée par chaque résultat. */
  readonly mention: string
  /** Actions portées par chaque résultat, dans l'ordre d'affichage. */
  readonly actions: readonly ActionResultat[]
  readonly premiereQuestion: string
  readonly questionSignes: string
  /** Signes de danger, dans l'ordre du fichier. */
  readonly signes: ReadonlyMap<string, SigneDanger>
  /** Branches, dans l'ordre des choix de la première question. */
  readonly branches: readonly Branche[]
  readonly questions: ReadonlyMap<string, Question>
  readonly resultats: ReadonlyMap<string, Resultat>
}

/** Signes de danger demandés par la branche, dans l'ordre d'affichage. */
export function signesDeBranche(arbre: Arbre, branche: Branche): readonly SigneDanger[] {
  return branche.signes.flatMap((code) => {
    const signe = arbre.signes.get(code)
    return signe === undefined ? [] : [signe]
  })
}

/**
 * Règles de la porte de l'arbre, chacune nommée : un test d'injection vérifie
 * que c'est bien CETTE règle qui refuse, pas une autre par hasard.
 */
export const REGLES_ARBRE = [
  /** Fichier mal formé : champ manquant, type faux, référence inconnue, code dupliqué. */
  'structure',
  /** Plus de 5 questions sur un chemin, de la première question au résultat. */
  'questions-par-chemin',
  /** Plus de 7 choix sur une question. */
  'choix-par-question',
  /** Une question sans le choix « Je ne sais pas ». */
  'ne-sais-pas-absent',
  /** Un signe de danger qui ne mène pas à « ne-pas-rouler ». */
  'signe-sans-arret',
  /** Pédale de frein, voyant rouge ou fumée absents de la question des signes d'une branche. */
  'signe-obligatoire-absent',
  /** Le signe du voyant rouge ne cite aucun exemple. */
  'signe-sans-exemple',
  /** Branche Bruit, Freinage ou Vibrations absente ou avec un plancher « Pas d'urgence ». */
  'plancher-obligatoire',
  /** Un résultat sous le plancher de sa branche. */
  'plancher-non-tenu',
  /** Un résultat sans piste, ou avec plus de 3 pistes. */
  'pistes-par-resultat',
  /** Une piste ou une vérification qui n'est pas une phrase unique terminée par un point. */
  'piste-une-phrase',
  /** Mot ou signe interdit : probabilité, certitude, garantie, montant, « avis ». */
  'mot-interdit',
  /** Geste de bricolage dangereux ou suppression d'un dispositif antipollution. */
  'geste-interdit',
  /** Résultats sans « Appeler » ou sans « Être rappelé ». */
  'actions-incompletes',
  /** Question ou résultat qu'aucune branche n'atteint. */
  'orphelin',
] as const

export type RegleArbre = (typeof REGLES_ARBRE)[number]

export interface Anomalie {
  readonly regle: RegleArbre
  readonly message: string
}

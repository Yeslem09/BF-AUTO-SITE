import { NIVEAUX_URGENCE, type NiveauUrgence } from '../../../contrats/index.js'

/** Conduite à tenir en toutes lettres, par niveau : la phrase que lit le conducteur. */
export const CONDUITES: Readonly<Record<NiveauUrgence, string>> = {
  'ne-pas-rouler': 'Ne roulez pas : appelez-nous',
  'a-controler': 'Roulez prudemment et faites contrôler dans les prochains jours',
  'sans-urgence': 'Pas d’urgence : à vérifier lors d’un prochain passage',
}

/** Niveau le moins grave, point de départ de tout calcul de niveau. */
export const NIVEAU_MINIMAL: NiveauUrgence = 'sans-urgence'

export function estNiveau(valeur: unknown): valeur is NiveauUrgence {
  return NIVEAUX_URGENCE.some((niveau) => niveau === valeur)
}

/** Rang de gravité : l'ordre du contrat fait foi, du moins grave au plus grave. */
export function rangNiveau(niveau: NiveauUrgence): number {
  return NIVEAUX_URGENCE.indexOf(niveau)
}

export function niveauLePlusGrave(niveaux: readonly NiveauUrgence[]): NiveauUrgence {
  return niveaux.reduce(
    (plusGrave, niveau) => (rangNiveau(niveau) > rangNiveau(plusGrave) ? niveau : plusGrave),
    NIVEAU_MINIMAL,
  )
}

export function estMoinsGrave(niveau: NiveauUrgence, reference: NiveauUrgence): boolean {
  return rangNiveau(niveau) < rangNiveau(reference)
}

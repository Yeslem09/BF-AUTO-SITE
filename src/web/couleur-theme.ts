import { readFileSync } from 'node:fs'
import { chercherCouleur, premieresDeclarations } from './jetons.js'

/**
 * Couleur de la barre du navigateur (`<meta name="theme-color">`), lue dans la
 * feuille de style construite plutôt que recopiée ici : la palette ne vit que
 * dans public/css/jetons.css (jeton `--couleur-theme`).
 */
export const JETON_COULEUR_THEME = '--couleur-theme'

/**
 * Valeur hexadécimale du jeton dans la feuille, en suivant les var(). Seule la
 * première déclaration de chaque propriété compte (celle de `:root`). `null`
 * si le jeton manque ou n'aboutit pas à une couleur hexadécimale.
 */
export function lireCouleurTheme(feuille: string, jeton = JETON_COULEUR_THEME): string | null {
  return chercherCouleur(premieresDeclarations(feuille), jeton)
}

/** Même lecture depuis le fichier ; `null` s'il est illisible. */
export function lireCouleurThemeDuFichier(chemin: string): string | null {
  try {
    return lireCouleurTheme(readFileSync(chemin, 'utf8'))
  } catch {
    return null
  }
}

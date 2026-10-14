/**
 * Lecture des jetons de couleur d'une feuille de style (source ou construite) :
 * couleur de thème au démarrage du serveur, portes de qualité en test
 * (contrastes, couleurs en dur).
 */

export type Declarations = ReadonlyMap<string, string>

const COMMENTAIRE = /\/\*[\s\S]*?\*\//g
const BLOC = /([^{}]+)\{([^{}]*)\}/g
const DECLARATION = /(--[a-z0-9-]+)\s*:\s*([^;]+)(?:;|$)/gi
const REFERENCE = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i
const HEXADECIMAL = /^#([0-9a-f]{6})$/i
const PROFONDEUR_MAX = 10

export function sansCommentaires(css: string): string {
  return css.replace(COMMENTAIRE, '')
}

/** Blocs qui déclarent des propriétés personnalisées, dans l'ordre de la feuille. */
export interface BlocDeJetons {
  /** Sélecteur normalisé, par exemple « :root, .zone-claire, .plaque ». */
  readonly selecteur: string
  readonly declarations: Declarations
}

export function lireBlocs(css: string): readonly BlocDeJetons[] {
  const blocs: BlocDeJetons[] = []
  for (const [, selecteur = '', corps = ''] of sansCommentaires(css).matchAll(BLOC)) {
    const cle = selecteur.replace(/\s+/g, ' ').trim()
    const declarations = new Map<string, string>()
    for (const [, nom = '', valeur = ''] of corps.matchAll(DECLARATION)) {
      declarations.set(nom, valeur.replace(/\s+/g, ' ').trim())
    }
    if (declarations.size > 0) blocs.push({ selecteur: cle, declarations })
  }
  return blocs
}

/** Première déclaration de chaque propriété dans la feuille (celle de `:root`). */
export function premieresDeclarations(css: string): Declarations {
  const declarations = new Map<string, string>()
  for (const bloc of lireBlocs(css)) {
    for (const [nom, valeur] of bloc.declarations) {
      if (!declarations.has(nom)) declarations.set(nom, valeur)
    }
  }
  return declarations
}

/** Superpose des jeux de déclarations, le dernier l'emportant. */
export function superposer(...jeux: readonly Declarations[]): Declarations {
  return new Map(jeux.flatMap((jeu) => [...jeu]))
}

/** Couleur hexadécimale à six chiffres d'un jeton, en suivant les var() ; null sinon. */
export function chercherCouleur(declarations: Declarations, jeton: string): string | null {
  let valeur = declarations.get(jeton)
  for (let etape = 0; valeur !== undefined && etape < PROFONDEUR_MAX; etape += 1) {
    if (HEXADECIMAL.test(valeur)) return valeur.toLowerCase()
    const reference = REFERENCE.exec(valeur)?.[1]
    valeur = reference === undefined ? undefined : declarations.get(reference)
  }
  return null
}

/** Comme `chercherCouleur`, mais un jeton sans couleur est une erreur. */
export function resoudreCouleur(declarations: Declarations, jeton: string): string {
  const couleur = chercherCouleur(declarations, jeton)
  if (couleur === null) {
    throw new Error(`Le jeton ${jeton} n’aboutit pas à une couleur hexadécimale à six chiffres.`)
  }
  return couleur
}

function luminance(hexadecimal: string): number {
  const composantes = [1, 3, 5].map((debut) => {
    const canal = Number.parseInt(hexadecimal.slice(debut, debut + 2), 16) / 255
    return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
  })
  const [rouge = 0, vert = 0, bleu = 0] = composantes
  return 0.2126 * rouge + 0.7152 * vert + 0.0722 * bleu
}

/** Rapport de contraste WCAG 2.2 entre deux couleurs hexadécimales. */
export function rapportContraste(premiere: string, seconde: string): number {
  const [claire, sombre] = [luminance(premiere), luminance(seconde)].sort((a, b) => b - a)
  return ((claire ?? 0) + 0.05) / ((sombre ?? 0) + 0.05)
}

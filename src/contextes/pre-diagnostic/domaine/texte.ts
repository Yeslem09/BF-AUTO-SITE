/**
 * Analyse des textes de l'arbre : recherche par mots entiers, sans tenir
 * compte de la casse ni des accents (« Sûrement » est trouvé, « certaines »
 * n'est pas pris pour « certain »).
 */

const DIACRITIQUES = /\p{Diacritic}/gu
const SEPARATEURS_DE_MOTS = /[^a-z0-9]+/
/** Fin de phrase suivie d'autre chose : le texte contient plus d'une phrase. */
const COUPURE_DE_PHRASE = /[.!?]\s+\S/
const FIN_DE_PHRASE = '.'

/** Minuscules sans accents : la forme sous laquelle on compare les mots. */
export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(DIACRITIQUES, '').toLowerCase()
}

export function motsDe(texte: string): readonly string[] {
  return normaliser(texte)
    .split(SEPARATEURS_DE_MOTS)
    .filter((mot) => mot !== '')
}

/** Mots de la liste (déjà normalisés) présents dans le texte, sans doublon. */
export function motsTrouves(texte: string, liste: ReadonlySet<string>): readonly string[] {
  return [...new Set(motsDe(texte).filter((mot) => liste.has(mot)))]
}

/** Une seule phrase, terminée par un point. */
export function estUnePhrase(texte: string): boolean {
  const propre = texte.trim()
  return propre.endsWith(FIN_DE_PHRASE) && !COUPURE_DE_PHRASE.test(propre)
}

/** Le texte contient-il l'expression, mots entiers, sans casse ni accents ? */
export function contientExpression(texte: string, expression: string): boolean {
  const mots = motsDe(texte).join(' ')
  const cherche = motsDe(expression).join(' ')
  return ` ${mots} `.includes(` ${cherche} `)
}

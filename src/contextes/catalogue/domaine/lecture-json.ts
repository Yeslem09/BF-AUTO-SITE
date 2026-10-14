/**
 * Outils de lecture d'un document JSON non typé. Chaque anomalie est notée
 * avec son chemin (`familles[2].prix.note`) au lieu d'interrompre la lecture :
 * celui qui corrige le fichier voit tous ses problèmes d'un coup.
 *
 * Une valeur absente (`undefined`) n'est pas signalée par les fonctions de
 * lecture : `verifierCles` l'a déjà notée comme champ manquant, une seule fois.
 */
export type ObjetJson = Readonly<Record<string, unknown>>

export class Rapport {
  private readonly liste: string[] = []

  signaler(chemin: string, message: string): void {
    this.liste.push(`${chemin} : ${message}`)
  }

  get problemes(): readonly string[] {
    return this.liste
  }
}

export interface Bornes {
  readonly min: number
  readonly max: number
}

export function estObjet(valeur: unknown): valeur is ObjetJson {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

export function sousChemin(parent: string, cle: string | number): string {
  if (typeof cle === 'number') return `${parent}[${cle}]`
  return parent === '' ? cle : `${parent}.${cle}`
}

/** Signale les clés manquantes et les clés inconnues (souvent une faute de frappe). */
export function verifierCles(
  objet: ObjetJson,
  chemin: string,
  obligatoires: readonly string[],
  rapport: Rapport,
  facultatives: readonly string[] = [],
): void {
  for (const cle of obligatoires) {
    if (!(cle in objet)) rapport.signaler(sousChemin(chemin, cle), 'champ manquant')
  }
  const admises = new Set([...obligatoires, ...facultatives])
  for (const cle of Object.keys(objet)) {
    if (!admises.has(cle)) rapport.signaler(sousChemin(chemin, cle), 'champ inconnu')
  }
}

/**
 * Objet attendu, dont les clés sont vérifiées. `null` si ce n'est pas un objet
 * (et signalé) : l'appelant n'en lit pas le contenu, pour ne pas noyer
 * l'erreur sous une cascade de champs manquants.
 */
export function lireObjet(
  valeur: unknown,
  chemin: string,
  rapport: Rapport,
  obligatoires: readonly string[],
  facultatives: readonly string[] = [],
): ObjetJson | null {
  if (valeur === undefined) return null
  if (!estObjet(valeur)) {
    rapport.signaler(chemin, 'objet attendu')
    return null
  }
  verifierCles(valeur, chemin, obligatoires, rapport, facultatives)
  return valeur
}

/** Texte non vide, espaces de bord retirés. Chaîne vide si invalide (et signalé). */
export function lireTexte(
  valeur: unknown,
  chemin: string,
  rapport: Rapport,
  longueurMax: number,
): string {
  if (valeur === undefined) return ''
  if (typeof valeur !== 'string' || valeur.trim() === '') {
    rapport.signaler(chemin, 'texte non vide attendu')
    return ''
  }
  const texte = valeur.trim()
  if (texte.length > longueurMax) {
    rapport.signaler(chemin, `${texte.length} caractères, ${longueurMax} au plus`)
  }
  return texte
}

/** Liste dont la longueur est bornée ; liste vide si ce n'est pas une liste (et signalé). */
export function lireListe(
  valeur: unknown,
  chemin: string,
  rapport: Rapport,
  bornes: Bornes,
): readonly unknown[] {
  if (valeur === undefined) return []
  if (!Array.isArray(valeur)) {
    rapport.signaler(chemin, 'liste attendue')
    return []
  }
  if (valeur.length < bornes.min || valeur.length > bornes.max) {
    rapport.signaler(
      chemin,
      `${valeur.length} élément(s), de ${bornes.min} à ${bornes.max} attendus`,
    )
  }
  return valeur
}

/** Valeur prise dans une liste fermée ; `repli` si elle n'y figure pas (et signalé). */
export function lireChoix<T extends string>(
  valeur: unknown,
  chemin: string,
  choix: readonly T[],
  rapport: Rapport,
  repli: T,
): T {
  if (valeur === undefined) return repli
  const trouve = choix.find((possible) => possible === valeur)
  if (trouve === undefined) {
    rapport.signaler(chemin, `une valeur parmi ${choix.join(', ')} attendue`)
    return repli
  }
  return trouve
}

/** Vrai ou faux ; `repli` si ce n'est pas un booléen (et signalé). */
export function lireBooleen(
  valeur: unknown,
  chemin: string,
  rapport: Rapport,
  repli: boolean,
): boolean {
  if (valeur === undefined) return repli
  if (typeof valeur !== 'boolean') {
    rapport.signaler(chemin, 'true ou false attendu')
    return repli
  }
  return valeur
}

/** Entier borné ; `bornes.min` si invalide (et signalé). */
export function lireEntier(
  valeur: unknown,
  chemin: string,
  rapport: Rapport,
  bornes: Bornes,
): number {
  if (valeur === undefined) return bornes.min
  if (typeof valeur !== 'number' || !Number.isInteger(valeur)) {
    rapport.signaler(chemin, 'nombre entier attendu')
    return bornes.min
  }
  if (valeur < bornes.min || valeur > bornes.max) {
    rapport.signaler(chemin, `${valeur} hors de l’intervalle ${bornes.min} à ${bornes.max}`)
  }
  return valeur
}

/** Signale chaque valeur répétée d'une liste, comparée sans casse. */
export function signalerDoublons(
  valeurs: readonly string[],
  chemin: string,
  rapport: Rapport,
): void {
  const vues = new Set<string>()
  for (const valeur of valeurs) {
    const cle = valeur.toLocaleLowerCase('fr')
    if (cle === '') continue
    if (vues.has(cle)) rapport.signaler(chemin, `« ${valeur} » figure deux fois`)
    vues.add(cle)
  }
}

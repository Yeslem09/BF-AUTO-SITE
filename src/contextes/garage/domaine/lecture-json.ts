/**
 * Outils de lecture d'un document JSON non typé. Chaque anomalie est notée
 * avec son chemin (`adresse.code_postal`) au lieu d'interrompre la lecture :
 * celui qui corrige le fichier voit tous ses problèmes d'un coup.
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

/** Texte non vide, espaces de bord retirés. Chaîne vide si invalide (et signalé). */
export function lireTexte(
  valeur: unknown,
  chemin: string,
  rapport: Rapport,
  longueurMax: number,
): string {
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

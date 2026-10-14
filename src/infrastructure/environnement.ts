/**
 * Lecture typée des variables d'environnement, anomalies rassemblées : une
 * configuration fausse se corrige en une passe, pas une variable à la fois.
 * Une variable secrète n'est jamais recopiée dans un message.
 */
import { estHoteLocal } from './reseau.js'

export type Environnement = Readonly<Record<string, string | undefined>>

export interface BornesEntier {
  readonly defaut: number
  readonly min: number
  readonly max: number
}

export interface LecteurEnvironnement {
  /** Valeur débarrassée de ses espaces de bord ; `null` si absente ou vide. */
  texte(nom: string): string | null
  /** Comme `texte`, pour un secret : aucun message ne le reproduira. */
  secret(nom: string): string | null
  /** Vrai si la variable est définie et non vide. */
  definie(nom: string): boolean
  entier(nom: string, bornes: BornesEntier): number
  booleen(nom: string, defaut: boolean): boolean
  courriel(nom: string): string | null
  choix<T extends string>(nom: string, valeurs: readonly T[]): T | null
  /** Adresse https, ou http vers la machine elle-même ; renvoyée sans barre finale. */
  url(nom: string, defaut: string): string
  signaler(probleme: string): void
  readonly problemes: readonly string[]
}

const FORMAT_COURRIEL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/
const BOOLEENS: Readonly<Record<string, boolean>> = { true: true, false: false }
const BARRES_FINALES = /\/+$/

export function estAdresseCourriel(valeur: string): boolean {
  return FORMAT_COURRIEL.test(valeur)
}

export function creerLecteurEnvironnement(env: Environnement): LecteurEnvironnement {
  const problemes: string[] = []
  const texte = (nom: string): string | null => {
    const valeur = env[nom]?.trim()
    return valeur === undefined || valeur === '' ? null : valeur
  }
  return {
    problemes,
    texte,
    secret: texte,
    definie: (nom) => texte(nom) !== null,
    signaler: (probleme) => {
      problemes.push(probleme)
    },
    entier(nom, { defaut, min, max }) {
      const brut = texte(nom)
      if (brut === null) return defaut
      const valeur = Number(brut)
      if (!Number.isInteger(valeur) || valeur < min || valeur > max) {
        problemes.push(`${nom} : « ${brut} », entier de ${min} à ${max} attendu`)
        return defaut
      }
      return valeur
    },
    booleen(nom, defaut) {
      const brut = texte(nom)
      if (brut === null) return defaut
      const valeur = BOOLEENS[brut.toLowerCase()]
      if (valeur === undefined) {
        problemes.push(`${nom} : « ${brut} », true ou false attendu`)
        return defaut
      }
      return valeur
    },
    courriel(nom) {
      const valeur = texte(nom)
      if (valeur !== null && !estAdresseCourriel(valeur)) {
        problemes.push(`${nom} : « ${valeur} » n’est pas une adresse de courriel`)
        return null
      }
      return valeur
    },
    choix(nom, valeurs) {
      const brut = texte(nom)
      if (brut === null) return null
      const valeur = valeurs.find((connue) => connue === brut.toLowerCase())
      if (valeur === undefined) {
        problemes.push(`${nom} : « ${brut} » inconnu (${valeurs.join(', ')})`)
        return null
      }
      return valeur
    },
    url(nom, defaut) {
      const brut = texte(nom) ?? defaut
      let adresse: URL
      try {
        adresse = new URL(brut)
      } catch {
        problemes.push(`${nom} : « ${brut} » n’est pas une adresse`)
        return defaut
      }
      const chiffree = adresse.protocol === 'https:'
      const locale = adresse.protocol === 'http:' && estHoteLocal(adresse.hostname)
      if (!chiffree && !locale) {
        problemes.push(`${nom} : https exigé (http admis seulement vers la machine elle-même)`)
        return defaut
      }
      return brut.replace(BARRES_FINALES, '')
    },
  }
}

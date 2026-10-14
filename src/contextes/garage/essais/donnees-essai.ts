/**
 * Outils de test du contexte garage : la configuration d'essai (tout validé,
 * entièrement fictive), le vrai fichier du site, et leurs variantes écrites
 * dans un dossier jetable. Réservé aux fichiers de test.
 */
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export const FICHIER_ESSAI = resolve(import.meta.dirname, 'garage-valide.json')
export const FICHIER_DU_SITE = resolve(import.meta.dirname, '../../../../donnees/garage.json')

export type Donnees = Record<string, unknown>

async function lire(chemin: string): Promise<Donnees> {
  return JSON.parse(await readFile(chemin, 'utf8')) as Donnees
}

/** Configuration d'essai : chaque valeur validée, horaires d'essai du Kano. */
export function donneesEssai(): Promise<Donnees> {
  return lire(FICHIER_ESSAI)
}

/** Le vrai fichier du site, avec ses valeurs à valider et ses propositions. */
export function donneesDuSite(): Promise<Donnees> {
  return lire(FICHIER_DU_SITE)
}

/** Remplace la valeur publiée au chemin donné (`socle_de_confiance.prenom_garagiste`). */
export function remplacer(donnees: Donnees, chemin: string, valeur: unknown): Donnees {
  const cles = chemin.split('.')
  const derniere = cles.pop()
  if (derniere === undefined) throw new Error('chemin vide')
  let courant = donnees
  for (const cle of cles) courant = courant[cle] as Donnees
  courant[derniere] = valeur
  return donnees
}

export const valide = (valeur: unknown) => ({ statut: 'valide', valeur, source: 'essai' })
export const aValider = (note: string, valeur: unknown = null) =>
  valeur === null
    ? { statut: 'a_valider', valeur: null, note }
    : { statut: 'a_valider', valeur, source: 'proposition', note }

export interface FichierJetable {
  readonly chemin: string
  nettoyer(): Promise<void>
}

/** Écrit les données dans un dossier temporaire, supprimé par `nettoyer()`. */
export async function ecrireDonnees(donnees: Donnees): Promise<FichierJetable> {
  const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-garage-'))
  const chemin = join(dossier, 'garage.json')
  await writeFile(chemin, JSON.stringify(donnees))
  return { chemin, nettoyer: () => rm(dossier, { recursive: true, force: true }) }
}

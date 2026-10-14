/**
 * Téléphone du garage lu dans `garage.json`, source unique de l'identité :
 * destinataire SMS par défaut des commandes. `null` si le fichier manque, si
 * le numéro n'est pas validé, ou si la structure a changé.
 */
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Environnement } from '../environnement.js'
import { lireChamp } from '../http.js'

const FICHIER_GARAGE = 'garage.json'
const DONNEES_PAR_DEFAUT = 'donnees'
const STATUT_VALIDE = 'valide'

export async function lireTelephoneGarage(
  env: Environnement,
  repertoireCourant: string,
): Promise<string | null> {
  const dossier = resolve(repertoireCourant, env['CHEMIN_DONNEES']?.trim() || DONNEES_PAR_DEFAUT)
  let contenu: unknown
  try {
    contenu = JSON.parse(await readFile(join(dossier, FICHIER_GARAGE), 'utf8'))
  } catch {
    return null
  }
  const telephone = lireChamp(lireChamp(contenu, 'identite'), 'telephone')
  const valeur = lireChamp(telephone, 'valeur')
  return lireChamp(telephone, 'statut') === STATUT_VALIDE && typeof valeur === 'string'
    ? valeur
    : null
}

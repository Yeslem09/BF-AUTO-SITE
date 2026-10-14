import { readFile } from 'node:fs/promises'
import { ErreurDonneesDemandes } from '../../domaine/erreurs.js'
import { lireParametresDemandes, type ParametresDemandes } from '../../domaine/parametres.js'

/** Lit et valide `donnees/demandes.json` ; le serveur ne démarre pas s'il est absent ou invalide. */
export async function chargerParametresDemandes(chemin: string): Promise<ParametresDemandes> {
  let texte: string
  try {
    texte = await readFile(chemin, 'utf8')
  } catch (erreur) {
    throw new ErreurDonneesDemandes([
      `fichier illisible (${chemin}) : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
    ])
  }
  let contenu: unknown
  try {
    contenu = JSON.parse(texte)
  } catch (erreur) {
    throw new ErreurDonneesDemandes([
      `JSON invalide (${chemin}) : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
    ])
  }
  return lireParametresDemandes(contenu)
}

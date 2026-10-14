import { readFile } from 'node:fs/promises'
import type { SourceIdentiteGarage } from '../../application/ports.js'
import type { Garage } from '../../domaine/garage.js'
import { validerDonneesGarage } from '../../domaine/validation.js'

export class ErreurFichierGarage extends Error {
  override readonly name = 'ErreurFichierGarage'
}

/**
 * Lit `donnees/garage.json` une seule fois, le valide et garde le résultat.
 * Un fichier illisible ou invalide fait échouer le premier chargement, donc le
 * démarrage : le site ne tourne jamais avec une identité douteuse.
 */
export function creerSourceIdentiteFichier(chemin: string): SourceIdentiteGarage {
  let chargement: Promise<Garage> | null = null
  return {
    charger() {
      chargement ??= lireGarage(chemin)
      return chargement
    },
  }
}

async function lireGarage(chemin: string): Promise<Garage> {
  let contenu: string
  try {
    contenu = await readFile(chemin, 'utf8')
  } catch (erreur) {
    throw new ErreurFichierGarage(`Fichier du garage illisible : ${chemin}.`, { cause: erreur })
  }
  let brut: unknown
  try {
    brut = JSON.parse(contenu)
  } catch (erreur) {
    throw new ErreurFichierGarage(`${chemin} n’est pas un JSON valide : ${messageDe(erreur)}`, {
      cause: erreur,
    })
  }
  try {
    return validerDonneesGarage(brut)
  } catch (erreur) {
    throw new ErreurFichierGarage(`${chemin} : ${messageDe(erreur)}`, { cause: erreur })
  }
}

function messageDe(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : String(erreur)
}

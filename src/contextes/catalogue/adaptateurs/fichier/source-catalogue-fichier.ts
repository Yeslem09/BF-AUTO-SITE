import { readFile } from 'node:fs/promises'
import type { SourceCatalogue } from '../../application/ports.js'
import type { Catalogue } from '../../domaine/catalogue.js'
import { validerCatalogue } from '../../domaine/validation.js'

export class ErreurFichierCatalogue extends Error {
  override readonly name = 'ErreurFichierCatalogue'
}

/**
 * Lit `donnees/catalogue.json` une seule fois, le valide et garde le résultat.
 * Un fichier illisible ou invalide fait échouer le premier chargement, donc le
 * démarrage : le site ne tourne jamais avec un catalogue douteux.
 */
export function creerSourceCatalogueFichier(chemin: string): SourceCatalogue {
  let chargement: Promise<Catalogue> | null = null
  return {
    charger() {
      chargement ??= lireCatalogue(chemin)
      return chargement
    },
  }
}

async function lireCatalogue(chemin: string): Promise<Catalogue> {
  let contenu: string
  try {
    contenu = await readFile(chemin, 'utf8')
  } catch (erreur) {
    throw new ErreurFichierCatalogue(`Fichier du catalogue illisible : ${chemin}.`, {
      cause: erreur,
    })
  }
  let brut: unknown
  try {
    brut = JSON.parse(contenu)
  } catch (erreur) {
    throw new ErreurFichierCatalogue(`${chemin} n’est pas un JSON valide : ${messageDe(erreur)}`, {
      cause: erreur,
    })
  }
  try {
    return validerCatalogue(brut)
  } catch (erreur) {
    throw new ErreurFichierCatalogue(`${chemin} : ${messageDe(erreur)}`, { cause: erreur })
  }
}

function messageDe(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : String(erreur)
}

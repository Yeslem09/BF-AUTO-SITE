import { readFile } from 'node:fs/promises'
import type { SourceArbre } from '../../application/ports.js'

export class ErreurFichierArbre extends Error {
  override readonly name = 'ErreurFichierArbre'
}

/** Lit `donnees/pre-diagnostic.json` : le contenu analysé, sans l'interpréter. */
export function creerSourceArbreFichier(chemin: string): SourceArbre {
  return {
    async lire() {
      let contenu: string
      try {
        contenu = await readFile(chemin, 'utf8')
      } catch (erreur) {
        throw new ErreurFichierArbre(`Arbre du pré-diagnostic illisible : ${chemin}.`, {
          cause: erreur,
        })
      }
      try {
        return JSON.parse(contenu) as unknown
      } catch (erreur) {
        const detail = erreur instanceof Error ? erreur.message : String(erreur)
        throw new ErreurFichierArbre(`${chemin} n’est pas un JSON valide : ${detail}`, {
          cause: erreur,
        })
      }
    },
  }
}

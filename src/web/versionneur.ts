import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const PARAMETRE_VERSION = 'v'
const LONGUEUR_EMPREINTE = 12

export class ErreurRessourceAbsente extends Error {
  override readonly name = 'ErreurRessourceAbsente'
}

/**
 * Ajoute à un chemin public l'empreinte de son contenu (`/css/bf-auto.css?v=3f2a...`).
 * L'empreinte change avec le fichier : le navigateur peut garder la ressource
 * indéfiniment sans jamais servir une version périmée. Recalculée seulement
 * quand la date de modification change, donc sûre pendant le développement.
 */
export function creerVersionneur(racinePublique: string): (cheminPublic: string) => string {
  const connues = new Map<string, { modification: number; empreinte: string }>()
  return (cheminPublic) => {
    const fichier = join(racinePublique, cheminPublic)
    let modification: number
    try {
      modification = statSync(fichier).mtimeMs
    } catch {
      throw new ErreurRessourceAbsente(
        `Ressource publique absente : ${cheminPublic} (attendue dans ${fichier}).`,
      )
    }
    const connue = connues.get(cheminPublic)
    if (connue?.modification === modification) return avecVersion(cheminPublic, connue.empreinte)
    const empreinte = createHash('sha256')
      .update(readFileSync(fichier))
      .digest('hex')
      .slice(0, LONGUEUR_EMPREINTE)
    connues.set(cheminPublic, { modification, empreinte })
    return avecVersion(cheminPublic, empreinte)
  }
}

function avecVersion(cheminPublic: string, empreinte: string): string {
  return `${cheminPublic}?${PARAMETRE_VERSION}=${empreinte}`
}

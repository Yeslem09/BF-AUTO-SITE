import type { Arbre } from '../domaine/arbre.js'
import { composerLivret, type Livret } from '../domaine/livret.js'

export type ConsulterLivret = () => Livret

/** Livret de relecture, recomposé depuis l'arbre à chaque consultation. */
export function creerConsulterLivret(arbre: Arbre): ConsulterLivret {
  return () => composerLivret(arbre)
}

import type { Arbre } from '../domaine/arbre.js'
import { avancer, type Etape, type EtatParcours } from '../domaine/parcours.js'

export type ConsulterEtape = (etat: EtatParcours) => Etape

/** L'étape à afficher pour les réponses reçues : question suivante, arrêt ou résultat. */
export function creerConsulterEtape(arbre: Arbre): ConsulterEtape {
  return (etat) => avancer(arbre, etat)
}

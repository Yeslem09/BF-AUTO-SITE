import type { Arbre } from '../domaine/arbre.js'
import { ErreurArbreRefuse } from '../domaine/erreurs.js'
import { examinerArbre } from '../domaine/porte-arbre.js'
import type { SourceArbre } from './ports.js'

/**
 * Charge l'arbre et le fait passer par la porte. Un arbre refusé fait échouer
 * l'assemblage du contexte, donc le démarrage : le site ne pose jamais une
 * question que la porte n'a pas acceptée.
 */
export async function chargerArbre(source: SourceArbre): Promise<Arbre> {
  const examen = examinerArbre(await source.lire())
  if (!examen.accepte) throw new ErreurArbreRefuse(examen.anomalies)
  return examen.arbre
}

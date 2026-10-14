import type { ResumePreDiagnostic } from '../../../contrats/index.js'
import type { Arbre } from '../domaine/arbre.js'
import { lireCode } from '../domaine/code-parcours.js'
import { avancer, ETAT_INITIAL, estEtapeFinale } from '../domaine/parcours.js'
import { resumer } from '../domaine/resume.js'

export type RetrouverResume = (code: string) => ResumePreDiagnostic | null

/**
 * Reconstitue le résumé d'un parcours à partir de son code. Seul un code
 * exact, qui mène à un arrêt ou à un résultat, est reconnu : un code inconnu,
 * incomplet ou enrichi d'une valeur étrangère donne `null`.
 */
export function creerRetrouverResume(arbre: Arbre): RetrouverResume {
  return (code) => {
    const reponses = lireCode(code)
    if (reponses === null) return null
    const etape = avancer(arbre, { ...ETAT_INITIAL, ...reponses })
    if (!estEtapeFinale(etape) || etape.code !== code) return null
    return resumer(etape)
  }
}

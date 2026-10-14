/**
 * Porte de l'arbre du pré-diagnostic, en ligne de commande :
 *
 *   pnpm exec tsx src/contextes/pre-diagnostic/adaptateurs/console/porte-arbre.ts [chemin]
 *
 * Code de sortie 0 si l'arbre passe, 1 s'il est refusé (anomalies listées),
 * 2 si le fichier est illisible. Les mêmes règles s'appliquent au démarrage du
 * site : un arbre refusé l'empêche de démarrer.
 */
import { pathToFileURL } from 'node:url'
import { chargerArbre } from '../../application/charger-arbre.js'
import { cheminsDeBranche } from '../../domaine/chemins.js'
import { ErreurArbreRefuse } from '../../domaine/erreurs.js'
import { creerSourceArbreFichier, ErreurFichierArbre } from '../fichier/source-arbre-fichier.js'

export const CHEMIN_ARBRE_PAR_DEFAUT = 'donnees/pre-diagnostic.json'
export const SORTIE_ACCEPTE = 0
export const SORTIE_REFUSE = 1
export const SORTIE_ILLISIBLE = 2

export async function executerPorteArbre(
  chemin: string,
  ecrire: (ligne: string) => void,
): Promise<number> {
  try {
    const arbre = await chargerArbre(creerSourceArbreFichier(chemin))
    const chemins = arbre.branches.reduce(
      (total, branche) => total + cheminsDeBranche(arbre, branche).length,
      0,
    )
    ecrire(
      `Arbre du pré-diagnostic accepté (${chemin}) : ${arbre.branches.length} branches, ` +
        `${arbre.questions.size} questions, ${arbre.resultats.size} résultats, ${chemins} chemins.`,
    )
    ecrire(
      arbre.relecture === null
        ? 'Relecture : non datée, le pré-diagnostic ne sera pas publié en production.'
        : `Relecture : par ${arbre.relecture.reluPar}, le ${arbre.relecture.reluLe}.`,
    )
    return SORTIE_ACCEPTE
  } catch (erreur) {
    if (erreur instanceof ErreurArbreRefuse) {
      ecrire(erreur.message)
      return SORTIE_REFUSE
    }
    if (erreur instanceof ErreurFichierArbre) {
      ecrire(erreur.message)
      return SORTIE_ILLISIBLE
    }
    throw erreur
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await executerPorteArbre(process.argv[2] ?? CHEMIN_ARBRE_PAR_DEFAUT, (ligne) =>
    console.log(ligne),
  )
}

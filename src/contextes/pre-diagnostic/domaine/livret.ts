import type { NiveauUrgence, ReponseLisible } from '../../../contrats/index.js'
import {
  signesDeBranche,
  type Arbre,
  type Branche,
  type Question,
  type Resultat,
  type SigneDanger,
} from './arbre.js'
import { cheminsDeBranche } from './chemins.js'
import { niveauLePlusGrave } from './niveau.js'

/**
 * Livret de relecture : l'arbre mis en français courant, branche par branche,
 * pour être relu à voix haute avec le garagiste. Il est toujours produit depuis
 * le fichier de l'arbre, jamais édité à la main.
 */

export interface ResultatAuLivret {
  readonly resultat: Resultat
  /** Niveau affiché au conducteur qui ne coche aucun signe : plancher de la branche compris. */
  readonly niveau: NiveauUrgence
  /** Suites de réponses qui mènent à ce résultat. */
  readonly chemins: readonly (readonly ReponseLisible[])[]
}

export interface BrancheAuLivret {
  readonly branche: Branche
  readonly signes: readonly SigneDanger[]
  /** Questions de la branche, dans l'ordre où elles apparaissent. */
  readonly questions: readonly Question[]
  readonly resultats: readonly ResultatAuLivret[]
  /** Branche déjà refusée à une relecture précédente. */
  readonly elaguee: boolean
}

export interface Livret {
  readonly arbre: Arbre
  readonly branches: readonly BrancheAuLivret[]
}

export function composerLivret(arbre: Arbre): Livret {
  return { arbre, branches: arbre.branches.map((branche) => brancheAuLivret(arbre, branche)) }
}

function brancheAuLivret(arbre: Arbre, branche: Branche): BrancheAuLivret {
  const questions = new Map<string, Question>()
  const resultats = new Map<string, { resultat: Resultat; chemins: ReponseLisible[][] }>()
  for (const chemin of cheminsDeBranche(arbre, branche)) {
    for (const pas of chemin.pas) questions.set(pas.question.code, pas.question)
    if (chemin.resultat === null) continue
    const reponses = chemin.pas.map((pas) => ({
      question: pas.question.intitule,
      reponse: pas.choix.libelle,
    }))
    const entree = resultats.get(chemin.resultat.code)
    if (entree === undefined) {
      resultats.set(chemin.resultat.code, { resultat: chemin.resultat, chemins: [reponses] })
    } else {
      entree.chemins.push(reponses)
    }
  }
  return {
    branche,
    signes: signesDeBranche(arbre, branche),
    questions: [...questions.values()],
    resultats: [...resultats.values()].map(({ resultat, chemins }) => ({
      resultat,
      niveau: niveauLePlusGrave([resultat.niveau, branche.plancher]),
      chemins,
    })),
    elaguee: arbre.branchesNonValidees.has(branche.code),
  }
}

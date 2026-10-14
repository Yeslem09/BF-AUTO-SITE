import type { VuePage } from '../../../../../web/index.js'
import { LIBELLE_NE_SAIS_PAS } from '../../../domaine/arbre.js'
import type { EtapeQuestion } from '../../../domaine/parcours.js'
import { PARAMETRES_PARCOURS } from '../adresses.js'
import { citer, type ContexteVue } from './commun.js'
import { vueFormulaireQuestion } from './formulaire-question.js'

export const ERREUR_QUESTION = `Choisissez une réponse, ou ${citer(LIBELLE_NE_SAIS_PAS)}.`

/** Question propre à la branche : une seule réponse, en boutons radio. */
export function vueQuestion(etape: EtapeQuestion, contexte: ContexteVue): VuePage {
  return vueFormulaireQuestion(
    {
      numero: etape.numero,
      intitule: etape.question.intitule,
      aide: etape.question.aide,
      type: 'radio',
      nom: PARAMETRES_PARCOURS.reponse,
      options: etape.question.choix,
      cochees: etape.cochee === null ? [] : [etape.cochee],
      erreur: etape.erreur ? ERREUR_QUESTION : null,
      etat: etape.etat,
      codeEtape: etape.question.code,
      retour: etape.retour,
    },
    contexte,
  )
}

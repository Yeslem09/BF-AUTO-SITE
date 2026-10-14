import type { VuePage } from '../../../../../web/index.js'
import {
  CODE_AUCUN_SIGNE,
  CODE_QUESTION_SIGNES,
  LIBELLE_AUCUN_SIGNE,
  LIBELLE_NE_SAIS_PAS,
} from '../../../domaine/arbre.js'
import type { EtapeSignes, Option } from '../../../domaine/parcours.js'
import { PARAMETRES_PARCOURS } from '../adresses.js'
import { citer, type ContexteVue } from './commun.js'
import { vueFormulaireQuestion } from './formulaire-question.js'

export const AIDE_SIGNES = 'Cochez tout ce que vous remarquez en ce moment.'
export const ERREUR_SIGNES = `Cochez au moins une case : un signe, ${citer(LIBELLE_AUCUN_SIGNE)} ou ${citer(LIBELLE_NE_SAIS_PAS)}.`

/**
 * « Aucun de ces signes » en tête (J1, passe 2 du jury) : la réponse la plus
 * fréquente se voit sans défiler sur un téléphone ; les signes suivent, puis
 * « Je ne sais pas ». Un signe coché l'emporte toujours (domaine).
 */
export function aucunSigneEnTete(options: readonly Option[]): readonly Option[] {
  return [
    ...options.filter((option) => option.code === CODE_AUCUN_SIGNE),
    ...options.filter((option) => option.code !== CODE_AUCUN_SIGNE),
  ]
}

/** Deuxième question, toujours posée : les signes de danger, en cases à cocher. */
export function vueSignes(etape: EtapeSignes, contexte: ContexteVue): VuePage {
  return vueFormulaireQuestion(
    {
      numero: etape.numero,
      intitule: etape.intitule,
      aide: AIDE_SIGNES,
      type: 'checkbox',
      nom: PARAMETRES_PARCOURS.signes,
      options: aucunSigneEnTete(etape.options),
      cochees: etape.cochees,
      erreur: etape.erreur ? ERREUR_SIGNES : null,
      etat: etape.etat,
      codeEtape: CODE_QUESTION_SIGNES,
      retour: etape.retour,
    },
    contexte,
  )
}

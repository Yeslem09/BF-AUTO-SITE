import type { VuePage } from '../../../../../web/index.js'
import type { Etape } from '../../../domaine/parcours.js'
import { vueArret } from './arret.js'
import type { ContexteVue } from './commun.js'
import { vueEntree } from './entree.js'
import { vueQuestion } from './question.js'
import { vueResultat } from './resultat.js'
import { vueSignes } from './signes.js'

/** La page d'une étape du parcours. Seule l'entrée nue est ouverte aux moteurs de recherche. */
export function vueEtape(etape: Etape, contexte: ContexteVue, entreeNue: boolean): VuePage {
  switch (etape.type) {
    case 'symptome':
      return vueEntree(etape, contexte, entreeNue)
    case 'signes':
      return vueSignes(etape, contexte)
    case 'question':
      return vueQuestion(etape, contexte)
    case 'arret':
      return vueArret(etape, contexte)
    case 'resultat':
      return vueResultat(etape, contexte)
  }
}

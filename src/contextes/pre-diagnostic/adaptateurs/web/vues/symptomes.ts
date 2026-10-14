import { html, type Html } from '../../../../../web/index.js'
import { CODE_NE_SAIS_PAS } from '../../../domaine/arbre.js'
import type { EtapeSymptome } from '../../../domaine/parcours.js'
import { adresseSymptome } from '../adresses.js'

/** Sous la réponse donnée plus tôt, quand on revient à la question. */
export const LIBELLE_REPONSE_PRECEDENTE = 'Votre réponse précédente'

/**
 * Classes d'un bouton de choix : « Je ne sais pas » cadré en tirets, la
 * réponse donnée plus tôt (retour arrière) au bord doublé.
 */
export function classesChoix(code: string, precedente: boolean): string {
  return [
    'bouton-choix',
    code === CODE_NE_SAIS_PAS ? 'bouton-choix--incertain' : null,
    precedente ? 'pre-diagnostic-choix--precedent' : null,
  ]
    .filter((classe): classe is string => classe !== null)
    .join(' ')
}

/**
 * Les choix de la première question en liens directs, avec l'apparence des
 * boutons de choix (`.bouton-choix`, 48 px) : un geste par choix, aucun
 * formulaire. « Autre chose ou je ne sais pas » est cadré en tirets.
 */
export function rendreLiensSymptomes(etape: EtapeSymptome, idIntitule: string): Html {
  return html`<ul class="liste-choix liste-choix--colonnes" aria-labelledby="${idIntitule}">
  ${etape.options.map((option) => {
    const precedente = option.code === etape.cochee
    const classe = classesChoix(option.code, precedente)
    return html`<li><a class="${classe}" href="${adresseSymptome(option.code)}"${precedente && html` aria-current="true"`}><span class="bouton-choix__titre">${option.libelle}</span>${precedente && html`<span class="bouton-choix__aide">${LIBELLE_REPONSE_PRECEDENTE}</span>`}</a></li>`
  })}
</ul>`
}

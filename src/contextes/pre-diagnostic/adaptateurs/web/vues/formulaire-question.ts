import { CHEMINS } from '../../../../../contrats/index.js'
import { brut, html, type Html, type VuePage } from '../../../../../web/index.js'
import { CODE_AUCUN_SIGNE, CODE_NE_SAIS_PAS } from '../../../domaine/arbre.js'
import type { EtatParcours, Option } from '../../../domaine/parcours.js'
import {
  ATTRIBUTS_FOCUS,
  DESCRIPTION_PARCOURS,
  progression,
  rendreAvertissementRelecture,
  rendreBandeauParcours,
  rendreChampsCaches,
  rendreFilAriane,
  rendreNavigationParcours,
  sansCoupureAuTrait,
  SCRIPT_ETAPE,
  type ContexteVue,
} from './commun.js'
import { classesChoix, LIBELLE_REPONSE_PRECEDENTE } from './symptomes.js'

/** Une question par page : un formulaire GET, sans JavaScript, qui porte les réponses précédentes. */
export interface QuestionAffichee {
  readonly numero: number
  readonly intitule: string
  readonly aide: string | null
  /**
   * Cases à cocher en tuiles, puis « Continuer » (signes de danger), ou
   * boutons de choix qui envoient la réponse d'un seul geste (une seule réponse).
   */
  readonly type: 'checkbox' | 'radio'
  readonly nom: string
  readonly options: readonly Option[]
  readonly cochees: readonly string[]
  readonly erreur: string | null
  readonly etat: EtatParcours
  readonly codeEtape: string
  readonly retour: EtatParcours
}

const ID_AIDE = 'pre-diagnostic-aide'
const ID_ERREUR = 'pre-diagnostic-erreur'
const PREFIXE_TITRE_ERREUR = 'Erreur : '
export const LIBELLE_CONTINUER = 'Continuer'

export function vueFormulaireQuestion(question: QuestionAffichee, contexte: ContexteVue): VuePage {
  const decritPar = [
    question.aide !== null ? ID_AIDE : null,
    question.erreur !== null ? ID_ERREUR : null,
  ]
    .filter((id): id is string => id !== null)
    .join(' ')
  const titre = `Question ${question.numero} du pré-diagnostic : ${question.intitule}`
  const cases = question.type === 'checkbox'
  return {
    titre: question.erreur === null ? titre : `${PREFIXE_TITRE_ERREUR}${titre}`,
    description: DESCRIPTION_PARCOURS,
    chemin: CHEMINS.preDiagnostic,
    rubrique: 'pre-diagnostic',
    indexable: false,
    scripts: [SCRIPT_ETAPE],
    contenu: html`<div class="conteneur section pile pre-diagnostic">
  ${rendreFilAriane(`Question ${question.numero}`)}
  ${rendreAvertissementRelecture(contexte.aRelire)}
  <div class="plaque pre-diagnostic-plaque"><div class="plaque__filet">
  <form class="pre-diagnostic-etape" method="get" action="${CHEMINS.preDiagnostic}">
    ${rendreChampsCaches(question.etat, question.codeEtape)}
    <fieldset class="pre-diagnostic-groupe"${decritPar !== '' && html` aria-describedby="${decritPar}"`}>
      <legend class="pre-diagnostic-legende">
        <span class="surtitre pre-diagnostic-progression">${progression(question.numero)}</span>
        <h1 class="pre-diagnostic-question" tabindex="-1"${question.erreur === null && html` data-pre-diagnostic-focus`}>${sansCoupureAuTrait(question.intitule)}</h1>
      </legend>
      ${question.aide !== null && html`<p class="champ__aide" id="${ID_AIDE}">${question.aide}</p>`}
      ${question.erreur !== null && html`<p class="champ__erreur pre-diagnostic-erreur" id="${ID_ERREUR}" ${brut(ATTRIBUTS_FOCUS)}><span class="visuellement-masque">${PREFIXE_TITRE_ERREUR}</span>${question.erreur}</p>`}
      <ul class="liste-choix">
        ${question.options.map((option) => (cases ? rendreTuile(question, option) : rendreBouton(question, option)))}
      </ul>
    </fieldset>
    ${cases && html`<button class="bouton bouton--principal pre-diagnostic-continuer" type="submit">${LIBELLE_CONTINUER}</button>`}
  </form>
  </div></div>
  ${rendreNavigationParcours(question.retour)}
  ${rendreBandeauParcours()}
</div>`,
  }
}

/**
 * Case à cocher en tuile bordée : « Aucun de ces signes », en tête, se détache
 * des signes qui le suivent ; « Je ne sais pas », à la fin, aussi.
 */
function rendreTuile(question: QuestionAffichee, option: Option): Html {
  const cochee = question.cochees.includes(option.code)
  const classes = [
    'choix-tuile',
    option.code === CODE_NE_SAIS_PAS ? 'pre-diagnostic-tuile--incertain' : null,
  ]
    .filter((classe): classe is string => classe !== null)
    .join(' ')
  const neutre =
    option.code === CODE_AUCUN_SIGNE
      ? 'pre-diagnostic-choix-aucun'
      : option.code === CODE_NE_SAIS_PAS
        ? 'pre-diagnostic-choix-neutre'
        : null
  return html`<li${neutre !== null && html` class="${neutre}"`}><label class="${classes}"><input type="${question.type}" name="${question.nom}" value="${option.code}"${cochee && html` checked`}><span>${option.libelle}</span></label></li>`
}

/**
 * Bouton de choix qui envoie la réponse d'un geste, sans « Continuer ». La
 * réponse donnée plus tôt (retour arrière) est signalée en toutes lettres.
 */
function rendreBouton(question: QuestionAffichee, option: Option): Html {
  const precedente = question.cochees.includes(option.code)
  const classe = classesChoix(option.code, precedente)
  return html`<li><button class="${classe}" type="submit" name="${question.nom}" value="${option.code}"${precedente && html` aria-current="true"`}><span class="bouton-choix__titre">${option.libelle}</span>${precedente && html`<span class="bouton-choix__aide">${LIBELLE_REPONSE_PRECEDENTE}</span>`}</button></li>`
}

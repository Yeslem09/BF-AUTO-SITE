import { CHEMINS } from '../../../../../contrats/index.js'
import { brut, html, type VuePage } from '../../../../../web/index.js'
import type { EtapeArret } from '../../../domaine/parcours.js'
import {
  ATTRIBUTS_FOCUS,
  barreFixeVersRappel,
  CLASSE_FICHE,
  DESCRIPTION_PARCOURS,
  ETAPE_RESULTAT,
  rendreAvertissementRelecture,
  rendreConsignesArret,
  rendreFilAriane,
  rendreImpression,
  rendreMention,
  rendreNavigationParcours,
  rendreReponses,
  SCRIPT_ETAPE,
  SCRIPT_IMPRESSION,
  type ContexteVue,
} from './commun.js'

export const TITRE_ARRET = 'Ne roulez pas.'

/**
 * Un signe de danger est coché : aucune autre question. L'alerte rouge dit la
 * conduite et ce qui l'impose, puis les consignes, dans le même ordre que le
 * garage soit ouvert ou fermé.
 */
export function vueArret(etape: EtapeArret, contexte: ContexteVue): VuePage {
  return {
    titre: 'Ne roulez pas : pré-diagnostic',
    description: DESCRIPTION_PARCOURS,
    chemin: CHEMINS.preDiagnostic,
    rubrique: 'pre-diagnostic',
    indexable: false,
    scripts: [SCRIPT_IMPRESSION, SCRIPT_ETAPE],
    ...barreFixeVersRappel(etape.code),
    contenu: html`<div class="conteneur section pile pre-diagnostic ${CLASSE_FICHE}">
  ${rendreFilAriane(ETAPE_RESULTAT)}
  ${rendreAvertissementRelecture(contexte.aRelire)}
  <div class="alerte alerte--danger pre-diagnostic-conduite" role="status">
    <h1 class="alerte__titre" ${brut(ATTRIBUTS_FOCUS)}>${TITRE_ARRET}</h1>
    <p>Vous avez signalé :</p>
    <ul class="pre-diagnostic-signales">
      ${etape.signes.map((signe) => html`<li>${signe.libelle}</li>`)}
    </ul>
  </div>
  ${rendreConsignesArret(contexte.actions, contexte.contact, etape.code)}
  ${rendreReponses(etape.reponses)}
  ${rendreMention(contexte.mention)}
  ${rendreImpression(contexte.actions)}
  ${rendreNavigationParcours(etape.retour, true)}
</div>`,
  }
}

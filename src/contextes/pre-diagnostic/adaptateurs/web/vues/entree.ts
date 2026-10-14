import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type CadrePage, type VuePage } from '../../../../../web/index.js'
import type { EtapeSymptome } from '../../../domaine/parcours.js'
import {
  DESCRIPTION_PARCOURS,
  LIBELLE_RUBRIQUE,
  progression,
  rendreAvertissementRelecture,
  rendreFilAriane,
  SOUS_TITRE_PARCOURS,
  TITRE_PARCOURS,
  type ContexteVue,
} from './commun.js'
import { rendreLiensSymptomes } from './symptomes.js'

/** Titre de l'onglet et des résultats de recherche (Kano D3, adapté par l'arbitrage 1). */
export const TITRE_DOCUMENT_ENTREE = 'Voyant, bruit, fuite : pré-diagnostic gratuit avant l’atelier'
const SEPARATEUR_TITRE = ' | '

/**
 * Le Kano veut la ville dans le titre (référencement local). Elle vient de
 * l'identité du garage quand le contexte la reçoit ; sinon la mise en page
 * commune ajoute seulement le nom du garage.
 */
function titreEntree(contact: CadrePage | null): string {
  if (contact === null) return TITRE_DOCUMENT_ENTREE
  const { nom, adresse } = contact.identite
  return `${TITRE_DOCUMENT_ENTREE}${SEPARATEUR_TITRE}${nom}, ${adresse.ville}`
}
const ID_INTITULE = 'pre-diagnostic-question'

/** Entrée du parcours : la première question, en liens directs. */
export function vueEntree(
  etape: EtapeSymptome,
  contexte: ContexteVue,
  indexable: boolean,
): VuePage {
  return {
    titre: titreEntree(contexte.contact),
    description: DESCRIPTION_PARCOURS,
    chemin: CHEMINS.preDiagnostic,
    rubrique: 'pre-diagnostic',
    indexable,
    contenu: html`<div class="entete-page">
  <div class="conteneur">
    ${rendreFilAriane(null)}
    <p class="surtitre">${LIBELLE_RUBRIQUE}</p>
    <h1>${TITRE_PARCOURS}</h1>
    <p class="texte-intro">${SOUS_TITRE_PARCOURS}</p>
  </div>
</div>
<div class="conteneur section pile pre-diagnostic">
  ${rendreAvertissementRelecture(contexte.aRelire)}
  <div class="plaque pre-diagnostic-plaque"><div class="plaque__filet">
    <section class="pile" aria-labelledby="${ID_INTITULE}">
      <p class="surtitre">${progression(etape.numero)}</p>
      <h2 class="pre-diagnostic-question" id="${ID_INTITULE}">${etape.intitule}</h2>
      ${rendreLiensSymptomes(etape, ID_INTITULE)}
    </section>
  </div></div>
  <p class="texte-note">Aucune inscription ni coordonnée n’est demandée pour voir le résultat.</p>
</div>`,
  }
}

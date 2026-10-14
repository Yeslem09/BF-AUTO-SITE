import { CHEMINS, PARAMETRES_DEMANDE, type TypeDemande } from '../../../../../contrats/index.js'
import { html, type CadrePage, type Html } from '../../../../../web/index.js'
import type { EtapeSymptome } from '../../../domaine/parcours.js'
import {
  LIBELLE_RAPPEL,
  LIBELLE_RUBRIQUE,
  MENTION_ATELIER,
  MENTION_GRATUITE,
  progression,
  TITRE_PARCOURS,
} from './commun.js'
import { rendreLiensSymptomes } from './symptomes.js'

const ID_TITRE = 'pre-diagnostic-bloc-titre'
const RAPPEL: TypeDemande = 'rappel'
const DEMANDE_RAPPEL = `${CHEMINS.demande}?${PARAMETRES_DEMANDE.type}=${RAPPEL}`

/** Surtitre du bloc : la rubrique et la progression, en ligne de cote. */
export function surtitreBloc(numero: number): string {
  const etape = progression(numero)
  return `${LIBELLE_RUBRIQUE}, ${etape.charAt(0).toLowerCase()}${etape.slice(1)}`
}

/** Mention permanente sous la question (Kano D3) : le diagnostic se fait à l'atelier. */
function rendreMentionBloc(): Html {
  return html`<p class="texte-note"><strong>${MENTION_GRATUITE}</strong> ${MENTION_ATELIER}</p>`
}

/**
 * Emplacement `pre-diagnostic` de l'accueil : la première question en sept
 * liens directs. Un geste suffit pour commencer, sans formulaire sur l'accueil.
 * La couche web pose la plaque autour : le bloc n'en remet pas.
 */
export function blocAccueilPreDiagnostic(etape: EtapeSymptome): Html {
  return html`<section class="pile pre-diagnostic-bloc" aria-labelledby="${ID_TITRE}">
  <p class="surtitre">${surtitreBloc(etape.numero)}</p>
  <h2 id="${ID_TITRE}">${etape.intitule}</h2>
  ${rendreLiensSymptomes(etape, ID_TITRE)}
  ${rendreMentionBloc()}
</section>`
}

/**
 * Emplacement `pre-diagnostic` tant que le parcours n'est pas publié (Kano D3,
 * relecture non datée) : le relais humain à la place des réponses. Garage
 * fermé : « Être rappelé » d'abord, numéro affiché ; sinon, l'appel.
 */
export function blocAccueilSansParcours(contact: CadrePage): Html {
  const { telephone } = contact.identite
  const action =
    contact.statut.etat === 'ferme'
      ? html`<ul class="liste-actions"><li><a class="bouton bouton--principal" href="${DEMANDE_RAPPEL}">${LIBELLE_RAPPEL}</a></li></ul>
  <p>Téléphone : <a href="${telephone.lien}">${telephone.affichable}</a></p>`
      : html`<ul class="liste-actions"><li><a class="bouton bouton--principal" href="${telephone.lien}">Appelez-nous au ${telephone.affichable}</a></li></ul>`
  return html`<section class="pile pre-diagnostic-bloc" aria-labelledby="${ID_TITRE}">
  <p class="surtitre">${LIBELLE_RUBRIQUE}</p>
  <h2 id="${ID_TITRE}">${TITRE_PARCOURS}</h2>
  <p>Décrivez-nous ce que vous remarquez : nous vous disons s’il faut s’arrêter et quand passer.</p>
  ${action}
</section>`
}

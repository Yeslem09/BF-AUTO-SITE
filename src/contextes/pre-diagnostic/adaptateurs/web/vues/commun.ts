import {
  CHEMINS,
  type NiveauUrgence,
  type ReferenceFamille,
  type ReponseLisible,
} from '../../../../../contrats/index.js'
import { html, type CadrePage, type Html } from '../../../../../web/index.js'
import type { ActionResultat } from '../../../domaine/arbre.js'
import { MAX_QUESTIONS_PAR_CHEMIN } from '../../../domaine/chemins.js'
import type { EtatParcours } from '../../../domaine/parcours.js'
import { adresseEtat, adresseRappel, CHEMIN_LIVRET, PARAMETRES_PARCOURS } from '../adresses.js'

/** Textes communs aux pages du parcours (arbitrage 1 du Kano : « Pré-diagnostic »). */
export const TITRE_PARCOURS = 'Un souci avec votre voiture ?'
export const SOUS_TITRE_PARCOURS = `Pré-diagnostic gratuit en ${MAX_QUESTIONS_PAR_CHEMIN} questions au plus. Le diagnostic se fait à l’atelier.`
export const DESCRIPTION_PARCOURS = `Un voyant, un bruit, une fuite ? En ${MAX_QUESTIONS_PAR_CHEMIN} questions au plus, sachez si vous pouvez rouler et ce que l’atelier vérifiera. Gratuit, sans inscription.`
/** Nom de la rubrique, dans la navigation et le fil d'Ariane (arbitrage 1 du Kano). */
export const LIBELLE_RUBRIQUE = 'Pré-diagnostic'
/** Mention permanente, en deux temps : ce qui est offert, puis ce qui ne l'est pas. */
export const MENTION_GRATUITE = 'Pré-diagnostic gratuit :'
export const MENTION_ATELIER = 'le diagnostic se fait à l’atelier.'
export const LIBELLE_RETOUR = 'Revenir à la question précédente'
export const LIBELLE_RECOMMENCER = 'Recommencer le pré-diagnostic'
export const LIBELLE_CE_QUE_VERIFIERA = 'Ce que l’atelier vérifiera :'
export const CLASSE_FICHE = 'pre-diagnostic-fiche'
/** Script du bouton d'impression, construit depuis `adaptateurs/web/client/imprimer.ts`. */
export const SCRIPT_IMPRESSION = '/js/pre-diagnostic/imprimer.js'
/** Script qui pose le focus sur la question de chaque étape, construit depuis `client/etape.ts`. */
export const SCRIPT_ETAPE = '/js/pre-diagnostic/etape.js'
/**
 * Marque l'élément qui reçoit le focus au chargement d'une étape (même valeur
 * que `ATTRIBUT_FOCUS` de `client/modules/focus.ts`, que le serveur n'importe
 * pas) ; l'élément porte aussi `tabindex="-1"`.
 */
export const ATTRIBUTS_FOCUS = 'tabindex="-1" data-pre-diagnostic-focus'

/** Ce que chaque vue du parcours reçoit en plus de son étape. */
export interface ContexteVue {
  readonly mention: string
  readonly actions: readonly ActionResultat[]
  /** Téléphone et statut du garage, s'ils sont fournis au contexte. */
  readonly contact: CadrePage | null
  /** Mode relecture avec un arbre pas encore relu : un avertissement l'annonce. */
  readonly aRelire: boolean
  /**
   * Familles des pistes du résultat, retrouvées dans le catalogue (libellé,
   * prix indicatif « dès 89,00 € TTC »). Absentes : les liens de demande de
   * prix s'affichent sans prix.
   */
  readonly familles?: ReadonlyMap<string, ReferenceFamille>
}

/** Espace insécable : un guillemet ne se retrouve jamais seul en bout de ligne. */
const ESPACE_INSECABLE = ' '

/** Texte cité entre guillemets français, lié à ses guillemets. */
export function citer(texte: string): string {
  return `«${ESPACE_INSECABLE}${texte}${ESPACE_INSECABLE}»`
}

const ESPACES = / /g

/** « 06 05 92 28 38 » d'un seul tenant : le numéro ne se coupe jamais en fin de ligne. */
export function insecable(texte: string): string {
  return texte.replace(ESPACES, ESPACE_INSECABLE)
}

/** Mot composé ou inversé (« entendez-vous », « pré-diagnostic ») : un seul tenant. */
const MOT_A_TRAIT_D_UNION = /([\p{L}\p{N}’']+(?:-[\p{L}\p{N}’']+)+)/u

/**
 * Titre sans coupure au trait d'union (J1, passe 2 du jury) : « Quand
 * entendez- / vous ce bruit ? » ne se voit plus, le mot composé passe entier
 * à la ligne.
 */
export function sansCoupureAuTrait(texte: string): Html {
  const morceaux = texte.split(MOT_A_TRAIT_D_UNION)
  return html`${morceaux.map((morceau, rang) =>
    rang % 2 === 1 ? html`<span class="pre-diagnostic-mot-lie">${morceau}</span>` : morceau,
  )}`
}

/**
 * Page de fiche : le bouton « Être rappelé » de la barre fixe du téléphone
 * emporte les réponses (champ `barreFixe` de `VuePage`, couche web), au lieu
 * d'ouvrir un formulaire vide qui obligerait à tout réexpliquer.
 */
export function barreFixeVersRappel(code: string): {
  readonly barreFixe: { readonly lienRappel: string }
} {
  return { barreFixe: { lienRappel: adresseRappel(code) } }
}

export function progression(numero: number): string {
  return `Question ${numero} sur ${MAX_QUESTIONS_PAR_CHEMIN} au plus`
}

/** Rappel permanent sous chaque étape : ce que l'on fait ici, et ce que l'on ne fait pas. */
export function rendreBandeauParcours(): Html {
  return html`<p class="texte-note pre-diagnostic-bandeau"><strong>${MENTION_GRATUITE}</strong> ${MENTION_ATELIER}</p>`
}

/** Libellé de l'étape courante dans le fil d'Ariane. */
export const ETAPE_RESULTAT = 'Résultat'

/**
 * Fil d'Ariane du système de design : l'accueil, le pré-diagnostic (lien qui
 * recommence le parcours), puis l'étape courante, sans lien vers elle-même.
 */
export function rendreFilAriane(etape: string | null): Html {
  const courant = (libelle: string) => html`<li><a aria-current="page">${libelle}</a></li>`
  return html`<nav class="fil-ariane" aria-label="Fil d’Ariane"><ol>
    <li><a href="${CHEMINS.accueil}">Accueil</a></li>
    ${etape === null ? courant(LIBELLE_RUBRIQUE) : html`<li><a href="${CHEMINS.preDiagnostic}">${LIBELLE_RUBRIQUE}</a></li>${courant(etape)}`}
  </ol></nav>`
}

export function rendreAvertissementRelecture(aRelire: boolean): Html | null {
  if (!aRelire) return null
  return html`<p class="message pre-diagnostic-a-relire" role="note">
  À relire avec le garagiste : ce pré-diagnostic n’est pas encore relu, il ne sera pas publié en
  production avant une relecture datée. <a href="${CHEMIN_LIVRET}">Ouvrir le livret de relecture</a>.
</p>`
}

/** Réponses déjà données, reportées dans le formulaire de l'étape suivante. */
export function rendreChampsCaches(etat: EtatParcours, codeEtape: string): Html {
  const champ = (nom: string, valeur: string) =>
    html`<input type="hidden" name="${nom}" value="${valeur}">`
  return html`${etat.symptome !== null && champ(PARAMETRES_PARCOURS.symptome, etat.symptome)}
    ${etat.signes.map((signe) => champ(PARAMETRES_PARCOURS.signes, signe))}
    ${etat.reponses.map((reponse) => champ(PARAMETRES_PARCOURS.reponse, reponse))}
    ${champ(PARAMETRES_PARCOURS.etape, codeEtape)}`
}

/** Liens de bas d'étape ; sur une fiche finale, « Recommencer » rejoint le retour. */
export function rendreNavigationParcours(retour: EtatParcours, recommencer = false): Html {
  return html`<p class="pre-diagnostic-navigation">
  <a class="pre-diagnostic-navigation__retour" href="${adresseEtat(retour)}">${LIBELLE_RETOUR}</a>
  ${recommencer && html`<a href="${CHEMINS.preDiagnostic}">${LIBELLE_RECOMMENCER}</a>`}
</p>`
}

export function rendreReponses(reponses: readonly ReponseLisible[]): Html {
  return html`<section class="pre-diagnostic-reponses" aria-labelledby="pre-diagnostic-titre-reponses">
  <h2 id="pre-diagnostic-titre-reponses">Vos réponses</h2>
  <dl class="liste-definitions">
    ${reponses.map((reponse) => html`<dt>${reponse.question}</dt><dd>${reponse.reponse}</dd>`)}
  </dl>
</section>`
}

export function rendreMention(mention: string): Html {
  return html`<p class="pre-diagnostic-mention">${mention}</p>`
}

export const LIBELLE_APPELER = 'Appeler le garage'
export const LIBELLE_RAPPEL = 'Être rappelé'
/** Garage fermé : le rappel se fera à l'ouverture (Kano US-18). */
export const LIBELLE_RAPPEL_FERME = 'Être rappelé à l’ouverture'

/**
 * Actions sous un arrêt ou un résultat. Garage fermé : « Être rappelé à
 * l'ouverture » passe en tête, avec la prochaine ouverture et le numéro
 * lisibles, sans pousser à appeler. Sans contact fourni au contexte, le numéro
 * reste celui de l'en-tête de page.
 */
export function rendreActions(
  actions: readonly ActionResultat[],
  contact: CadrePage | null,
  code: string,
  /** Actions propres à la page (rendez-vous du résultat), avant l'impression, qui reste la dernière. */
  supplements: readonly Html[] = [],
): Html {
  const ferme = contact?.statut.etat === 'ferme'
  const appel = contact !== null && !ferme && actions.includes('appeler')
  const boutons = actions.flatMap((action): Html[] => {
    switch (action) {
      case 'appeler':
        return appel && contact !== null
          ? [
              html`<li><a class="bouton bouton--principal" href="${contact.identite.telephone.lien}">${LIBELLE_APPELER} au ${contact.identite.telephone.affichable}</a></li>`,
            ]
          : []
      case 'rappel':
        return [
          html`<li><a class="bouton ${appel ? 'bouton--secondaire' : 'bouton--principal'}" href="${adresseRappel(code)}">${ferme ? LIBELLE_RAPPEL_FERME : LIBELLE_RAPPEL}</a></li>`,
        ]
      case 'imprimer':
        return [...supplements, html`<li>${rendreBoutonImprimer('Imprimer la fiche')}</li>`]
    }
  })
  const imprimer = actions.includes('imprimer')
  return html`<ul class="liste-actions pre-diagnostic-actions">${boutons}${!imprimer && supplements}</ul>
${
  ferme &&
  contact !== null &&
  html`<p class="pre-diagnostic-ferme">${contact.statut.libelle}. Numéro du garage : <a href="${contact.identite.telephone.lien}">${insecable(contact.identite.telephone.affichable)}</a>.</p>`
}`
}

export const TITRE_CONSIGNES = 'Que faire, dans cet ordre'

/**
 * Consignes d'un conducteur qui ne doit pas rouler, dans l'ordre du Kano :
 * sécurité, assistance, garage. Des étapes numérotées, sans rang de gravité.
 */
export function rendreConsignesArret(
  actions: readonly ActionResultat[],
  contact: CadrePage | null,
  code: string,
): Html {
  return html`<section class="pre-diagnostic-consignes" aria-labelledby="pre-diagnostic-titre-consignes">
  <h2 id="pre-diagnostic-titre-consignes">${TITRE_CONSIGNES}</h2>
  <ol class="pre-diagnostic-consignes__liste">
  <li class="carte pre-diagnostic-consigne">
    <h3 class="titre-carte">Mettez-vous en sécurité</h3>
    <p>Allumez les feux de détresse, enfilez le gilet et faites sortir les passagers du côté opposé à la circulation.</p>
    <p class="pre-diagnostic-consigne__urgence">En cas de danger immédiat, appelez le <a href="tel:112">112</a>.</p>
  </li>
  <li class="carte pre-diagnostic-consigne">
    <h3 class="titre-carte">Appelez l’assistance de votre assureur</h3>
    <p>Le numéro figure sur votre attestation d’assurance ou dans l’application de votre assureur. Selon votre contrat, l’assistance organise le dépannage ou le remorquage de la voiture.</p>
  </li>
  <li class="carte pre-diagnostic-consigne">
    <h3 class="titre-carte">Prévenez le garage</h3>
    <p>En demandant à être rappelé, vous transmettez vos réponses : le garagiste saura de quoi il s’agit.</p>
    ${rendreActions(
      actions.filter((action) => action !== 'imprimer'),
      contact,
      code,
    )}
  </li>
  </ol>
</section>`
}

export function classeNiveau(niveau: NiveauUrgence): string {
  return `pre-diagnostic-conduite--${niveau}`
}

/** Bouton d'impression : caché sans JavaScript (le menu du navigateur imprime aussi la fiche). */
export function rendreBoutonImprimer(libelle: string): Html {
  return html`<button class="bouton bouton--secondaire pre-diagnostic-imprimer" type="button" data-pre-diagnostic-imprimer hidden>${libelle}</button>`
}

/** Impression de la fiche, si l'arbre la propose parmi les actions. */
export function rendreImpression(actions: readonly ActionResultat[]): Html | null {
  return actions.includes('imprimer')
    ? html`<p class="pre-diagnostic-impression">${rendreBoutonImprimer('Imprimer la fiche')}</p>`
    : null
}

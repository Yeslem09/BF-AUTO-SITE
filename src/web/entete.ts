import type { IdentiteGaragePublique, StatutOuverture } from '../contrats/index.js'
import { CHEMINS } from '../contrats/index.js'
import { html, type Html } from './html.js'
import { INTENTIONS } from './intentions.js'
import { lienItineraire } from './itineraire.js'
import { LOGO_AVEC_CHAT, LOGO_SANS_CHAT } from './logo.js'
import { appelPousse, type Rubrique } from './page.js'
import { rendrePastilleStatut } from './statut.js'

export interface EntreeNavigation {
  readonly rubrique: Rubrique
  readonly libelle: string
  readonly chemin: string
}

/**
 * Cinq entrées au plus ; l'accueil est atteint par le logo, « Vos droits » par
 * le pied de page. Les pièces détachées d'abord : le garage les vend au comptoir
 * (décision d'Anthony du 2026-09-23).
 */
export const NAVIGATION: readonly EntreeNavigation[] = [
  { rubrique: 'catalogue', libelle: 'Pièces détachées', chemin: CHEMINS.catalogue },
  { rubrique: 'pre-diagnostic', libelle: 'Pré-diagnostic', chemin: CHEMINS.preDiagnostic },
  { rubrique: 'rendez-vous', libelle: 'Rendez-vous', chemin: INTENTIONS.rendezVous.chemin },
  { rubrique: 'tarifs', libelle: 'Tarifs', chemin: CHEMINS.tarifs },
  // Les horaires se cherchent sous leur nom (jury, passe 1) : « Accès » seul les cachait.
  { rubrique: 'acces', libelle: 'Accès et horaires', chemin: CHEMINS.acces },
]

/** Même intitulé pour les deux navigations : une seule est exposée à la fois (bureau ou menu). */
const NOM_NAVIGATION = 'Navigation principale'

/** Entrées à montrer : sans pré-diagnostic publié, son lien mènerait à une page absente. */
export function navigationPubliee(preDiagnosticPublie: boolean): readonly EntreeNavigation[] {
  return preDiagnosticPublie
    ? NAVIGATION
    : NAVIGATION.filter((entree) => entree.rubrique !== 'pre-diagnostic')
}

function liensNavigation(
  classe: string,
  rubrique: Rubrique | undefined,
  entrees: readonly EntreeNavigation[],
): Html[] {
  return entrees.map((entree) => {
    const courant = entree.rubrique === rubrique && html` aria-current="page"`
    return html`<li><a class="${classe}" href="${entree.chemin}"${courant}>${entree.libelle}</a></li>`
  })
}

/** Bouton d'appel orange de l'en-tête : le verbe (dès 1200 px), puis le numéro en chiffres. */
function rendreBoutonAppel(identite: IdentiteGaragePublique): Html {
  const { telephone } = identite
  return html`<a class="bouton-appel" href="${telephone.lien}"><span class="bouton-appel__verbe">Appeler</span> <span class="bouton-appel__numero">${telephone.affichable}</span></a>`
}

export interface OptionsEntete {
  /** Faux : aucun lien vers `/pre-diagnostic` (page absente). Vrai par défaut. */
  readonly preDiagnosticPublie?: boolean
  /** Bandeau de mode (démonstration, relecture), posé en tête dans le repère. */
  readonly bandeau?: Html | null
}

/**
 * En-tête commun (bande de marque) : bandeau de mode s'il y en a un, logo,
 * navigation (bureau) ou menu `<details>` (téléphone, tablette), bouton
 * d'appel avec le numéro en chiffres (sauf hors plan public : espace
 * garagiste), puis la ligne de statut : ouvert ou non, et où.
 */
export function rendreEntete(
  identite: IdentiteGaragePublique,
  statut: StatutOuverture,
  rubrique: Rubrique | undefined,
  options: OptionsEntete = {},
): Html {
  const { adresse } = identite
  const entrees = navigationPubliee(options.preDiagnosticPublie ?? true)
  return html`<header class="entete">${options.bandeau ?? null}
  <div class="conteneur entete__rangee">
    <a class="entete__logo" href="${CHEMINS.accueil}">${LOGO_AVEC_CHAT}${LOGO_SANS_CHAT}<span class="visuellement-masque">${identite.nom}, retour à l’accueil</span></a>
    <nav class="navigation" aria-label="${NOM_NAVIGATION}">
      <ul class="navigation__liste">${liensNavigation('navigation__lien', rubrique, entrees)}</ul>
    </nav>
    <div class="entete__actions">
      ${appelPousse(rubrique) && rendreBoutonAppel(identite)}
      <details class="menu">
        <summary class="menu__bouton"><span class="menu__ouvrir">Menu</span><span class="menu__fermer">Fermer<span class="visuellement-masque"> le menu</span></span></summary>
        <nav class="menu__panneau" aria-label="${NOM_NAVIGATION}">
          <ul class="menu__liste">${liensNavigation('menu__lien', rubrique, entrees)}</ul>
        </nav>
      </details>
    </div>
  </div>
  <div class="entete__statut">
    <div class="conteneur entete__statut-ligne">
      ${rendrePastilleStatut(statut)}
      <span class="entete__adresse">${adresse.voie}<span class="entete__ville">, ${adresse.codePostal} ${adresse.ville}</span></span>
      <a class="entete__itineraire" href="${lienItineraire(adresse)}">Itinéraire</a>
    </div>
  </div>
</header>`
}

import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type VuePage } from '../../../../../web/index.js'
import type { CataloguePublie } from '../../../domaine/publication.js'
import {
  cheminDemande,
  LIBELLE_DEMANDER_PRIX,
  LIBELLE_TOUTES_LES_FAMILLES,
  rendreGrilleFamilles,
  rendreRecherche,
} from './commun.js'

const STATUT_INTROUVABLE = 404
const ID_RECHERCHE = 'recherche-pieces-introuvable'

/**
 * Famille inconnue ou pas encore publiée : une page 404 qui propose la
 * recherche, les familles publiées et la demande de prix. L'adresse demandée
 * n'est jamais reprise dans la page (piège 40 : un lien forgé ne fait pas
 * parler le site).
 */
export function vueFamilleIntrouvable(catalogue: CataloguePublie): VuePage {
  const { familles } = catalogue
  return {
    titre: 'Famille introuvable',
    description: 'Cette adresse ne correspond à aucune famille de pièces du garage.',
    chemin: CHEMINS.catalogue,
    rubrique: 'catalogue',
    statutHttp: STATUT_INTROUVABLE,
    indexable: false,
    contenu: html`<div class="conteneur section pile">
  <p class="surtitre">Erreur 404</p>
  <h1>Famille introuvable</h1>
  <p class="texte-intro">
    Aucune famille de pièces ne correspond à cette adresse.
    ${familles.length > 0 ? 'Cherchez votre pièce par mot, choisissez sa famille dans la liste, ou décrivez-la dans une demande de prix.' : 'Décrivez votre besoin dans une demande de prix : le garage vous répond.'}
  </p>
  ${familles.length > 0 && html`<div class="catalogue-recherche">${rendreRecherche(ID_RECHERCHE)}</div>`}
  <ul class="liste-actions">
    <li><a class="bouton bouton--principal" href="${cheminDemande('devis')}">${LIBELLE_DEMANDER_PRIX}</a></li>
    <li><a class="bouton bouton--secondaire" href="${CHEMINS.catalogue}">${LIBELLE_TOUTES_LES_FAMILLES}</a></li>
  </ul>
  ${
    familles.length > 0 &&
    html`<section class="pile-serree" aria-labelledby="catalogue-titre-introuvable">
    <h2 id="catalogue-titre-introuvable" class="titre-carte">Les familles de pièces</h2>
    ${rendreGrilleFamilles(familles)}
  </section>`
  }
</div>`,
  }
}

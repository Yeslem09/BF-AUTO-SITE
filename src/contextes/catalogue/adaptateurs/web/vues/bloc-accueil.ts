import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html } from '../../../../../web/index.js'
import type { CataloguePublie, MentionPubliee } from '../../../domaine/publication.js'
import {
  cheminDemande,
  LIBELLE_DEMANDER_PRIX,
  LIBELLE_TOUTES_LES_FAMILLES,
  pastilleARelire,
  rendreGrilleFamilles,
  rendrePuceFamille,
  rendreRecherche,
  TITRE_LISTE,
} from './commun.js'

/** Surtitre de la grille de l'accueil : le « Catalogue » de la maquette, pièces et réparations réunies (arbitrage 2). */
export const SURTITRE_GRILLE_ACCUEIL = 'Pièces détachées et réparations'
/**
 * Familles principales en puces dans la bande d'ouverture, au bureau : de
 * quoi descendre la colonne des pièces jusqu'au pied de la plaque du
 * pré-diagnostic, à sa droite (retour d'Anthony, correction 2).
 */
export const PUCES_DANS_LA_BANDE = 12
/**
 * Sur téléphone (sous 768 px), les six premières seulement : le premier écran
 * reste court. Les autres portent `CLASSE_PUCE_BUREAU`, masquée par la feuille
 * du catalogue ; « Toutes les familles » mène aux autres.
 */
export const PUCES_SUR_TELEPHONE = 6
export const CLASSE_PUCE_BUREAU = 'catalogue-bande__puce-bureau'
const ID_RECHERCHE_ACCUEIL = 'recherche-pieces-accueil'

/**
 * Emplacement `recherche-pieces` : moitié gauche de la bande sombre de
 * l'accueil. Titre, ce que le garage fait des pièces, recherche par mot,
 * familles principales avec leur petit dessin, lien vers toutes les familles.
 * La couche web ajoute dessous les raccourcis Rendez-vous et Tarifs.
 */
export function blocRecherchePieces(catalogue: CataloguePublie): Html {
  const { familles } = catalogue
  const principales = familles.slice(0, PUCES_DANS_LA_BANDE)
  return html`<section class="pile catalogue-bande" aria-labelledby="titre-recherche-pieces">
  <h2 id="titre-recherche-pieces" class="catalogue-bande__titre">${TITRE_LISTE}</h2>
  ${
    principales.length > 0
      ? html`${rendreOffre(catalogue)}
  ${rendreRecherche(ID_RECHERCHE_ACCUEIL)}
  <ul class="puces-familles" aria-label="Familles principales">${principales.map((famille, rang) =>
    rendrePuceFamille(famille, rang < PUCES_SUR_TELEPHONE ? null : CLASSE_PUCE_BUREAU),
  )}</ul>
  <p class="catalogue-bande__toutes"><a href="${CHEMINS.catalogue}">${LIBELLE_TOUTES_LES_FAMILLES} (${familles.length})</a></p>`
      : html`<p>Décrivez la pièce qu’il vous faut : le garage la cherche pour votre véhicule et vous répond par un prix.</p>
  <ul class="liste-actions"><li><a class="bouton bouton--principal" href="${cheminDemande('devis')}">${LIBELLE_DEMANDER_PRIX}</a></li></ul>`
  }
</section>`
}

/**
 * Ce que le garage fait des pièces, en une ligne sous le titre : « Vente au
 * comptoir ou pose à l’atelier, pièce vérifiée avant commande. ». Chaque
 * membre ne s'écrit que s'il est publié (la vente au comptoir, l'engagement de
 * la pièce vérifiée) : jamais une offre ni un engagement non confirmés. En
 * relecture, un membre encore à valider porte sa pastille.
 */
function rendreOffre({ venteAuComptoir, engagementPiecePosee }: CataloguePublie): Html {
  const offre =
    venteAuComptoir === null
      ? html`Pose à l’atelier`
      : html`Vente au comptoir ou pose à l’atelier${marqueARelire(venteAuComptoir)}`
  const engagement =
    engagementPiecePosee === null
      ? null
      : html`, pièce vérifiée avant commande${marqueARelire(engagementPiecePosee)}`
  return html`<p class="catalogue-bande__offre">${offre}${engagement}.</p>`
}

function marqueARelire(mention: MentionPubliee): Html | null {
  return mention.aRelire ? html` ${pastilleARelire()}` : null
}

/**
 * Emplacement `catalogue` : pleine largeur, juste sous la bande. Toutes les
 * familles en cartes, chacune avec sa figure technique, son nom et ses mots
 * courants.
 */
export function blocCatalogue(catalogue: CataloguePublie): Html {
  const { familles } = catalogue
  return html`<section class="pile" aria-labelledby="titre-catalogue-bloc">
  <p class="surtitre">${SURTITRE_GRILLE_ACCUEIL}</p>
  <h2 id="titre-catalogue-bloc">${LIBELLE_TOUTES_LES_FAMILLES}</h2>
  ${
    familles.length > 0
      ? rendreGrilleFamilles(familles)
      : html`<p>La liste des pièces et réparations est en cours de confirmation avec le garage. En attendant, décrivez votre besoin : le garage vous répond par un prix.</p>
  <ul class="liste-actions"><li><a class="bouton bouton--principal" href="${cheminDemande('devis')}">${LIBELLE_DEMANDER_PRIX}</a></li></ul>`
  }
</section>`
}

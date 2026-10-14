import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import type { CatalogueRecherche } from '../../../application/rechercher-pieces.js'
import { LIBELLE_PRIX_SUR_DEVIS } from '../../../domaine/prix.js'
import {
  prixMisEnAvant,
  type CataloguePublie,
  type FamillePubliee,
  type MentionPubliee,
} from '../../../domaine/publication.js'
import type { ResultatRecherche } from '../../../domaine/recherche.js'
import {
  aideDeLaCarte,
  ANCRE_RECHERCHE,
  cheminDemande,
  cheminDemandeForfait,
  cheminFamille,
  dessinDeLaFamille,
  LIBELLE_DEMANDER_PRIX,
  LIBELLE_TOUTES_LES_FAMILLES,
  orienterLeDoute,
  pastilleARelire,
  rendreFilAriane,
  rendreGrilleFamilles,
  rendreRecherche,
  TITRE_LISTE,
  type RenvoiDoute,
} from './commun.js'
import { resumerPourDescription } from './description.js'

export { TITRE_LISTE } from './commun.js'
export const TITRE_EXCLUSIONS = 'Ce que nous ne faisons pas'
export const TITRE_RETRAIT_OU_POSE = 'Retrait au garage ou pose à l’atelier'
export const TITRE_RESULTATS = 'Résultat de votre recherche'
export const TITRE_AUCUN_RESULTAT = 'Aucune famille ne correspond à votre recherche'
/** Titre de l'encart qui propose le pré-diagnostic quand la recherche décrit un symptôme. */
export const TITRE_SYMPTOME = 'Un bruit, un voyant, une fuite ?'
/** Familles citées dans la description de la page, pour les moteurs de recherche. */
const FAMILLES_DANS_LA_DESCRIPTION = 4
/** Familles proposées en exemples de mots quand une recherche ne trouve rien. */
const FAMILLES_EN_EXEMPLE = 3
const ID_RECHERCHE = 'recherche-pieces'

/**
 * `/pieces-et-reparations` : la recherche par mot, toutes les familles en
 * cartes avec leur figure, le retrait ou la pose, et ce que le garage ne fait
 * pas. Avec `?q=`, les familles trouvées s'affichent sous le champ ; si rien
 * n'est trouvé, la page propose une issue (demander un prix, appeler). La
 * requête n'est reprise que dans le champ, jamais dans le texte de la page
 * (piège 40 : un lien forgé ne fait pas parler le site).
 */
export function vueListeFamilles(
  { catalogue, requete, resultat }: CatalogueRecherche,
  ville: string,
  renvoi: RenvoiDoute,
): VuePage {
  const { familles } = catalogue
  const exemples = familles
    .slice(0, FAMILLES_DANS_LA_DESCRIPTION)
    .map((famille) => famille.libelle.toLocaleLowerCase('fr'))
  const offre =
    catalogue.venteAuComptoir === null
      ? 'Pose à l’atelier'
      : 'Retrait au garage ou pose à l’atelier'
  const description =
    exemples.length > 0
      ? `${TITRE_LISTE} et réparations à ${ville} : ${exemples.join(', ')}. ${offre}, prix, demande de prix ou de rendez-vous.`
      : `${TITRE_LISTE} et réparations à ${ville} : demandez un prix au garage.`
  return {
    titre: `${TITRE_LISTE} à ${ville}`,
    description: resumerPourDescription(description),
    chemin: CHEMINS.catalogue,
    rubrique: 'catalogue',
    // Une page de résultats n'a rien à faire dans un moteur de recherche.
    indexable: resultat === null,
    contenu: html`<div class="entete-page catalogue-entete">
  <div class="conteneur">
    ${rendreFilAriane([{ libelle: TITRE_LISTE, chemin: CHEMINS.catalogue }])}
    <p class="surtitre">Catalogue</p>
    <h1>${TITRE_LISTE}</h1>
    <p class="texte-intro">${introduction(catalogue)} Cherchez par mot, ou choisissez une famille.</p>
  </div>
</div>
<div class="conteneur section pile catalogue-liste">
  ${familles.length > 0 ? rendreRechercheEtResultats(catalogue, requete, resultat, renvoi) : rendreListeVide()}
  ${familles.length > 0 && rendreToutesLesFamilles(catalogue)}
  ${rendreEncarts(catalogue)}
  <ul class="catalogue-renvois">
    <li>Tous les prix au même endroit : <a href="${CHEMINS.tarifs}">les tarifs</a>.</li>
    <li>${orienterLeDoute(renvoi, 'Vous ne savez pas ce qui cloche ?', ', en 5 questions au plus.')}</li>
  </ul>
</div>`,
  }
}

/** Ce que le client obtient, selon ce qui est publié : jamais une offre ni un engagement non confirmés. */
function introduction({ venteAuComptoir, engagementPiecePosee }: CataloguePublie): string {
  if (venteAuComptoir !== null) {
    return 'Vendues au comptoir ou posées à l’atelier, et vérifiées pour votre véhicule avant la commande.'
  }
  if (engagementPiecePosee !== null) {
    return 'Posées à l’atelier, et vérifiées pour votre véhicule avant la commande.'
  }
  return 'Chaque famille réunit la pièce et sa pose.'
}

function rendreRechercheEtResultats(
  catalogue: CataloguePublie,
  requete: string,
  resultat: ResultatRecherche | null,
  renvoi: RenvoiDoute,
): Html {
  return html`<section class="pile catalogue-recherche" id="${ANCRE_RECHERCHE}" aria-label="Chercher une pièce">
    ${rendreRecherche(ID_RECHERCHE, requete)}
    ${resultat !== null && resultat.symptome && rendreSymptome(renvoi)}
    ${resultat !== null && (resultat.familles.length > 0 ? rendreTrouvees(resultat) : rendreRienTrouve(catalogue, renvoi))}
  </section>`
}

function rendreTrouvees(resultat: ResultatRecherche): Html {
  const nombre = resultat.familles.length
  return html`<div class="pile-serree catalogue-resultats">
      <h2 class="titre-carte">${TITRE_RESULTATS}</h2>
      <p>${nombre === 1 ? 'Une famille correspond' : `${nombre} familles correspondent`} à votre recherche.</p>
      <ul class="catalogue-resultats__liste">${resultat.familles.map(({ famille, motCourant }) => rendreResultat(famille, motCourant))}</ul>
    </div>`
}

/**
 * Une famille trouvée (J2 : la recherche mène au prix) : son dessin, son nom
 * vers sa page, le prix mis en avant (« Plaquettes avant posées : dès 89,00
 * € TTC », ou « Prix sur devis ») et la demande de prix, déjà préremplie.
 */
function rendreResultat(famille: FamillePubliee, motCourant: string | null): Html {
  const forfait = prixMisEnAvant(famille)
  const annonce = forfait !== null && forfait.prix.estPublie ? forfait : null
  return html`<li class="carte catalogue-resultat">
        <span class="carte-famille__planche catalogue-resultat__planche">${dessinDeLaFamille(famille.identifiant, 'carte-famille__dessin')}</span>
        <div class="pile-serree catalogue-resultat__texte">
          <h3 class="catalogue-resultat__nom"><a href="${cheminFamille(famille.identifiant)}">${famille.libelle}</a>${famille.aRelire && html` ${pastilleARelire()}`}</h3>
          <p class="catalogue-resultat__aide">${aideDeLaCarte(famille, motCourant)}</p>
          <p class="catalogue-resultat__prix">${annonce === null ? LIBELLE_PRIX_SUR_DEVIS : `${annonce.intitule} : ${annonce.prix.indicatif}`}</p>
          <p><a class="bouton bouton--principal" href="${annonce === null ? cheminDemande('devis', famille.identifiant) : cheminDemandeForfait(famille, annonce)}">${LIBELLE_DEMANDER_PRIX}</a></p>
        </div>
      </li>`
}

/**
 * La requête décrit un symptôme (« freins qui grincent », « voyant moteur ») :
 * avant les familles, le pré-diagnostic, qui dit s'il faut agir vite ; s'il
 * n'est pas publié, l'appel au garage (Kano D3).
 */
function rendreSymptome(renvoi: RenvoiDoute): Html {
  const { telephone } = renvoi
  return html`<div class="carte pile-serree catalogue-symptome">
      <h2 class="titre-carte">${TITRE_SYMPTOME}</h2>
      ${
        renvoi.preDiagnosticPublie
          ? html`<p>Le pré-diagnostic vous dit en 5 questions au plus s’il faut agir vite, et ce que l’atelier vérifiera.</p>
      <p><a class="bouton bouton--principal" href="${CHEMINS.preDiagnostic}">Faire le pré-diagnostic</a></p>`
          : html`<p>Décrivez-le au garage : il vous dit s’il faut agir vite.</p>
      <p><a class="bouton bouton--principal" href="${telephone.lien}">Appeler le ${telephone.affichable}</a></p>`
      }
    </div>`
}

/** Rien trouvé : des mots à essayer, la demande de prix et l'appel, puis toutes les familles dessous. */
function rendreRienTrouve(catalogue: CataloguePublie, renvoi: RenvoiDoute): Html {
  const exemples = catalogue.familles
    .slice(0, FAMILLES_EN_EXEMPLE)
    .map((famille) => famille.libelle.toLocaleLowerCase('fr'))
  const { telephone } = renvoi
  return html`<div class="carte pile-serree catalogue-resultats catalogue-resultats--vide">
      <h2 class="titre-carte">${TITRE_AUCUN_RESULTAT}</h2>
      <p>Essayez un mot plus simple, comme ${joindreEnPhrase(exemples)}, ou choisissez une famille ci-dessous.</p>
      <p>Vous ne trouvez pas votre pièce ? Décrivez-la dans une demande de prix : le garagiste la cherche pour votre véhicule.</p>
      <ul class="liste-actions">
        <li><a class="bouton bouton--principal" href="${cheminDemande('devis')}">${LIBELLE_DEMANDER_PRIX}</a></li>
        <li><a class="bouton bouton--secondaire" href="${telephone.lien}">Appeler le ${telephone.affichable}</a></li>
      </ul>
    </div>`
}

/** « freinage, batterie ou pneus ». */
function joindreEnPhrase(mots: readonly string[]): string {
  if (mots.length <= 1) return mots.join('')
  return `${mots.slice(0, -1).join(', ')} ou ${mots.at(-1) ?? ''}`
}

function rendreToutesLesFamilles(catalogue: CataloguePublie): Html {
  return html`<section class="pile-serree" aria-labelledby="catalogue-titre-familles">
    <h2 id="catalogue-titre-familles">${LIBELLE_TOUTES_LES_FAMILLES}</h2>
    ${rendreGrilleFamilles(catalogue.familles)}
  </section>`
}

/** État vide qui dit sa cause et quoi faire (piège 4) : rien n'est encore confirmé par le garage. */
function rendreListeVide(): Html {
  return html`<p class="texte-intro">La liste des pièces et réparations est en cours de confirmation avec le garage. En attendant, décrivez votre besoin : le garage vous répond par un prix.</p>
  <ul class="liste-actions">
    <li><a class="bouton bouton--principal" href="${cheminDemande('devis')}">${LIBELLE_DEMANDER_PRIX}</a></li>
  </ul>`
}

/** Retrait ou pose et « Ce que nous ne faisons pas », côte à côte au bureau ; chacun masqué s'il n'est pas publié. */
function rendreEncarts(catalogue: CataloguePublie): Html | null {
  const retrait = rendreRetraitOuPose(catalogue)
  const exclusions = rendreExclusions(catalogue.ceQueNousNeFaisonsPas)
  if (retrait === null && exclusions === null) return null
  return html`<div class="grille-cartes catalogue-encarts">${retrait}${exclusions}</div>`
}

function rendreRetraitOuPose(catalogue: CataloguePublie): Html | null {
  const { venteAuComptoir, engagementPiecePosee } = catalogue
  if (venteAuComptoir === null && engagementPiecePosee === null) return null
  return html`<section class="carte pile-serree" aria-labelledby="catalogue-titre-retrait">
    <h2 id="catalogue-titre-retrait" class="titre-carte">${venteAuComptoir === null ? 'La pièce vérifiée et posée' : TITRE_RETRAIT_OU_POSE}</h2>
    ${venteAuComptoir !== null && rendreMention(venteAuComptoir)}
    ${engagementPiecePosee !== null && rendreMention(engagementPiecePosee)}
  </section>`
}

function rendreMention(mention: MentionPubliee): Html {
  return html`<p>${mention.texte}${mention.aRelire && html` ${pastilleARelire()}`}</p>`
}

/** Bloc masqué tant que rien n'est exclu, ou rien de confirmé en production (D8 : repli par masquage). */
function rendreExclusions(exclusions: readonly MentionPubliee[]): Html | null {
  if (exclusions.length === 0) return null
  return html`<section class="carte pile-serree" aria-labelledby="catalogue-titre-exclusions">
    <h2 id="catalogue-titre-exclusions" class="titre-carte">${TITRE_EXCLUSIONS}</h2>
    <ul class="catalogue-exclusions">
      ${exclusions.map((exclusion) => html`<li>${exclusion.texte}${exclusion.aRelire && html` ${pastilleARelire()}`}</li>`)}
    </ul>
    <p>Un doute sur votre véhicule ? <a href="${cheminDemande('devis')}">Posez la question dans une demande de prix</a>.</p>
  </section>`
}

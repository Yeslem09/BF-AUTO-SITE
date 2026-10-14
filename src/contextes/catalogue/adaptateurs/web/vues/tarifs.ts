import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html, type VuePage } from '../../../../../web/index.js'
import { LIBELLE_A_PARTIR_DE } from '../../../domaine/prix.js'
import {
  LIBELLES_TARIFS,
  type CataloguePublie,
  type FamillePubliee,
  type PrixPublie,
} from '../../../domaine/publication.js'
import {
  cheminDemande,
  cheminDemandeForfait,
  cheminFamille,
  LIBELLE_DEMANDER_PRIX,
  LIBELLE_TOUTES_LES_FAMILLES,
  noteARelire,
  noteProposition,
  pastilleARelire,
  PHRASE_PRIX_EXACT,
  rendreFilAriane,
} from './commun.js'
import { resumerPourDescription } from './description.js'

export const TITRE_TARIFS = 'Tarifs'
export const TITRE_PRESTATIONS = 'Prestations courantes'
export const TITRE_TRANSVERSES = 'Main-d’œuvre et premier contrôle'
/** Le taux horaire est un prix fixe : « 60,00 € TTC de l’heure ». */
export const SUFFIXE_TAUX_HORAIRE = 'de l’heure'
export const TITRE_SUR_DEVIS = 'Les autres interventions, sur devis'
/**
 * Sous les familles sans forfait : ce que « sur devis » veut dire pour le
 * client, vrai quelle que soit la raison (forfait pas encore fixé, ou prix
 * trop variable pour être annoncé). Le site ne prête pas de motif au garage.
 */
export const EXPLICATION_PRIX_SUR_DEVIS =
  'Aucun forfait n’est annoncé pour ces interventions : le garage les chiffre pour votre véhicule, avant tout travail.'

/**
 * `/tarifs` : récapitulatif calculé depuis le catalogue (composant
 * `tableau-tarifs`). La main-d'œuvre et le premier contrôle (ce qu'il
 * comprend, sa durée, s'il est déduit de la réparation), puis les
 * prestations courantes chiffrées, chacune reliée à sa famille, puis les
 * familles sur devis en une phrase plutôt qu'en lignes identiques. Montant et
 * précisions sont ceux du `PrixPublie` que la page de chaque famille affiche
 * aussi : un prix n'existe qu'une fois, dans le fichier du catalogue.
 */
export function vueTarifs(catalogue: CataloguePublie, ville: string): VuePage {
  const transverses: readonly LigneTarif[] = [
    {
      intitule: html`${LIBELLES_TARIFS.tauxHoraire}`,
      prix: catalogue.tauxHoraire,
      suffixe: catalogue.tauxHoraire.estPublie ? SUFFIXE_TAUX_HORAIRE : null,
    },
    { intitule: html`${LIBELLES_TARIFS.premierControle}`, prix: catalogue.premierControle },
  ]
  const forfaits: readonly LigneTarif[] = catalogue.familles.flatMap((famille) =>
    famille.forfaits
      .filter((forfait) => forfait.prix.estPublie)
      .map((forfait) => ({
        intitule: html`<a class="catalogue-tarifs__famille" href="${cheminFamille(famille.identifiant)}">${forfait.intitule}</a>${famille.aRelire && html` ${pastilleARelire()}`}`,
        prix: forfait.prix,
        id: `forfait-${forfait.identifiant}`,
        demande: cheminDemandeForfait(famille, forfait),
      })),
  )
  const surDevis = catalogue.familles.filter((famille) =>
    famille.forfaits.every((forfait) => !forfait.prix.estPublie),
  )
  const tousLesPrix = [...transverses, ...forfaits].map(({ prix }) => prix)
  return {
    titre: `${TITRE_TARIFS} du garage à ${ville}`,
    description: resumerPourDescription(
      `Tarifs TTC du garage à ${ville} : taux horaire, premier contrôle, révision, vidange, freinage et autres prestations courantes. ${PHRASE_PRIX_EXACT}`,
    ),
    chemin: CHEMINS.tarifs,
    rubrique: 'tarifs',
    contenu: html`<div class="entete-page catalogue-entete">
  <div class="conteneur">
    ${rendreFilAriane([{ libelle: TITRE_TARIFS, chemin: CHEMINS.tarifs }])}
    <p class="surtitre">Nos prix</p>
    <h1>${TITRE_TARIFS}</h1>
    <p class="texte-intro">Tous nos prix sont TTC. ${PHRASE_PRIX_EXACT}</p>
  </div>
</div>
<div class="conteneur section catalogue-tarifs">
  ${noteProposition(tousLesPrix)}
  <section class="panneau pile-serree catalogue-tarifs__transverses" aria-labelledby="catalogue-titre-transverses">
    <h2 id="catalogue-titre-transverses" class="titre-carte">${TITRE_TRANSVERSES}</h2>
    ${rendreTableau(transverses)}
    ${
      transverses.some(({ prix }) => !prix.estPublie) &&
      html`<p class="texte-note">« Sur demande » : le garage vous donne ce prix au téléphone ou dans votre devis, avant tout travail.</p>`
    }
  </section>
  <section class="panneau pile-serree catalogue-tarifs__forfaits" aria-labelledby="catalogue-titre-forfaits">
    <h2 id="catalogue-titre-forfaits" class="titre-carte">${TITRE_PRESTATIONS}</h2>
    ${forfaits.length > 0 ? rendreTableau(forfaits) : rendreForfaitsVides()}
  </section>
  ${surDevis.length > 0 && rendreSurDevis(surDevis)}
  <ul class="liste-actions catalogue-tarifs__actions">
    <li><a class="bouton bouton--principal" href="${cheminDemande('devis')}">${LIBELLE_DEMANDER_PRIX}</a></li>
    <li><a class="bouton bouton--secondaire" href="${CHEMINS.catalogue}">${LIBELLE_TOUTES_LES_FAMILLES}</a></li>
  </ul>
</div>`,
  }
}

/** Une ligne de tarif : intitulé, prix, et la demande de prix déjà préremplie s'il y en a une. */
interface LigneTarif {
  readonly intitule: Html
  readonly prix: PrixPublie
  readonly id?: string
  /** « de l’heure » après le taux horaire : un prix fixe, jamais « à partir de ». */
  readonly suffixe?: string | null
  readonly demande?: string
}

/**
 * Le véhicule de référence et la date, dits une seule fois en légende quand
 * toutes les lignes chiffrées les partagent (J1, J5 : jamais répétés à
 * chaque ligne) ; sinon chaque ligne garde les siens.
 */
function referenceCommune(lignes: readonly LigneTarif[]): string | null {
  const references = new Set(
    lignes.flatMap(({ prix }) => (prix.reference === null ? [] : [prix.reference])),
  )
  const [seule] = references
  return references.size === 1 && seule !== undefined ? seule : null
}

/**
 * Un tableau de tarifs (composant `tableau-tarifs`) : l'en-tête de ligne ne
 * porte que le nom de la prestation (J5 : le lecteur d'écran annonce le prix
 * aussitôt) ; ce que le prix comprend et la demande de prix se lisent sous le
 * nom, en texte secondaire, sur une seconde rangée ; le prix occupe les deux.
 */
function rendreTableau(lignes: readonly LigneTarif[]): Html {
  const commune = referenceCommune(lignes)
  return html`<table class="tableau-tarifs catalogue-tableau-tarifs">
      ${commune !== null && html`<caption>${commune}</caption>`}
      <thead><tr><th scope="col">Prestation</th><th scope="col" class="tableau-tarifs__prix">Prix TTC</th></tr></thead>
      <tbody>
        ${lignes.map((ligne) => rendreLigne(ligne, commune))}
      </tbody>
    </table>`
}

function rendreLigne(ligne: LigneTarif, commune: string | null): Html {
  const { intitule, prix, id, suffixe, demande } = ligne
  const details = [
    ...prix.precisions,
    ...(prix.reference !== null && prix.reference !== commune ? [prix.reference] : []),
  ]
  return html`<tr class="catalogue-tarif"${id !== undefined && html` id="${id}"`}><th scope="row">${intitule}</th><td class="tableau-tarifs__prix catalogue-tarif__prix" rowspan="2">${rendreMontant(prix.montant, suffixe ?? null)}</td></tr>
        <tr class="catalogue-tarif__suite"><td>${details.map((detail) => html`<span class="tableau-tarifs__detail">${detail}</span>`)}${demande !== undefined && html`<a class="catalogue-tarif__demande" href="${demande}">${LIBELLE_DEMANDER_PRIX}</a>`}${noteARelire(prix)}</td></tr>`
}

/**
 * Le montant en morceaux insécables : « À partir de » d'un tenant, puis
 * « 89,00 € TTC » d'un tenant (J1, J2 : plus de « À par- / tir de » sur quatre
 * lignes au téléphone).
 */
function rendreMontant(montant: string, suffixe: string | null): Html | string {
  // « Sur devis après examen », « Sur demande » : des mots, qui passent à la ligne librement.
  if (!/\d/.test(montant)) return montant
  const prefixe = `${LIBELLE_A_PARTIR_DE} `
  const morceaux = montant.startsWith(prefixe)
    ? [LIBELLE_A_PARTIR_DE, montant.slice(prefixe.length)]
    : [montant]
  return html`${[...morceaux, ...(suffixe === null ? [] : [suffixe])].map((morceau, index) => html`${index > 0 && ' '}<span class="catalogue-tarif__morceau">${morceau}</span>`)}`
}

/** État vide qui dit sa cause et quoi faire (piège 4). */
function rendreForfaitsVides(): Html {
  return html`<p>Les forfaits seront publiés une fois confirmés par le garage. En attendant, chaque intervention est chiffrée sur devis.</p>`
}

/** Les familles sans forfait annoncé, en une phrase de liens plutôt qu'en lignes identiques. */
function rendreSurDevis(familles: readonly FamillePubliee[]): Html {
  return html`<section class="panneau pile-serree catalogue-tarifs__sur-devis" aria-labelledby="catalogue-titre-sur-devis">
    <h2 id="catalogue-titre-sur-devis" class="titre-carte">${TITRE_SUR_DEVIS}</h2>
    <p>${EXPLICATION_PRIX_SUR_DEVIS}</p>
    <ul class="catalogue-sur-devis">
      ${familles.map((famille) => html`<li><a href="${cheminFamille(famille.identifiant)}">${famille.libelle}</a>${famille.aRelire && html` ${pastilleARelire()}`}</li>`)}
    </ul>
  </section>`
}

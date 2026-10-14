import { CHEMINS, ORGANES_EXCLUS_DU_REEMPLOI } from '../../../../../contrats/index.js'
import {
  html,
  rendreFigureTechnique,
  type FigureTechnique,
  type Html,
  type VuePage,
} from '../../../../../web/index.js'
import type { FicheFamille } from '../../../application/consulter-famille.js'
import type { FamillePubliee, MentionPubliee } from '../../../domaine/publication.js'
import {
  cheminDemande,
  cheminFamille,
  enPhrase,
  joindreMots,
  LIBELLE_DEMANDER_PRIX,
  LIBELLE_RENDEZ_VOUS,
  LIBELLE_TOUTES_LES_FAMILLES,
  orienterLeDoute,
  pastilleARelire,
  PHRASE_PRIX_EXACT,
  rendreFilAriane,
  rendreForfaits,
  TITRE_LISTE,
  type RenvoiDoute,
} from './commun.js'
import { resumerPourDescription } from './description.js'
import { figureDeLaFamille } from './figures.js'

/** Mots courants repris dans le titre de l'onglet : « Freinage à Choisy-le-Roi : plaquettes, disques ». */
const MOTS_DANS_LE_TITRE = 2
export const TITRE_RETRAIT = 'Retrait au garage'
export const TITRE_POSE = 'Pose à l’atelier'
/** Titre des offres d'une prestation (peinture, diagnostic...) : il n'y a pas de pièce à retirer. */
export const TITRE_PRESTATION = 'Ce que fait l’atelier'
/** Titre des signes : ils alertent sur une usure comme sur un dégât (carrosserie). */
export const TITRE_SIGNES = 'Les signes à surveiller'
/** Pièce dessinée en tirets : mention neutre, juste quel que soit le genre de la pièce. */
export const MENTION_PIECE_CACHEE = 'partie cachée, en tirets sur la figure'
/** Seule figure de la page : « Fig. 1 ». */
const NUMERO_FIGURE = 1

export function titreFamille(famille: FamillePubliee, ville: string): string {
  return `${famille.libelle} à ${ville} : ${joindreMots(famille.motsCourants.slice(0, MOTS_DANS_LE_TITRE))}`
}

/**
 * `/pieces-et-reparations/<famille>` : la figure technique légendée et ses
 * pièces numérotées, à quoi sert la famille, le prix daté ou « Prix sur
 * devis », les deux offres (retrait au garage, pose à l'atelier) avec la
 * vérification avant commande, les signes d'usure, et les deux actions.
 */
export function vuePageFamille(fiche: FicheFamille, ville: string, renvoi: RenvoiDoute): VuePage {
  const { famille } = fiche
  const figure = figureDeLaFamille(famille.identifiant)
  const description = `${famille.libelle} à ${ville} : ${joindreMots(famille.motsCourants)}. ${famille.role}`
  const classes =
    figure === null ? 'catalogue-fiche catalogue-fiche--sans-figure' : 'catalogue-fiche'
  return {
    titre: titreFamille(famille, ville),
    description: resumerPourDescription(description),
    chemin: cheminFamille(famille.identifiant),
    rubrique: 'catalogue',
    contenu: html`<div class="entete-page catalogue-entete">
  <div class="conteneur">
    ${rendreFilAriane([
      { libelle: TITRE_LISTE, chemin: CHEMINS.catalogue },
      { libelle: famille.libelle, chemin: cheminFamille(famille.identifiant) },
    ])}
    <p class="surtitre">${TITRE_LISTE}</p>
    <h1>${famille.libelle}</h1>
    ${famille.aRelire && html`<p>${pastilleARelire()} Famille proposée, pas encore confirmée par le garage.</p>`}
    <p class="catalogue-fiche__mots"><span class="visuellement-masque">Mots courants : </span>${enPhrase(joindreMots(famille.motsCourants))}</p>
  </div>
</div>
<div class="conteneur section ${classes}">
  <section class="pile-serree catalogue-fiche__role" aria-labelledby="catalogue-titre-role">
    <h2 id="catalogue-titre-role" class="titre-carte">À quoi ça sert</h2>
    <p class="texte-intro">${famille.role}</p>
  </section>
  ${figure !== null && rendreFigureEtPieces(figure, famille)}
  <section class="carte pile catalogue-fiche__prix" aria-labelledby="catalogue-titre-prix">
    <h2 id="catalogue-titre-prix" class="titre-carte">Prix et demande</h2>
    ${rendreForfaits(famille.forfaits)}
    <p class="catalogue-prix__exact">${PHRASE_PRIX_EXACT}</p>
    ${rendreConsigneDemande(famille, renvoi)}
    <ul class="liste-actions catalogue-fiche__actions">
      <li><a class="bouton bouton--principal" href="${cheminDemande('devis', famille.identifiant)}">${LIBELLE_DEMANDER_PRIX}</a></li>
      <li><a class="bouton bouton--secondaire" href="${cheminDemande('rendez-vous', famille.identifiant)}">${LIBELLE_RENDEZ_VOUS}</a></li>
    </ul>
  </section>
  ${rendreOffres(fiche)}
  <section class="pile-serree catalogue-fiche__signes" aria-labelledby="catalogue-titre-signes">
    <h2 id="catalogue-titre-signes" class="titre-carte">${TITRE_SIGNES}</h2>
    <ul class="catalogue-signes">
      ${famille.signesUsure.map((signe) => html`<li>${signe}</li>`)}
    </ul>
    <p>${orienterLeDoute(renvoi, 'Vous reconnaissez un de ces signes ?', ' : 5 questions au plus pour savoir s’il faut agir vite.')}</p>
  </section>
  <ul class="catalogue-renvois catalogue-fiche__renvois">
    <li><a href="${CHEMINS.catalogue}">${LIBELLE_TOUTES_LES_FAMILLES}</a></li>
    <li><a href="${CHEMINS.tarifs}">Tous les tarifs</a></li>
  </ul>
</div>`,
  }
}

/** Photo d'un dégât : envoyée par SMS au numéro du garage, elle accélère le devis. */
export const PHRASE_PHOTO_SMS = 'pour un devis plus rapide'

/**
 * Une prestation se demande en décrivant ce qui ne va pas (J3 : « Décrivez
 * le dégât »), jamais en choisissant une pièce ; un dégât se montre aussi en
 * photo, par SMS au numéro du garage.
 */
function rendreConsigneDemande(famille: FamillePubliee, renvoi: RenvoiDoute): Html | null {
  if (famille.consigneDemande === null && !famille.photoParSms) return null
  const { telephone } = renvoi
  const sms = telephone.lien.replace(/^tel:/, 'sms:')
  return html`<div class="pile-serree catalogue-consigne">
      ${famille.consigneDemande !== null && html`<p class="catalogue-consigne__texte">${famille.consigneDemande}</p>`}
      ${famille.photoParSms && html`<p>Envoyez une photo du dégât par SMS au <a class="catalogue-consigne__sms" href="${sms}">${telephone.affichable}</a> ${PHRASE_PHOTO_SMS}.</p>`}
    </div>`
}

/**
 * La figure (Fig. 1) et la nomenclature de ses pièces : les numéros de la
 * liste sont ceux des repères du dessin, tirés des mêmes données.
 */
function rendreFigureEtPieces(figure: FigureTechnique, famille: FamillePubliee): Html {
  const reperes = [...figure.reperes].sort((a, b) => a.numero - b.numero)
  return html`<div class="catalogue-fiche__figure">${rendreFigureTechnique(figure, { numero: NUMERO_FIGURE, id: `figure-${famille.identifiant}` })}</div>
  <section class="pile-serree catalogue-fiche__pieces" aria-labelledby="catalogue-titre-pieces">
    <h2 id="catalogue-titre-pieces" class="titre-carte">Les pièces, repère par repère</h2>
    <ol class="catalogue-nomenclature">
      ${reperes.map(
        (repere) =>
          html`<li value="${repere.numero}"><span class="catalogue-nomenclature__repere" aria-hidden="true">${repere.numero}</span><span class="catalogue-nomenclature__piece">${enPhrase(repere.libelle)}${repere.cachee === true && html` <span class="catalogue-nomenclature__cachee">(${MENTION_PIECE_CACHEE})</span>`}</span></li>`,
      )}
    </ol>
  </section>`
}

/**
 * Les deux offres (arbitrage 4 du Kano) : la pièce seule à retirer au garage,
 * si la vente au comptoir est publiée, et la pose à l'atelier ; puis, une
 * seule fois sur la page, la vérification avant commande et la gamme. Chaque
 * offre nommée dans la note mène à la demande de prix, ce choix déjà coché.
 * Une prestation (peinture, diagnostic...) n'a ni pièce seule, ni
 * vérification, ni gamme : seulement ce que fait l'atelier.
 */
function rendreOffres(fiche: FicheFamille): Html {
  const { famille, venteAuComptoir, engagementPiecePosee } = fiche
  if (!famille.ventePieceSeule) {
    return html`<section class="pile-serree catalogue-fiche__offres" aria-labelledby="catalogue-titre-offres">
    <h2 id="catalogue-titre-offres" class="titre-carte">${TITRE_PRESTATION}</h2>
    <div class="carte pile-serree catalogue-offre"><p>${famille.ceQueFaitLeGarage}</p></div>
  </section>`
  }
  const titre = venteAuComptoir === null ? TITRE_POSE : 'Retrait ou pose : à vous de choisir'
  return html`<section class="pile-serree catalogue-fiche__offres" aria-labelledby="catalogue-titre-offres">
    <h2 id="catalogue-titre-offres" class="titre-carte">${titre}</h2>
    <ul class="catalogue-offres">
      ${venteAuComptoir !== null && rendreOffre(TITRE_RETRAIT, venteAuComptoir.texte, venteAuComptoir.aRelire)}
      ${rendreOffre(TITRE_POSE, famille.ceQueFaitLeGarage, false)}
    </ul>
    ${rendreVerification(engagementPiecePosee)}
    ${rendreGamme(fiche)}
    ${venteAuComptoir !== null && html`<p class="texte-note">À la demande de prix, choisissez « <a href="${cheminDemande('devis', famille.identifiant, { modalite: 'retrait' })}">Retrait au garage</a> » ou « <a href="${cheminDemande('devis', famille.identifiant, { modalite: 'pose' })}">Pose à l’atelier</a> ».</p>`}
  </section>`
}

function rendreOffre(titre: string, texte: string, aRelire: boolean): Html {
  return html`<li class="carte pile-serree catalogue-offre">
        <h3 class="catalogue-offre__titre">${titre}</h3>
        <p>${texte}${aRelire && html` ${pastilleARelire()}`}</p>
      </li>`
}

/** Vérification de la pièce avant toute commande (AT-4), si l'engagement est publié dans ce mode. */
function rendreVerification(engagement: MentionPubliee | null): Html | null {
  if (engagement === null) return null
  return html`<p class="catalogue-verification"><strong>Vérifiée avant commande.</strong> ${engagement.texte}${engagement.aRelire && html` ${pastilleARelire()}`}</p>`
}

/**
 * La gamme de pièce : au choix (neuve, d'occasion ou reconditionnée) si
 * l'engagement est publié, jamais pour un organe que la loi exclut du
 * réemploi (référentiel unique des contrats, repris par « Vos droits ») :
 * pièces neuves uniquement.
 */
function rendreGamme(fiche: FicheFamille): Html | null {
  const organe = fiche.famille.organeExcluDuReemploi
  if (organe !== null) {
    return html`<p class="catalogue-gamme"><strong>Pièces neuves uniquement.</strong> La loi ne prévoit pas de pièces d’occasion pour ${ORGANES_EXCLUS_DU_REEMPLOI[organe].nom} : <a href="${CHEMINS.droits}">vos droits</a>.</p>`
  }
  const { gammeAuChoix } = fiche
  if (gammeAuChoix === null) return null
  return html`<p class="catalogue-gamme">${gammeAuChoix.texte}${gammeAuChoix.aRelire && html` ${pastilleARelire()}`}</p>`
}

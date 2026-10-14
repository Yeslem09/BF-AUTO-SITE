import {
  CHEMINS,
  PARAMETRES_DEMANDE,
  type ModaliteDemande,
  type PreDiagnosticPublie,
  type TelephonePublic,
  type TypeDemande,
} from '../../../../../contrats/index.js'
import { html, type Html } from '../../../../../web/index.js'
import type { FamillePubliee, ForfaitPublie, PrixPublie } from '../../../domaine/publication.js'
import { LONGUEUR_MAX_REQUETE } from '../../../domaine/recherche.js'
import { figureDeLaFamille } from './figures.js'

/** Phrase de P-08, sous chaque prix : le montant affiché n'engage pas sur le véhicule du client. */
export const PHRASE_PRIX_EXACT = 'Votre prix exact au devis, avant travaux.'
/**
 * Démonstration seulement, sous des prix proposés : ce ne sont pas encore
 * ceux du garage. Jamais rendue en production (une proposition y est masquée).
 */
export const NOTE_PRIX_PROPOSES =
  'Prix de démonstration calés sur le marché local, à confirmer par le garage.'
/** Libellé public de la rubrique (arbitrage 4 du Kano) ; l'adresse `/pieces-et-reparations` reste. */
export const TITRE_LISTE = 'Pièces détachées'
export const LIBELLE_DEMANDER_PRIX = 'Demander un prix'
export const LIBELLE_RENDEZ_VOUS = 'Demander un rendez-vous'
export const LIBELLE_TOUTES_LES_FAMILLES = 'Toutes les familles'
/** Paramètre de la recherche par mot : `/pieces-et-reparations?q=plaquettes`. */
export const PARAMETRE_RECHERCHE = 'q'
/** Ancre de la recherche : après l'envoi, la page s'ouvre sur le champ et ses résultats. */
export const ANCRE_RECHERCHE = 'recherche'
const LIBELLE_RECHERCHE = 'Quelle pièce cherchez-vous ?'
const EXEMPLE_RECHERCHE = 'Ex. plaquettes'
const LIBELLE_A_RELIRE = 'À valider'
const SEPARATEUR_MOTS = ', '
/** Mots courants repris sous le nom d'une famille, sur les cartes : trois au plus. */
const MOTS_SUR_LA_CARTE = 3
/** Longueur de la précision d'une carte : deux lignes au plus, pour des cartes d'égale hauteur. */
export const LONGUEUR_MAX_AIDE = 40

/** Où envoyer un client qui doute : le pré-diagnostic s'il est publié, sinon le téléphone. */
export interface RenvoiDoute {
  readonly preDiagnosticPublie: PreDiagnosticPublie
  readonly telephone: TelephonePublic
}

/**
 * La question du doute, suivie du pré-diagnostic (et de sa promesse) s'il est
 * publié, ou de l'appel au garage sinon : jamais un lien vers une page absente
 * (Kano D3).
 */
export function orienterLeDoute(renvoi: RenvoiDoute, question: string, promesse: string): Html {
  const { telephone } = renvoi
  return renvoi.preDiagnosticPublie
    ? html`${question} <a href="${CHEMINS.preDiagnostic}">Faites le pré-diagnostic</a>${promesse}`
    : html`${question} Appelez-nous au <a href="${telephone.lien}">${telephone.affichable}</a>.`
}

/** Adresse de la page d'une famille. */
export function cheminFamille(identifiant: string): string {
  return `${CHEMINS.catalogue}/${encodeURIComponent(identifiant)}`
}

/** Ce qu'une demande de prix arrive prête à dire : retrait ou pose, pièce ou prestation. */
export interface PreremplissageDemande {
  readonly modalite?: ModaliteDemande
  /** Une pièce de la famille (`ReferenceFamille.pieces`), pré-cochée. */
  readonly piece?: string
  /** Une prestation de la famille (`ReferenceFamille.prestations`) : ni pièces, ni gamme, ni retrait. */
  readonly prestation?: string
}

/**
 * Demande préremplie : `/demande?type=devis&famille=freinage`, ou sans famille ;
 * avec `modalite`, le retrait au garage ou la pose à l'atelier arrive coché,
 * avec `piece` la pièce, avec `prestation` la prestation demandée.
 */
export function cheminDemande(
  type: TypeDemande,
  identifiantFamille?: string,
  preremplissage: PreremplissageDemande = {},
): string {
  const parametres = new URLSearchParams({ [PARAMETRES_DEMANDE.type]: type })
  if (identifiantFamille !== undefined) {
    parametres.set(PARAMETRES_DEMANDE.famille, identifiantFamille)
  }
  const { modalite, piece, prestation } = preremplissage
  if (modalite !== undefined) parametres.set(PARAMETRES_DEMANDE.modalite, modalite)
  if (piece !== undefined) parametres.set(PARAMETRES_DEMANDE.piece, piece)
  if (prestation !== undefined) parametres.set(PARAMETRES_DEMANDE.prestation, prestation)
  return `${CHEMINS.demande}?${parametres.toString()}`
}

/**
 * La demande de prix d'un forfait : une prestation (révision, géométrie) est
 * demandée comme telle ; un forfait qui pose une pièce la pré-coche, avec la
 * pose à l'atelier.
 */
export function cheminDemandeForfait(famille: FamillePubliee, forfait: ForfaitPublie): string {
  if (forfait.prestation) {
    return cheminDemande('devis', famille.identifiant, { prestation: forfait.intitule })
  }
  return cheminDemande('devis', famille.identifiant, {
    modalite: 'pose',
    ...(forfait.piece !== null && { piece: forfait.piece }),
  })
}

export function joindreMots(mots: readonly string[]): string {
  return mots.join(SEPARATEUR_MOTS)
}

/** « plaquettes, disques » devient « Plaquettes, disques ». */
export function enPhrase(texte: string): string {
  return texte.charAt(0).toLocaleUpperCase('fr') + texte.slice(1)
}

/**
 * Précision d'une carte : ses mots courants dans l'ordre, trois au plus, en
 * sautant ceux qui feraient dépasser deux lignes ; lors d'une recherche,
 * d'abord celui qui a mené à la famille. Le premier mot est toujours gardé.
 */
export function aideDeLaCarte(famille: FamillePubliee, motEnTete: string | null = null): string {
  const candidats =
    motEnTete === null
      ? famille.motsCourants
      : [motEnTete, ...famille.motsCourants.filter((mot) => mot !== motEnTete)]
  const retenus: string[] = []
  for (const mot of candidats) {
    if (retenus.length === MOTS_SUR_LA_CARTE) break
    const avec = joindreMots([...retenus, mot])
    if (retenus.length === 0 || avec.length <= LONGUEUR_MAX_AIDE) retenus.push(mot)
  }
  return enPhrase(joindreMots(retenus))
}

/** Marque de relecture : n'apparaît qu'en mode relecture, sur une valeur encore à valider. */
export function pastilleARelire(): Html {
  return html`<span class="pastille catalogue-a-relire">${LIBELLE_A_RELIRE}</span>`
}

/** Dessin au trait de la famille, sans repères (vignettes), ou rien s'il n'existe pas. */
export function dessinDeLaFamille(identifiant: string, classe: string): Html | null {
  const figure = figureDeLaFamille(identifiant)
  if (figure === null) return null
  return html`<svg class="${classe}" viewBox="0 0 80 56" aria-hidden="true" focusable="false"><use href="${`${figure.dessin}#dessin`}"></use></svg>`
}

/** Carte d'une famille (composant `carte-famille`) : figure quadrillée, nom, mots courants ; toute la carte est le lien. */
export function rendreCarteFamille(famille: FamillePubliee, motEnTete: string | null = null): Html {
  return html`<li><a class="carte-famille" href="${cheminFamille(famille.identifiant)}"><span class="carte-famille__planche">${dessinDeLaFamille(famille.identifiant, 'carte-famille__dessin')}</span><span class="carte-famille__nom">${famille.libelle}${famille.aRelire && html` ${pastilleARelire()}`}</span><span class="carte-famille__aide">${aideDeLaCarte(famille, motEnTete)}</span></a></li>`
}

/** Grille des familles (composant `grille-familles`). */
export function rendreGrilleFamilles(familles: readonly FamillePubliee[]): Html {
  return html`<ul class="grille-familles">${familles.map((famille) => rendreCarteFamille(famille))}</ul>`
}

/**
 * Puce d'une famille (composant `puce-famille`), pour la bande d'ouverture de
 * l'accueil. `classe` va sur l'élément de liste (par exemple une puce montrée
 * au bureau seulement).
 */
export function rendrePuceFamille(famille: FamillePubliee, classe: string | null = null): Html {
  const puce = html`<a class="puce-famille" href="${cheminFamille(famille.identifiant)}">${dessinDeLaFamille(famille.identifiant, 'puce-famille__dessin')}<span>${famille.libelle}</span></a>`
  return classe === null ? html`<li>${puce}</li>` : html`<li class="${classe}">${puce}</li>`
}

/**
 * Recherche par mot (composant `recherche`), en GET vers la liste des
 * familles : elle fonctionne sans JavaScript. L'ancre ouvre la page sur le
 * champ et ses résultats.
 */
export function rendreRecherche(id: string, requete = ''): Html {
  return html`<form class="recherche" role="search" method="get" action="${`${CHEMINS.catalogue}#${ANCRE_RECHERCHE}`}">
    <label class="champ__libelle" for="${id}">${LIBELLE_RECHERCHE}</label>
    <div class="recherche__ligne">
      <input class="champ__saisie" id="${id}" name="${PARAMETRE_RECHERCHE}" type="search" value="${requete}" placeholder="${EXEMPLE_RECHERCHE}" maxlength="${LONGUEUR_MAX_REQUETE}" autocomplete="off" enterkeyhint="search">
      <button class="bouton bouton--principal" type="submit">Chercher</button>
    </div>
  </form>`
}

export interface EtapeAriane {
  readonly libelle: string
  readonly chemin: string
}

/** Fil d'Ariane (composant `fil-ariane`) : l'accueil, puis chaque étape ; la dernière est la page courante. */
export function rendreFilAriane(etapes: readonly EtapeAriane[]): Html {
  const toutes = [{ libelle: 'Accueil', chemin: CHEMINS.accueil }, ...etapes]
  return html`<nav class="fil-ariane" aria-label="Fil d’Ariane"><ol>${toutes.map((etape, index) =>
    index === toutes.length - 1
      ? html`<li><a href="${etape.chemin}" aria-current="page">${etape.libelle}</a></li>`
      : html`<li><a href="${etape.chemin}">${etape.libelle}</a></li>`,
  )}</ol></nav>`
}

/**
 * Un prix, au format unique : montant, précisions (véhicule de référence,
 * contenu, durée, date d'effet) et, en relecture seulement, ce qu'il reste à
 * obtenir. La page de famille passe par ici ; la page des tarifs et l'accueil
 * lisent le même montant et les mêmes précisions (`PrixPublie`), si bien qu'un
 * prix ne peut pas diverger.
 */
export function rendrePrix(prix: PrixPublie): Html {
  const precisions = [...prix.precisions, ...(prix.reference === null ? [] : [prix.reference])]
  return html`<p class="catalogue-prix__montant">${prix.montant}</p>
${
  precisions.length > 0 &&
  html`<ul class="catalogue-prix__precisions">
  ${precisions.map((precision) => html`<li>${precision}</li>`)}
</ul>`
}
${noteARelire(prix)}`
}

/**
 * Les forfaits d'une famille, chacun nommé (« Plaquettes avant posées ») ; un
 * forfait sans montant ne se nomme pas seul : « Prix sur devis » suffit.
 */
export function rendreForfaits(forfaits: readonly ForfaitPublie[]): Html {
  const annonces = forfaits.filter((forfait) => forfait.prix.estPublie)
  if (annonces.length === 0) {
    const [premier] = forfaits
    return html`<div class="catalogue-prix">${premier === undefined ? html`<p class="catalogue-prix__montant">Prix sur devis</p>` : rendrePrix(premier.prix)}</div>`
  }
  return html`<ul class="catalogue-forfaits">
  ${annonces.map(
    (forfait) =>
      html`<li class="catalogue-forfait" id="${`forfait-${forfait.identifiant}`}"><h3 class="catalogue-forfait__intitule">${forfait.intitule}</h3>${rendrePrix(forfait.prix)}</li>`,
  )}
</ul>
${forfaits.some((forfait) => forfait.prix.proposition) && noteProposition(forfaits.map((forfait) => forfait.prix))}`
}

/**
 * Démonstration : sous des prix proposés, la phrase qui le dit ; en relecture,
 * chaque prix porte déjà sa pastille et sa note.
 */
export function noteProposition(prix: readonly PrixPublie[]): Html | null {
  const proposes = prix.filter((unPrix) => unPrix.proposition)
  if (proposes.length === 0 || proposes.some((unPrix) => unPrix.noteARelire !== null)) return null
  return html`<p class="texte-note catalogue-prix__proposition">${NOTE_PRIX_PROPOSES}</p>`
}

/** En relecture seulement : ce qu'il reste à obtenir du garage pour ce prix. */
export function noteARelire(prix: PrixPublie): Html | null {
  return prix.noteARelire === null
    ? null
    : html`<p class="catalogue-a-relire-note">${pastilleARelire()} ${prix.noteARelire}</p>`
}

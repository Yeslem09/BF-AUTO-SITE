import { CHEMINS } from '../../contrats/index.js'
import type { IdentiteGaragePublique } from '../../contrats/index.js'
import { FIGURE_FREIN_A_DISQUE, rendreFigureTechnique } from '../figure-technique.js'
import { html, type Html } from '../html.js'
import { INTENTIONS, rendreListeIntentions } from '../intentions.js'
import type { EmplacementAccueil } from '../module-contexte.js'
import type { VuePage } from '../page.js'

type Colonne = 'gauche' | 'droite'

/** Tête de la bande : statut du jour et adresse courte (premier bloc sur téléphone). */
const ZONE_STATUT: EmplacementAccueil = 'statut'
/** Bande d'ouverture, à droite au bureau : la question 1 du pré-diagnostic, dans sa plaque. */
const ZONE_PLAQUE: EmplacementAccueil = 'pre-diagnostic'
/** Bande d'ouverture, à gauche au bureau : les pièces détachées (recherche, familles principales). */
const ZONE_PIECES: EmplacementAccueil = 'recherche-pieces'
/** Juste sous la bande, en pleine largeur : la grille des familles et leurs figures. */
const ZONE_PLEINE_LARGEUR: EmplacementAccueil = 'catalogue'
/** Sous les colonnes : l'encart « Nouveau nom ». */
const ZONE_FINALE: EmplacementAccueil = 'encart'
/** Le bloc atelier porte la figure signature (Fig. 1, frein à disque légendé). */
const ZONE_FIGURE: EmplacementAccueil = 'information'

/**
 * Colonnes de la partie claire, dans l'ordre du document (celui du téléphone).
 * Au bureau, deux colonnes de hauteurs voisines : l'atelier (et sa Fig. 1) puis
 * les questions à gauche, le garage puis le rappel à droite. Trois colonnes
 * laissaient un écran et demi vide sous les questions et sous l'atelier, face
 * au garage et au formulaire de rappel empilés (jury, passe 1). L'ordre du
 * clavier suit l'ordre de lecture : une colonne, puis l'autre.
 */
export const COLONNES_ACCUEIL: readonly {
  readonly colonne: Colonne
  readonly zones: readonly EmplacementAccueil[]
}[] = [
  { colonne: 'gauche', zones: ['information', 'questions'] },
  { colonne: 'droite', zones: ['garage', 'rappel'] },
]

/**
 * Ordre des zones dans le document, celui du téléphone : statut, l'urgence
 * (question 1), puis les pièces mises en avant, puis le reste (D7, décisions
 * d'Anthony du 2026-09-23).
 */
export const ORDRE_ZONES_ACCUEIL: readonly EmplacementAccueil[] = [
  ZONE_STATUT,
  ZONE_PLAQUE,
  ZONE_PIECES,
  ZONE_PLEINE_LARGEUR,
  ...COLONNES_ACCUEIL.flatMap(({ zones }) => zones),
  ZONE_FINALE,
]

/** Blocs déjà rendus, par emplacement. Un emplacement absent n'est pas affiché. */
export type BlocsAccueilRendus = Partial<Record<EmplacementAccueil, Html>>

export interface AccrocheDecoupee {
  /** Avant les deux-points : le lieu. */
  readonly lieu: string | null
  /** La promesse. */
  readonly promesse: string
  /** Dernier membre de la promesse, après sa dernière virgule, posé à l'accent. */
  readonly chute: string | null
}

/**
 * Découpe l'accroche du garage pour la typographie de l'ouverture :
 * « Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez. »
 * donne le lieu « Votre garage à Choisy-le-Roi : », la promesse « on explique,
 * on chiffre, » et la chute « vous décidez. ». Sans deux-points, l'accroche
 * reste une promesse entière, sans chute : rien n'est inventé ni retranché.
 */
export function decouperAccroche(accroche: string): AccrocheDecoupee {
  const texte = accroche.trim()
  const deuxPoints = texte.indexOf(':')
  const suite = texte.slice(deuxPoints + 1).trim()
  if (deuxPoints <= 0 || suite === '') return { lieu: null, promesse: texte, chute: null }
  const lieu = texte.slice(0, deuxPoints + 1).trim()
  const virgule = suite.lastIndexOf(',')
  const chute = virgule > 0 ? suite.slice(virgule + 1).trim() : ''
  if (chute === '') return { lieu, promesse: suite, chute: null }
  return { lieu, promesse: suite.slice(0, virgule + 1), chute }
}

/** Mot composé du lieu : « Choisy-le-Roi » ne se coupe pas à ses traits d'union. */
const MOT_COMPOSE = /(\S+-\S+)/

function lieuInsecable(lieu: string): Html {
  return html`${lieu
    .split(MOT_COMPOSE)
    .map((morceau) =>
      MOT_COMPOSE.test(morceau)
        ? html`<span class="accroche__insecable">${morceau}</span>`
        : morceau,
    )}`
}

/** L'accroche tient sur une ligne au bureau : le lieu, la promesse, la chute à l'accent. */
function rendreAccroche(accroche: string): Html {
  const { lieu, promesse, chute } = decouperAccroche(accroche)
  return html`<p class="accroche">${lieu !== null && html`<span class="accroche__lieu">${lieuInsecable(lieu)}</span> `}<span class="accroche__promesse">${promesse}${chute !== null && html` <em class="accroche__chute">${chute}</em>`}</span></p>`
}

/**
 * Ce que fait le garage, sous l'accroche, dès le premier écran (« Mécanique,
 * entretien, carrosserie et peinture, toutes marques. ») : un retraité qui
 * cherche la carrosserie n'a plus à descendre jusqu'à l'atelier pour le lire.
 */
function rendreActivites(activites: string | undefined): Html | null {
  const texte = activites?.trim() ?? ''
  return texte === '' ? null : html`<p class="accroche__activites">${texte}</p>`
}

function rendreZone(emplacement: EmplacementAccueil, contenu: Html): Html {
  return html`<div class="accueil__zone accueil__zone--${emplacement}">${contenu}</div>`
}

function rendreOuverture(
  titre: string,
  identite: IdentiteGaragePublique,
  blocs: BlocsAccueilRendus,
): Html {
  const statut = blocs[ZONE_STATUT]
  const plaque = blocs[ZONE_PLAQUE]
  const pieces = blocs[ZONE_PIECES]
  const classes = plaque === undefined ? 'ouverture' : 'ouverture ouverture--avec-plaque'
  // Quand les pièces ont leur bloc dans la bande, le raccourci vers elles ferait doublon.
  const raccourcis =
    pieces === undefined
      ? [INTENTIONS.catalogue, INTENTIONS.rendezVous, INTENTIONS.tarifs]
      : [INTENTIONS.rendezVous, INTENTIONS.tarifs]
  return html`<section class="${classes}" aria-labelledby="titre-accueil">
  <div class="conteneur ouverture__grille">
    <div class="ouverture__tete">
      ${statut !== undefined && rendreZone(ZONE_STATUT, statut)}
      <h1 class="ouverture__titre surtitre" id="titre-accueil">${titre}</h1>
      ${rendreAccroche(identite.accroche)}
      ${rendreActivites(identite.activites)}
    </div>
    ${plaque !== undefined && rendreZone(ZONE_PLAQUE, html`<div class="plaque"><div class="plaque__filet">${plaque}</div></div>`)}
    <div class="ouverture__pieces">
      ${pieces !== undefined && rendreZone(ZONE_PIECES, pieces)}
      <nav class="raccourcis" aria-label="Accès rapides">
        ${rendreListeIntentions(raccourcis, 'raccourcis__liste')}
      </nav>
    </div>
  </div>
</section>`
}

function rendrePleineLargeur(blocs: BlocsAccueilRendus): Html | null {
  const catalogue = blocs[ZONE_PLEINE_LARGEUR]
  if (catalogue === undefined) return null
  return html`<div class="accueil__pleine-largeur">
  <div class="conteneur">${rendreZone(ZONE_PLEINE_LARGEUR, catalogue)}</div>
</div>`
}

function rendreFigureSignature(): Html {
  return html`<div class="accueil__figure">${rendreFigureTechnique(FIGURE_FREIN_A_DISQUE, { numero: 1, id: 'figure-1' })}</div>`
}

function rendreJour(blocs: BlocsAccueilRendus): Html | null {
  const colonnes = COLONNES_ACCUEIL.flatMap(({ colonne, zones }) => {
    const rendues = zones.flatMap((emplacement) => {
      const bloc = blocs[emplacement]
      if (bloc === undefined) return []
      const contenu = emplacement === ZONE_FIGURE ? html`${bloc}${rendreFigureSignature()}` : bloc
      return [rendreZone(emplacement, contenu)]
    })
    return rendues.length === 0
      ? []
      : [html`<div class="accueil__colonne accueil__colonne--${colonne}">${rendues}</div>`]
  })
  const finale = blocs[ZONE_FINALE]
  if (colonnes.length === 0 && finale === undefined) return null
  return html`<div class="accueil__jour">
  <div class="conteneur accueil__colonnes">
    ${colonnes}
    ${finale !== undefined && rendreZone(ZONE_FINALE, finale)}
  </div>
</div>`
}

/** Page d'accueil : assemble les blocs fournis par les contextes, sans rien inventer pour les absents. */
export function vueAccueil(identite: IdentiteGaragePublique, blocs: BlocsAccueilRendus): VuePage {
  const { adresse, telephone } = identite
  const adresseComplete = `${adresse.voie}, ${adresse.codePostal} ${adresse.ville}`
  const titre = `${identite.nom}, garage automobile à ${adresse.ville}`
  return {
    titre,
    description: `${identite.nom}, garage automobile au ${adresseComplete}. Téléphone : ${telephone.affichable}.`,
    chemin: CHEMINS.accueil,
    rubrique: 'accueil',
    contenu: html`${rendreOuverture(titre, identite, blocs)}
${rendrePleineLargeur(blocs)}
${rendreJour(blocs)}`,
  }
}

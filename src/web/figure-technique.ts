import { html, type Html } from './html.js'

/**
 * Figure technique au trait, élément signature du site : un dessin de pièce
 * (fichier SVG public, trait en currentColor), des repères numérotés reliés
 * par des traits de rappel, et la légende « Fig. N » qui nomme chaque repère.
 *
 * Numéros et légende naissent des mêmes données : ils ne peuvent pas se
 * contredire. Le dessin reste un fichier sans texte (les numéros sont posés
 * ici, dans le SVG de la page), réutilisable seul par le composant
 * `illustration-technique`. Aucune couleur : tout suit currentColor et les
 * jetons de la feuille de style.
 */

export interface Point {
  readonly x: number
  readonly y: number
}

export interface RepereFigure {
  readonly numero: number
  /** Nom de la pièce, en minuscules : « disque », « étrier ». */
  readonly libelle: string
  /** Pièce cachée, dessinée en tirets : la légende le dit. */
  readonly cachee?: boolean
  /** Centre de la pastille numérotée, en unités du dessin. */
  readonly pastille: Point
  /** Point de la pièce que vise le trait de rappel. */
  readonly cible: Point
}

export interface FigureTechnique {
  /** Ce que montre la figure : « Frein à disque, vue de face ». */
  readonly titre: string
  /** Chemin public du dessin ; son groupe `#dessin` est réutilisé. */
  readonly dessin: string
  /** Cadre de la figure (viewBox), marges des pastilles comprises. */
  readonly cadre: {
    readonly x: number
    readonly y: number
    readonly largeur: number
    readonly hauteur: number
  }
  readonly rayonPastille: number
  readonly reperes: readonly RepereFigure[]
}

/** Taille des chiffres rapportée au rayon de la pastille. */
const RAPPORT_CHIFFRE = 1.15
/** Rayon du point qui marque la cible du trait de rappel, rapporté à la pastille. */
const RAPPORT_POINT = 0.17
const MENTION_CACHEE = 'partie cachée, en tirets'

const arrondir = (valeur: number): number => Math.round(valeur * 100) / 100

/** Le trait de rappel part du bord de la pastille, pas de son centre. */
export function departTraitDeRappel(repere: RepereFigure, rayon: number): Point {
  const dx = repere.cible.x - repere.pastille.x
  const dy = repere.cible.y - repere.pastille.y
  const distance = Math.hypot(dx, dy)
  if (distance === 0) return repere.pastille
  return {
    x: arrondir(repere.pastille.x + (dx / distance) * rayon),
    y: arrondir(repere.pastille.y + (dy / distance) * rayon),
  }
}

/** Texte de la légende, qui sert aussi d'alternative textuelle complète au dessin. */
export function legendeFigure(figure: FigureTechnique): string {
  const reperes = [...figure.reperes]
    .sort((a, b) => a.numero - b.numero)
    .map((r) => `${r.numero} ${r.libelle}${r.cachee === true ? ` (${MENTION_CACHEE})` : ''}`)
  return `${figure.titre} : ${reperes.join(', ')}.`
}

function rendreRepere(repere: RepereFigure, rayon: number): Html {
  const depart = departTraitDeRappel(repere, rayon)
  const { pastille, cible } = repere
  return html`<g class="figure-technique__repere"><line class="figure-technique__rappel" x1="${depart.x}" y1="${depart.y}" x2="${cible.x}" y2="${cible.y}"/><circle class="figure-technique__cible" cx="${cible.x}" cy="${cible.y}" r="${arrondir(rayon * RAPPORT_POINT)}"/><circle class="figure-technique__pastille" cx="${pastille.x}" cy="${pastille.y}" r="${rayon}"/><text class="figure-technique__chiffre" x="${pastille.x}" y="${pastille.y}" font-size="${arrondir(rayon * RAPPORT_CHIFFRE)}">${repere.numero}</text></g>`
}

export interface OptionsFigure {
  /** Numéro de la figure dans la page (« Fig. 1 »). */
  readonly numero: number
  /** Identifiant unique dans la page, pour relier le dessin à sa légende. */
  readonly id: string
  /** Faux : le dessin seul, sans repères (vignettes trop petites pour les lire). */
  readonly reperes?: boolean
}

/**
 * Figure légendée. Le dessin est masqué aux lecteurs d'écran (l'équivalent
 * d'un `alt` vide) : sa légende le décrit déjà, repère par repère, et la
 * figure est nommée par elle ; la lire deux fois n'apporte rien (J5, passe 2
 * du jury).
 */
export function rendreFigureTechnique(figure: FigureTechnique, options: OptionsFigure): Html {
  const { cadre, rayonPastille } = figure
  const idLegende = `${options.id}-legende`
  const avecReperes = options.reperes !== false
  const numeros = figure.reperes.map(
    (r) =>
      html`<span class="figure-technique__terme"><b>${r.numero}</b> ${r.libelle}${r.cachee === true && ` (${MENTION_CACHEE})`}</span>`,
  )
  return html`<figure class="figure-technique" id="${options.id}">
  <div class="figure-technique__planche">
    <svg class="figure-technique__dessin" viewBox="${`${cadre.x} ${cadre.y} ${cadre.largeur} ${cadre.hauteur}`}" aria-hidden="true" focusable="false"><use href="${`${figure.dessin}#dessin`}"/>${avecReperes && figure.reperes.map((r) => rendreRepere(r, rayonPastille))}</svg>
  </div>
  <figcaption class="figure-technique__legende" id="${idLegende}"><span class="figure-technique__numero">Fig. ${options.numero}</span> ${figure.titre} : ${avecReperes ? joindre(numeros) : ''}${avecReperes ? '.' : legendeSansReperes(figure)}</figcaption>
</figure>`
}

function joindre(elements: readonly Html[]): Html[] {
  return elements.flatMap((element, index) => (index === 0 ? [element] : [html`, `, element]))
}

/** Sans pastilles, la légende nomme encore les pièces, sans numéros. */
function legendeSansReperes(figure: FigureTechnique): string {
  return `${figure.reperes.map((r) => r.libelle).join(', ')}.`
}

/** Fig. 1 de la direction V2 : le frein à disque, vue de face (« on explique »). */
export const FIGURE_FREIN_A_DISQUE: FigureTechnique = {
  titre: 'Frein à disque, vue de face',
  dessin: '/img/figures/frein-a-disque.svg',
  cadre: { x: 0, y: 0, largeur: 240, hauteur: 184 },
  rayonPastille: 10,
  reperes: [
    { numero: 1, libelle: 'disque', pastille: { x: 24, y: 164 }, cible: { x: 52.72, y: 130.94 } },
    { numero: 2, libelle: 'étrier', pastille: { x: 216, y: 20 }, cible: { x: 151.07, y: 44.68 } },
    {
      numero: 3,
      libelle: 'plaquettes',
      cachee: true,
      pastille: { x: 216, y: 70 },
      cible: { x: 145.03, y: 68 },
    },
  ],
}

/** Cadre commun des dessins de familles (80 x 56), élargi pour les pastilles. */
const CADRE_FAMILLE = { x: -16, y: -4, largeur: 112, hauteur: 64 } as const
const RAYON_FAMILLE = 4.5
const GAUCHE = -9
const DROITE = 89

type Repere3 = readonly [RepereFigure, RepereFigure, RepereFigure]

function famille(slug: string, titre: string, reperes: Repere3): FigureTechnique {
  return {
    titre,
    dessin: `/img/familles/${slug}.svg`,
    cadre: CADRE_FAMILLE,
    rayonPastille: RAYON_FAMILLE,
    reperes,
  }
}

function r(
  numero: number,
  libelle: string,
  pastille: Point,
  cible: Point,
  cachee = false,
): RepereFigure {
  return cachee
    ? { numero, libelle, pastille, cible, cachee }
    : { numero, libelle, pastille, cible }
}

/**
 * Une figure par famille d'intervention, indexée par l'identifiant (slug) de
 * la famille, qui est aussi le nom de son dessin dans public/img/familles/ :
 * les douze de la direction V2, puis les six ajoutées au catalogue le
 * 2026-09-24 (carrosserie et « vraiment tout », consigne d'Anthony).
 */
export const FIGURES_FAMILLES: Readonly<Record<string, FigureTechnique>> = {
  freinage: famille('freinage', 'Frein à disque', [
    r(1, 'disque', { x: GAUCHE, y: 50 }, { x: 23.21, y: 39.76 }),
    r(2, 'étrier', { x: DROITE, y: 4 }, { x: 55.75, y: 9.23 }),
    r(3, 'plaquettes', { x: DROITE, y: 22 }, { x: 56.22, y: 16.64 }, true),
  ]),
  batterie: famille('batterie', 'Batterie', [
    r(1, 'borne positive', { x: GAUCHE, y: 6 }, { x: 21, y: 9 }),
    r(2, 'borne négative', { x: DROITE, y: 6 }, { x: 59, y: 9 }),
    r(3, 'bac', { x: DROITE, y: 44 }, { x: 67, y: 40 }),
  ]),
  pneus: famille('pneus', 'Roue', [
    r(1, 'pneu', { x: GAUCHE, y: 50 }, { x: 20.34, y: 41.77 }),
    r(2, 'jante', { x: DROITE, y: 6 }, { x: 51.49, y: 18.36 }),
    r(3, 'écrou de roue', { x: DROITE, y: 48 }, { x: 45.41, y: 35.44 }),
  ]),
  'vidange-et-filtres': famille('vidange-et-filtres', 'Filtre à huile', [
    r(1, 'boîtier', { x: DROITE, y: 18 }, { x: 53, y: 30 }),
    r(2, 'élément filtrant', { x: GAUCHE, y: 34 }, { x: 31, y: 34 }, true),
    r(3, 'raccord fileté', { x: DROITE, y: 52 }, { x: 45, y: 50.3 }),
  ]),
  distribution: famille('distribution', 'Distribution', [
    r(1, 'courroie', { x: GAUCHE, y: 12 }, { x: 11.3, y: 17 }),
    r(2, 'pignon d’arbre à cames', { x: DROITE, y: 6 }, { x: 65.36, y: 12.75 }),
    r(3, 'pignon de vilebrequin', { x: DROITE, y: 52 }, { x: 45.63, y: 47.75 }),
  ]),
  embrayage: famille('embrayage', 'Disque d’embrayage', [
    r(1, 'garniture', { x: GAUCHE, y: 50 }, { x: 21.57, y: 40.9 }),
    r(2, 'ressort d’amortissement', { x: DROITE, y: 6 }, { x: 48.06, y: 19.94 }),
    r(3, 'moyeu cannelé', { x: DROITE, y: 34 }, { x: 46.39, y: 30.33 }),
  ]),
  'amortisseurs-et-suspension': famille(
    'amortisseurs-et-suspension',
    'Combiné ressort amortisseur',
    [
      r(1, 'ressort', { x: GAUCHE, y: 8 }, { x: 24.24, y: 16.5 }),
      r(2, 'corps de l’amortisseur', { x: GAUCHE, y: 46 }, { x: 14, y: 32 }),
      r(3, 'coupelle d’appui', { x: DROITE, y: 48 }, { x: 66.9, y: 38 }),
    ],
  ),
  echappement: famille('echappement', 'Silencieux d’échappement', [
    r(1, 'silencieux', { x: DROITE, y: 4 }, { x: 55, y: 13.2 }),
    r(2, 'chicanes intérieures', { x: DROITE, y: 50 }, { x: 47.5, y: 36 }, true),
    r(3, 'bride', { x: GAUCHE, y: 48 }, { x: 8.3, y: 34 }),
  ]),
  'demarrage-et-charge': famille('demarrage-et-charge', 'Alternateur', [
    r(1, 'poulie', { x: GAUCHE, y: 50 }, { x: 33.76, y: 33.1 }),
    r(2, 'ventilateur', { x: DROITE, y: 50 }, { x: 48.9, y: 38.4 }),
    r(3, 'patte de fixation', { x: DROITE, y: 6 }, { x: 61.2, y: 12.2 }),
  ]),
  climatisation: famille('climatisation', 'Condenseur de climatisation', [
    r(1, 'faisceau à ailettes', { x: GAUCHE, y: 54 }, { x: 20, y: 43 }),
    r(2, 'collecteur', { x: DROITE, y: 30 }, { x: 70, y: 30 }),
    r(3, 'raccord', { x: DROITE, y: 52 }, { x: 79, y: 42.3 }),
  ]),
  eclairage: famille('eclairage', 'Ampoule de phare', [
    r(1, 'culot', { x: GAUCHE, y: 50 }, { x: 14, y: 35 }),
    r(2, 'ampoule', { x: DROITE, y: 8 }, { x: 58, y: 21 }),
    r(3, 'filament', { x: DROITE, y: 48 }, { x: 48, y: 29 }),
  ]),
  'essuie-glaces': famille('essuie-glaces', 'Essuie-glace', [
    r(1, 'balai', { x: DROITE, y: 8 }, { x: 68, y: 21.5 }),
    r(2, 'bras', { x: GAUCHE, y: 30 }, { x: 27.5, y: 33.75 }),
    r(3, 'axe d’entraînement', { x: GAUCHE, y: 54 }, { x: 11, y: 49 }),
  ]),
  'moteur-et-injection': famille('moteur-et-injection', 'Bougie d’allumage', [
    r(1, 'isolant', { x: GAUCHE, y: 50 }, { x: 25, y: 35 }),
    r(2, 'culot fileté', { x: DROITE, y: 50 }, { x: 61, y: 35 }),
    r(3, 'électrodes', { x: DROITE, y: 8 }, { x: 74.5, y: 24 }),
  ]),
  'boite-de-vitesses': famille('boite-de-vitesses', 'Boîte de vitesses, en coupe', [
    r(1, 'carter', { x: GAUCHE, y: 50 }, { x: 8, y: 44 }),
    r(2, 'arbre primaire', { x: GAUCHE, y: 8 }, { x: 4, y: 19 }),
    r(3, 'pignons', { x: DROITE, y: 4 }, { x: 59, y: 12 }),
  ]),
  'diagnostic-electronique': famille('diagnostic-electronique', 'Fiche de diagnostic', [
    r(1, 'boîtier', { x: GAUCHE, y: 8 }, { x: 10, y: 16 }),
    r(2, 'broches', { x: GAUCHE, y: 50 }, { x: 20.2, y: 32 }),
    r(3, 'câble', { x: DROITE, y: 8 }, { x: 66, y: 18.5 }),
  ]),
  'pare-brise-et-vitrage': famille('pare-brise-et-vitrage', 'Pare-brise, vue de face', [
    r(1, 'vitrage feuilleté', { x: GAUCHE, y: 50 }, { x: 24, y: 38 }),
    r(2, 'joint', { x: GAUCHE, y: 10 }, { x: 16.5, y: 18 }),
    r(3, 'capteur de pluie', { x: DROITE, y: 6 }, { x: 43.5, y: 14 }),
  ]),
  carrosserie: famille('carrosserie', 'Voiture, vue de côté', [
    r(1, 'pare-chocs', { x: GAUCHE, y: 52 }, { x: 6, y: 37 }),
    r(2, 'aile', { x: GAUCHE, y: 14 }, { x: 14, y: 30.5 }),
    r(3, 'portière', { x: DROITE, y: 6 }, { x: 48, y: 33 }),
  ]),
  peinture: famille('peinture', 'Peinture, en coupe', [
    r(1, 'vernis', { x: DROITE, y: 6 }, { x: 39, y: 16.5 }),
    r(2, 'base colorée', { x: DROITE, y: 18 }, { x: 49, y: 22.5 }),
    r(3, 'apprêt', { x: DROITE, y: 30 }, { x: 59, y: 29.5 }),
  ]),
}

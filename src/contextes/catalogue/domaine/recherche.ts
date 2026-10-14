import { normaliser } from './mots-interdits.js'
import type { FamillePubliee } from './publication.js'

/**
 * Recherche d'une pièce par mot, dans les mots du client : le nom de la
 * famille, ses mots courants et ses synonymes. Pure et déterministe.
 *
 * Tolérante comme un comptoir : accents, majuscules, pluriels, mots de
 * liaison (« les plaquettes de frein »), début de mot (« plaq ») et une faute
 * de frappe sur un mot de cinq lettres ou plus (« plaquete »). Quand une
 * partie des familles répond à plus de mots de la requête que les autres,
 * seules celles-là sont gardées : « liquide de frein » mène au freinage, pas
 * au liquide de refroidissement du moteur. Et quand la requête entière est un
 * terme connu (« huile moteur »), seules les familles qui le portent restent.
 */

/** Au-delà, la requête est tronquée : personne ne cherche une pièce en une phrase entière. */
export const LONGUEUR_MAX_REQUETE = 80

/**
 * Mots qui ne désignent aucune pièce : ils ne comptent pas dans la recherche.
 * Articles, possessifs, relatifs et mots de position (« avant », « arrière »)
 * compris : « freins qui grincent » ne doit pas mener à « Air qui ne refroidit
 * plus », ni « plaquettes arrière » aux « feux arrière ». Retirés de la
 * requête comme des termes de chaque famille.
 */
const MOTS_VIDES = new Set([
  'a',
  'arriere',
  'au',
  'aux',
  'avant',
  'avec',
  'ca',
  'ce',
  'cela',
  'changement',
  'changer',
  'cote',
  'cette',
  'd',
  'dans',
  'de',
  'des',
  'droit',
  'droite',
  'du',
  'elle',
  'en',
  'est',
  'et',
  'fait',
  'gauche',
  'il',
  'j',
  'je',
  'l',
  'la',
  'le',
  'les',
  'lorsque',
  'm',
  'ma',
  'me',
  'mes',
  'mon',
  'n',
  'ne',
  'notre',
  'nos',
  'ou',
  'par',
  'pas',
  'piece',
  'plus',
  'pour',
  'prix',
  'qu',
  'quand',
  'que',
  'qui',
  'remplacement',
  'remplacer',
  's',
  'sa',
  'se',
  'ses',
  'son',
  'sur',
  'ta',
  'tes',
  'ton',
  'tres',
  'trop',
  'un',
  'une',
  'vehicule',
  'voiture',
  'vos',
  'votre',
  'y',
])

/**
 * Débuts de mot qui décrivent un symptôme, pas une pièce : « ça grince »,
 * « un bruit », « ça fume », « le voyant », « le volant vibre », « ça fuit »,
 * « la voiture tire à gauche ». La recherche propose alors d'abord le
 * pré-diagnostic, qui sait dire s'il faut agir vite.
 */
const DEBUTS_SYMPTOME = [
  'grinc',
  'bruit',
  'fume',
  'fumee',
  'voyant',
  'vibr',
  'fuit',
  'fuie',
  'fuite',
  'siffl',
  'claqu',
  'cogn',
  'frott',
  'chauff',
  'odeur',
  'brout',
  'patin',
  'trembl',
] as const
/** Formes entières : « tire » seul est un symptôme, pas « tirette » ni « tirant ». */
const MOTS_SYMPTOME = new Set(['tire', 'tirent', 'cale', 'calent', 'saute', 'sautent'])

/** Longueur minimale d'un début de mot accepté (« pla » trouve « plaquettes »). */
const PREFIXE_MIN = 3
/** Longueur à partir de laquelle une faute de frappe est pardonnée. */
const TOLERANCE_MIN = 5
const LONGUEUR_MIN_PLURIEL = 4
const SEPARATEURS = /[^a-z0-9]+/

/** Poids d'un mot trouvé selon l'endroit : le nom de la famille compte plus qu'un synonyme. */
const POIDS_CHAMP = { libelle: 3, motCourant: 2, synonyme: 2 } as const
/** Poids selon la qualité de la correspondance. */
const POIDS_CORRESPONDANCE = { exacte: 3, debut: 2, approchee: 1 } as const
/** La requête entière égale à un terme (« pot d'échappement ») : il est désigné sans ambiguïté. */
const BONUS_TERME_ENTIER = 10

export interface FamilleTrouvee {
  readonly famille: FamillePubliee
  /**
   * Le mot courant qui a conduit à la famille, pour dire au client pourquoi
   * elle lui est proposée ; `null` si c'est le nom de la famille ou un
   * synonyme (jamais affiché).
   */
  readonly motCourant: string | null
}

export interface ResultatRecherche {
  /** Familles retenues, de la plus pertinente à la moins pertinente. */
  readonly familles: readonly FamilleTrouvee[]
  /** La requête décrit un symptôme : le pré-diagnostic est proposé avant les familles. */
  readonly symptome: boolean
}

type Champ = keyof typeof POIDS_CHAMP

interface Terme {
  readonly champ: Champ
  readonly texte: string
  readonly mots: readonly string[]
  readonly entier: string
}

/** Requête ramenée à ce qui compte : tronquée, sans espaces superflus. */
export function nettoyerRequete(requete: string): string {
  return requete.replace(/\s+/g, ' ').trim().slice(0, LONGUEUR_MAX_REQUETE)
}

/** Mots utiles d'un texte : sans accents, en minuscules, au singulier, sans mots vides. */
export function motsUtiles(texte: string): readonly string[] {
  return normaliser(texte)
    .split(SEPARATEURS)
    .filter((mot) => mot !== '' && !MOTS_VIDES.has(mot))
    .map(auSingulier)
}

/** Vrai si un mot de la requête décrit un symptôme (« grince », « voyant », « fuit »). */
export function ressembleAUnSymptome(requete: string): boolean {
  return normaliser(nettoyerRequete(requete))
    .split(SEPARATEURS)
    .some((mot) => MOTS_SYMPTOME.has(mot) || DEBUTS_SYMPTOME.some((debut) => mot.startsWith(debut)))
}

export function rechercherFamilles(
  familles: readonly FamillePubliee[],
  requete: string,
): ResultatRecherche {
  const symptome = ressembleAUnSymptome(requete)
  const mots = motsUtiles(nettoyerRequete(requete))
  if (mots.length === 0) return { familles: [], symptome }
  const entiere = mots.join(' ')
  const evaluees = familles.flatMap((famille, rang) => {
    const evaluation = evaluer(famille, mots, entiere)
    return evaluation === null ? [] : [{ ...evaluation, famille, rang }]
  })
  const meilleurNombre = Math.max(0, ...evaluees.map((e) => e.motsTrouves))
  const plusCompletes = evaluees.filter((e) => e.motsTrouves === meilleurNombre)
  const designees = plusCompletes.filter((e) => e.termeEntier)
  const retenues = (designees.length > 0 ? designees : plusCompletes).sort(
    (a, b) => b.score - a.score || a.rang - b.rang,
  )
  return {
    familles: retenues.map(({ famille, motCourant }) => ({ famille, motCourant })),
    symptome,
  }
}

interface Evaluation {
  readonly motsTrouves: number
  readonly score: number
  /** La requête entière est l'un des termes de la famille. */
  readonly termeEntier: boolean
  readonly motCourant: string | null
}

function evaluer(
  famille: FamillePubliee,
  mots: readonly string[],
  entiere: string,
): Evaluation | null {
  const termes = termesDe(famille)
  let motsTrouves = 0
  let score = 0
  const poidsParTerme = new Map<Terme, number>()
  for (const mot of mots) {
    let meilleur = 0
    let termeRetenu: Terme | null = null
    for (const terme of termes) {
      const poids = POIDS_CHAMP[terme.champ] * correspondance(mot, terme.mots)
      if (poids > meilleur) {
        meilleur = poids
        termeRetenu = terme
      }
    }
    if (termeRetenu === null) continue
    motsTrouves += 1
    score += meilleur
    poidsParTerme.set(termeRetenu, (poidsParTerme.get(termeRetenu) ?? 0) + meilleur)
  }
  if (motsTrouves === 0) return null
  let termeEntier = false
  for (const terme of termes) {
    if (terme.entier === entiere) {
      termeEntier = true
      score += BONUS_TERME_ENTIER
      poidsParTerme.set(terme, (poidsParTerme.get(terme) ?? 0) + BONUS_TERME_ENTIER)
    }
  }
  return { motsTrouves, score, termeEntier, motCourant: motCourantDecisif(poidsParTerme) }
}

/** Le mot courant qui a pesé le plus ; aucun si le nom ou un synonyme pèse autant ou plus. */
function motCourantDecisif(poidsParTerme: ReadonlyMap<Terme, number>): string | null {
  let meilleur: Terme | null = null
  let poidsMeilleur = 0
  for (const [terme, poids] of poidsParTerme) {
    if (poids > poidsMeilleur) {
      meilleur = terme
      poidsMeilleur = poids
    }
  }
  return meilleur !== null && meilleur.champ === 'motCourant' ? meilleur.texte : null
}

function termesDe(famille: FamillePubliee): readonly Terme[] {
  const terme = (champ: Champ, texte: string): Terme => {
    const mots = motsUtiles(texte)
    return { champ, texte, mots, entier: mots.join(' ') }
  }
  return [
    terme('libelle', famille.libelle),
    ...famille.motsCourants.map((mot) => terme('motCourant', mot)),
    ...famille.synonymes.map((mot) => terme('synonyme', mot)),
  ]
}

/** Qualité de la meilleure correspondance d'un mot de la requête avec les mots d'un terme. */
function correspondance(mot: string, motsDuTerme: readonly string[]): number {
  let meilleure = 0
  for (const candidat of motsDuTerme) {
    if (candidat === mot) return POIDS_CORRESPONDANCE.exacte
    if (mot.length >= PREFIXE_MIN && candidat.startsWith(mot)) {
      meilleure = Math.max(meilleure, POIDS_CORRESPONDANCE.debut)
    } else if (mot.length >= TOLERANCE_MIN && distanceAuPlusUn(mot, candidat)) {
      meilleure = Math.max(meilleure, POIDS_CORRESPONDANCE.approchee)
    }
  }
  return meilleure
}

/** Pluriel régulier retiré : « plaquettes », « pneus », « phares », « eaux ». */
function auSingulier(mot: string): string {
  if (mot.length >= LONGUEUR_MIN_PLURIEL && /[sx]$/.test(mot) && !mot.endsWith('ss')) {
    return mot.slice(0, -1)
  }
  return mot
}

/** Vrai si une seule lettre diffère, manque ou est en trop (distance d'édition au plus 1). */
export function distanceAuPlusUn(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  const [court, long] = a.length <= b.length ? [a, b] : [b, a]
  let i = 0
  let j = 0
  let ecarts = 0
  while (i < court.length && j < long.length) {
    if (court[i] === long[j]) {
      i += 1
      j += 1
      continue
    }
    ecarts += 1
    if (ecarts > 1) return false
    if (court.length === long.length) i += 1
    j += 1
  }
  return ecarts + (long.length - j) + (court.length - i) <= 1
}

/**
 * Typographie française appliquée par la couche web à chaque page rendue. Un
 * seul endroit, si bien que les textes des vues comme ceux des données
 * (catalogue, arbre, garage, demandes) en bénéficient sans que chacun ait à y
 * penser :
 * - une espace insécable avant « : », « ? » et « ! », pour qu'aucun de ces
 *   signes ne commence une ligne sur un écran étroit ;
 * - une heure se lit d'un bloc : « 19 h », « 10 h 05 » ;
 * - un nombre ne quitte pas son unité : « 12 € », « 5 km », « 1 200 km »
 *   (les groupes de milliers restent ensemble), « 2,5 bar ».
 *
 * Seuls les nœuds de texte sont touchés : jamais une balise ni un attribut (une
 * adresse, une valeur de champ), jamais le contenu d'un élément `script`,
 * `style`, `textarea` ou `pre` (données structurées, texte saisi par le client).
 * Idempotente : un texte déjà composé ne change plus.
 */

const ESPACE_INSECABLE = ' '
/** Une espace ordinaire avant l'un des trois signes. */
const ESPACE_AVANT_SIGNE = / ([:?!])/g
/** Ce qui n'est pas du texte à composer : éléments préservés, commentaires et balises. */
const HORS_TEXTE = /<(script|style|textarea|pre)\b[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<[^>]*>/gi

/**
 * Unités et symboles qu'un nombre ne quitte pas, les plus longs d'abord. Liste
 * fermée : une lettre isolée ambiguë (« A », « s ») n'y figure pas, pour ne
 * pas lier par erreur une immatriculation (« 7 A 972 ») ou une abréviation.
 */
export const UNITES_LIEES = [
  'km/h',
  'km',
  'cm',
  'mm',
  'm',
  'kg',
  'g',
  'ml',
  'cl',
  'l',
  'L',
  'min',
  'h',
  'ch',
  'kW',
  'W',
  'Ah',
  'V',
  'bar',
  '°C',
  '€',
  '%',
] as const

/** Ni lettre ni chiffre collé : « 5 kmh » ou « 5 hommes » ne sont pas des unités. */
const FRONTIERE = '(?![\\p{L}\\p{N}])'
/** Le nombre ne prolonge pas un mot ou un autre nombre : « A4 m », « 1,5 » lu en entier. */
const DEBUT_DE_NOMBRE = '(?<![\\p{L}\\p{N},])'
/** « 12 », « 2,5 », « 1 200 » ou « 1 200,50 » : les milliers groupés par trois. */
const NOMBRE = '\\d{1,3}(?:[ \\u00a0\\u202f]\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?'
const echapper = (unite: string): string => unite.replace(/[/]/g, '\\/')

/** « 10 h 05 » : l'heure et ses minutes (l'heure seule, « 19 h », est une unité). */
const HEURE_ET_MINUTES = new RegExp(`${DEBUT_DE_NOMBRE}(\\d{1,2}) h (\\d{2})${FRONTIERE}`, 'gu')
/** Un nombre, une espace ordinaire, puis une unité de la liste. */
const NOMBRE_ET_UNITE = new RegExp(
  `${DEBUT_DE_NOMBRE}(${NOMBRE}) (${UNITES_LIEES.map(echapper).join('|')})${FRONTIERE}`,
  'gu',
)
/** Espace ordinaire entre deux groupes de chiffres d'un même nombre. */
const ESPACE_DE_MILLIERS = / (?=\d{3})/g

/** Un texte seul, sans balise : « : », « ? » et « ! » liés au mot qui les précède. */
export function lierLesSignes(texte: string): string {
  return texte.replace(ESPACE_AVANT_SIGNE, `${ESPACE_INSECABLE}$1`)
}

/** Un texte seul : « 10 h 05 », « 19 h », « 12 € », « 1 200 km » ne se coupent plus. */
export function lierLesNombres(texte: string): string {
  return texte
    .replace(
      HEURE_ET_MINUTES,
      (_heure, heures: string, minutes: string) =>
        `${heures}${ESPACE_INSECABLE}h${ESPACE_INSECABLE}${minutes}`,
    )
    .replace(
      NOMBRE_ET_UNITE,
      (_mesure, nombre: string, unite: string) =>
        `${nombre.replace(ESPACE_DE_MILLIERS, ESPACE_INSECABLE)}${ESPACE_INSECABLE}${unite}`,
    )
}

/** Toutes les règles, sur un texte seul, sans balise. */
export function composerTexte(texte: string): string {
  return lierLesNombres(lierLesSignes(texte))
}

/** Une page HTML complète : seuls ses nœuds de texte sont composés. */
export function composerTypographie(page: string): string {
  let resultat = ''
  let position = 0
  for (const trouve of page.matchAll(HORS_TEXTE)) {
    const debut = trouve.index
    resultat += composerTexte(page.slice(position, debut)) + trouve[0]
    position = debut + trouve[0].length
  }
  return resultat + composerTexte(page.slice(position))
}

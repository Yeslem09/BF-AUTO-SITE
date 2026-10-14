/**
 * Texte d'une réponse sans la citation ni la signature, et commande qu'il
 * porte (Kano connecteurs, C5). Les réponses de Gmail, Outlook et Apple Mail
 * citent le message d'origine sous la réponse ; on garde ce qui précède.
 */
import type { CommandeReponse } from './ports.js'

export interface CorpsRecu {
  /** Partie texte brut, si le message en a une. */
  readonly texte: string | null
  /** Partie HTML, utilisée seulement sans partie texte. */
  readonly html: string | null
}

/** Longueur gardée : une commande tient en un mot, le reste n'est qu'indicatif. */
export const LONGUEUR_MAX_REPONSE = 500

const ESPACES_INSECABLES = /[\u00a0\u202f\u2007]/g
/**
 * Attribution de la citation : « Le mer. 23 sept. 2026 à 10:12, BF Auto <x@y> a écrit : »
 * ou « On ..., X wrote: », parfois coupée sur deux ou trois lignes par Gmail.
 */
const FIN_ATTRIBUTION = /(a écrit|wrote)\s*:\s*$/i
const DEBUT_ATTRIBUTION = /^\s*(le|on)\s/i
const LIGNES_ATTRIBUTION_MAX = 3
const LIGNE_CITEE = /^\s*>/
const SEPARATEUR_OUTLOOK = /^\s*_{10,}\s*$/
const MESSAGE_D_ORIGINE =
  /^\s*-{2,}\s*(message d'origine|message d’origine|original message|message transféré|forwarded message)/i
/** Bloc d'en-têtes d'Outlook : « De : » suivi, à quelques lignes, de « Envoyé : » ou « Date : ». */
const ENTETE_DE = /^\s*\*?(de|from)\s*:\s*\*?/i
const ENTETE_ENVOYE = /^\s*\*?(envoyé|envoye|sent|date)\s*:/i
const LIGNES_ENTETE_OUTLOOK = 4
const DELIMITEUR_SIGNATURE = /^--\s?$/
const SIGNATURES_MOBILES = [
  /^\s*(envoyé|envoye|sent)\s+(de|depuis|à partir de|a partir de|from)\s/i,
  /^\s*(obtenir|obtenez|télécharger|get)\s+outlook\b/i,
]
const RETOURS = /\r\n?/g
const LIGNE_VIDE = /^\s*$/

export function extraireReponse(corps: CorpsRecu): string {
  const brut = corps.texte ?? (corps.html === null ? '' : texteDepuisHtml(corps.html))
  const lignes = brut.replace(RETOURS, '\n').replace(ESPACES_INSECABLES, ' ').split('\n')
  const gardees: string[] = []
  for (const ligne of lignes.slice(0, debutDeCitation(lignes))) {
    if (DELIMITEUR_SIGNATURE.test(ligne)) break
    if (SIGNATURES_MOBILES.some((motif) => motif.test(ligne))) continue
    gardees.push(ligne.trimEnd())
  }
  const texte = gardees.join('\n').trim()
  return texte.length > LONGUEUR_MAX_REPONSE ? texte.slice(0, LONGUEUR_MAX_REPONSE) : texte
}

/** Index de la première ligne de la citation ; la longueur du texte s'il n'y en a pas. */
function debutDeCitation(lignes: readonly string[]): number {
  for (let index = 0; index < lignes.length; index += 1) {
    const ligne = lignes[index] ?? ''
    if (LIGNE_CITEE.test(ligne) || SEPARATEUR_OUTLOOK.test(ligne)) return index
    if (MESSAGE_D_ORIGINE.test(ligne)) return index
    if (ENTETE_DE.test(ligne)) {
      const suivantes = lignes.slice(index + 1, index + 1 + LIGNES_ENTETE_OUTLOOK)
      if (suivantes.some((suivante) => ENTETE_ENVOYE.test(suivante))) return index
    }
    if (FIN_ATTRIBUTION.test(ligne)) {
      const debut = debutAttribution(lignes, index)
      if (debut !== null) return debut
    }
  }
  return lignes.length
}

/** Première ligne de l'attribution qui finit à `fin` : la plus proche qui commence par « Le » ou « On ». */
function debutAttribution(lignes: readonly string[], fin: number): number | null {
  for (let index = fin; index > fin - LIGNES_ATTRIBUTION_MAX && index >= 0; index -= 1) {
    const ligne = lignes[index] ?? ''
    if (LIGNE_VIDE.test(ligne)) return null
    if (DEBUT_ATTRIBUTION.test(ligne)) return index
  }
  return null
}

/** Début de la citation dans le HTML des clients courants : tout ce qui suit est coupé. */
const MARQUES_CITATION_HTML = [
  /<div[^>]*class="[^"]*gmail_quote/i,
  /<div[^>]*id="?divRplyFwdMsg/i,
  /<div[^>]*id="?appendonsend/i,
  /<blockquote/i,
  /<hr[\s/>]/i,
  /<div[^>]*class="[^"]*moz-cite-prefix/i,
]
const BLOCS_MUETS = /<(head|style|script)[\s>][\s\S]*?<\/\1>/gi
const FINS_DE_BLOC = /<(br\s*\/?|\/p|\/div|\/li|\/tr|\/h[1-6])\s*>/gi
const BALISES = /<[^>]+>/g
const ENTITES_NOMMEES: Readonly<Record<string, string>> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}
const ENTITE = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi
const BASE_HEXADECIMALE = 16
const BASE_DECIMALE = 10
const DERNIER_POINT_DE_CODE = 0x10ffff

/** Conversion volontairement simple : une réponse de commande tient en quelques mots. */
export function texteDepuisHtml(html: string): string {
  const debutCitation = Math.min(
    ...MARQUES_CITATION_HTML.map((marque) => html.search(marque)).filter(
      (position) => position >= 0,
    ),
    html.length,
  )
  return html
    .slice(0, debutCitation)
    .replace(BLOCS_MUETS, '')
    .replace(FINS_DE_BLOC, '\n')
    .replace(BALISES, '')
    .replace(ENTITE, (entite: string, nom: string) => decoderEntite(nom) ?? entite)
}

function decoderEntite(nom: string): string | null {
  const minuscule = nom.toLowerCase()
  if (minuscule.startsWith('#')) {
    const hexadecimal = minuscule.startsWith('#x')
    const code = Number.parseInt(
      minuscule.slice(hexadecimal ? 2 : 1),
      hexadecimal ? BASE_HEXADECIMALE : BASE_DECIMALE,
    )
    return Number.isInteger(code) && code >= 0 && code <= DERNIER_POINT_DE_CODE
      ? String.fromCodePoint(code)
      : null
  }
  return ENTITES_NOMMEES[minuscule] ?? null
}

/**
 * Formes admises, casse, accents, espaces et ponctuation ignorés : « fait »,
 * « rappelé », « traité » et leurs féminins. Tout autre texte n'est pas une
 * commande ; une question (« fait ? ») non plus.
 */
const FORMES_COMMANDE: ReadonlySet<string> = new Set([
  'fait',
  'faite',
  'rappele',
  'rappelee',
  'traite',
  'traitee',
])
const DIACRITIQUES = /\p{M}/gu
const PONCTUATION_IGNOREE = /[.!;,:«»"“”'’\s]+/g
const QUESTION = '?'

export function reconnaitreCommande(texte: string): CommandeReponse | null {
  if (texte.includes(QUESTION)) return null
  const normalise = texte
    .normalize('NFD')
    .replace(DIACRITIQUES, '')
    .toLowerCase()
    .replace(PONCTUATION_IGNOREE, ' ')
    .trim()
  return FORMES_COMMANDE.has(normalise) ? 'marquer-traitee' : null
}

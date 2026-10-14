/**
 * Texte d'un SMS dans l'alphabet GSM 7 bits (3GPP TS 23.038) : 160
 * caractères par SMS au lieu de 70 en Unicode. Un seul signe hors alphabet
 * (une apostrophe typographique) ferait passer tout le message en Unicode
 * et tripler son coût sans que personne le voie (Kano connecteurs, C6, AEC-12).
 */
import { ErreurConnecteur } from '../erreurs.js'

const ALPHABET_GSM =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
/** Caractères de l'extension GSM : deux septets chacun. */
const EXTENSION_GSM = '^{}\\[~]|€\f'
const CARACTERES_GSM: ReadonlySet<string> = new Set(ALPHABET_GSM)
const CARACTERES_EXTENSION: ReadonlySet<string> = new Set(EXTENSION_GSM)

/** Classe de caractères construite par points de code : aucun caractère invisible dans le source. */
const classe = (...codes: readonly number[]): RegExp =>
  new RegExp(`[${codes.map((code) => String.fromCodePoint(code)).join('')}]`, 'g')

/** Remplacements typographiques vers leur équivalent GSM. */
const REMPLACEMENTS: readonly (readonly [RegExp, string])[] = [
  [classe(0x2018, 0x2019, 0x02bc, 0x2032), "'"],
  [classe(0x00ab, 0x00bb, 0x201c, 0x201d, 0x201e, 0x2033), '"'],
  [classe(0x00a0, 0x202f, 0x2009, 0x2007), ' '],
  [classe(0x2026), '...'],
  [classe(0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2212), '-'],
  [classe(0x0153), 'oe'],
  [classe(0x0152), 'OE'],
]
const DIACRITIQUES = /\p{M}/gu
const CARACTERE_INCONNU = '?'

export const SEPTETS_SMS_SIMPLE = 160
/** Au-delà d'un SMS, chaque segment perd 7 septets pour l'en-tête de concaténation. */
export const SEPTETS_PAR_SEGMENT = 153
/** Plafond : un message plus long est une erreur de rédaction, gardée par un test (PC-04). */
export const SEGMENTS_MAX = 2

export interface TexteSms {
  readonly texte: string
  readonly segments: number
}

/** Ramène un texte dans l'alphabet GSM : signes typographiques remplacés, accents hors alphabet retirés. */
export function versAlphabetGsm(texte: string): string {
  const remplace = REMPLACEMENTS.reduce(
    (courant, [motif, remplacement]) => courant.replace(motif, remplacement),
    texte,
  )
  let resultat = ''
  for (const caractere of remplace) {
    if (CARACTERES_GSM.has(caractere) || CARACTERES_EXTENSION.has(caractere)) {
      resultat += caractere
      continue
    }
    const base = caractere.normalize('NFD').replace(DIACRITIQUES, '')
    resultat +=
      [...base].every((lettre) => CARACTERES_GSM.has(lettre)) && base !== ''
        ? base
        : CARACTERE_INCONNU
  }
  return resultat
}

export function compterSegments(texteGsm: string): number {
  let septets = 0
  for (const caractere of texteGsm) septets += CARACTERES_EXTENSION.has(caractere) ? 2 : 1
  return septets <= SEPTETS_SMS_SIMPLE ? 1 : Math.ceil(septets / SEPTETS_PAR_SEGMENT)
}

/** Texte prêt à partir, ou refus avant tout appel réseau s'il dépasse le plafond. */
export function preparerTexteSms(texte: string): TexteSms {
  const gsm = versAlphabetGsm(texte.trim())
  const segments = compterSegments(gsm)
  if (gsm === '') {
    throw new ErreurConnecteur('SMS', 'configuration', 'Texte vide', 'Rédiger un texte de SMS.')
  }
  if (segments > SEGMENTS_MAX) {
    throw new ErreurConnecteur(
      'SMS',
      'configuration',
      `Texte de ${segments} SMS, ${SEGMENTS_MAX} au plus`,
      'Raccourcir le message : le détail de la demande est dans le courriel.',
    )
  }
  return { texte: gsm, segments }
}

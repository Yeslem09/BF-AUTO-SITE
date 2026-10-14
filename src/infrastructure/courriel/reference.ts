/**
 * Référence d'une demande dans les courriels (Kano connecteurs, C3) :
 * « BF- » puis 6 caractères de l'alphabet de Crockford (sans I, L, O, U),
 * tirés au hasard : environ un milliard de valeurs, ni séquentielle ni
 * devinable (AE-40), lisible au téléphone. Elle relie une réponse ou un
 * rapport de non-remise à sa demande sans rien lire d'autre.
 */
import { randomInt } from 'node:crypto'
import {
  ALPHABET_REFERENCE_DEMANDE as ALPHABET_CROCKFORD,
  LONGUEUR_CODE_REFERENCE_DEMANDE as LONGUEUR_CODE,
  PREFIXE_REFERENCE_DEMANDE as PREFIXE_REFERENCE,
} from '../../contrats/index.js'

export { PREFIXE_REFERENCE }
/** Rang d'un courriel dans le fil d'une demande : 1 la notification, 2 la relance... */
export const RANG_MAX = 99

const CODE = `${PREFIXE_REFERENCE}-[0-9A-HJKMNP-TV-Z]{${LONGUEUR_CODE}}`
const REFERENCE_EXACTE = new RegExp(`^${CODE}$`)
/** Référence entre crochets, telle qu'elle figure dans un objet (y compris après « Re : »). */
const REFERENCE_DANS_OBJET = new RegExp(`\\[(${CODE})\\]`, 'gi')
/** Identifiant de message du site : `<BF-XXXXXX.<rang>@domaine>`. */
const IDENTIFIANT_DU_SITE = new RegExp(`<(${CODE})\\.(\\d{1,2})@[^<>\\s]+>`, 'gi')

/** Tire un entier dans [0, borne[ ; le générateur cryptographique par défaut. */
export type TirageAleatoire = (borneExclue: number) => number

export function genererReference(tirer: TirageAleatoire = randomInt): string {
  let code = ''
  for (let rang = 0; rang < LONGUEUR_CODE; rang += 1) {
    code += ALPHABET_CROCKFORD[tirer(ALPHABET_CROCKFORD.length)] ?? ''
  }
  return `${PREFIXE_REFERENCE}-${code}`
}

export function estReference(texte: string): boolean {
  return REFERENCE_EXACTE.test(texte)
}

/** Objet suivi de la référence entre crochets, en fin d'objet : l'urgence reste lisible en tête. */
export function objetAvecReference(objet: string, reference: string): string {
  verifierReference(reference)
  const marque = `[${reference}]`
  return objet.includes(marque) ? objet : `${objet} ${marque}`
}

export function identifiantMessage(reference: string, rang: number, domaine: string): string {
  verifierReference(reference)
  if (!Number.isInteger(rang) || rang < 1 || rang > RANG_MAX) {
    throw new RangeError(`Rang de courriel ${rang} : entier de 1 à ${RANG_MAX} attendu`)
  }
  return `<${reference}.${rang}@${domaine}>`
}

/** Vrai si l'identifiant de message a été produit par le site (sa propre notification). */
export function estIdentifiantDuSite(identifiant: string | null): boolean {
  return identifiant !== null && referencesDansIdentifiants(identifiant).length > 0
}

export function referencesDansObjet(objet: string | null): string[] {
  if (objet === null) return []
  return uniques([...objet.matchAll(REFERENCE_DANS_OBJET)].map((trouve) => trouve[1] ?? ''))
}

/** Références portées par des identifiants de message (`Message-ID`, `In-Reply-To`, `References`). */
export function referencesDansIdentifiants(texte: string | null): string[] {
  if (texte === null) return []
  return uniques([...texte.matchAll(IDENTIFIANT_DU_SITE)].map((trouve) => trouve[1] ?? ''))
}

/** Domaine d'une adresse, pour le côté droit de l'identifiant de message. */
export function domaineDe(adresse: string): string {
  const arobase = adresse.lastIndexOf('@')
  return arobase < 0 ? adresse : adresse.slice(arobase + 1).toLowerCase()
}

function uniques(references: readonly string[]): string[] {
  return [
    ...new Set(references.filter((reference) => reference !== '').map((r) => r.toUpperCase())),
  ]
}

function verifierReference(reference: string): void {
  if (!estReference(reference)) {
    throw new RangeError(`Référence « ${reference} » mal formée (${PREFIXE_REFERENCE}-XXXXXX)`)
  }
}

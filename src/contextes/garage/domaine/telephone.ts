import type { TelephonePublic } from '../../../contrats/index.js'

const SEPARATEURS_ADMIS = /[\s.-]/g
/** Numéro national : 0 puis un chiffre de 1 à 9, puis 8 chiffres. */
const FORMAT_NATIONAL = /^0([1-9]\d{8})$/
/** Numéro international : +33 ou 0033, sans le 0 initial. */
const FORMAT_INTERNATIONAL = /^(?:\+33|0033)([1-9]\d{8})$/
const INDICATIF_FRANCE = '+33'
const PAIRES_DE_CHIFFRES = /\d{2}/g

/**
 * Normalise un numéro français (fixe ou mobile, métropole ou outre-mer) en une
 * forme affichable par paires et un lien d'appel international.
 * `null` si le texte n'est pas un numéro français.
 */
export function normaliserTelephone(texte: string): TelephonePublic | null {
  const compact = texte.replace(SEPARATEURS_ADMIS, '')
  const significatif =
    FORMAT_NATIONAL.exec(compact)?.[1] ?? FORMAT_INTERNATIONAL.exec(compact)?.[1] ?? null
  if (significatif === null) return null
  const national = `0${significatif}`
  return {
    affichable: (national.match(PAIRES_DE_CHIFFRES) ?? []).join(' '),
    lien: `tel:${INDICATIF_FRANCE}${significatif}`,
  }
}

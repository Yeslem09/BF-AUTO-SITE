import type { TelephonePublic } from '../../../contrats/index.js'

const SEPARATEURS_ADMIS = /[\s.()-]/g
/** Numéro national : 0 puis un chiffre de 1 à 9, puis 8 chiffres. */
const FORMAT_NATIONAL = /^0([1-9]\d{8})$/
/** Numéro international : +33 ou 0033, avec ou sans le 0 national entre parenthèses. */
const FORMAT_INTERNATIONAL = /^(?:\+33|0033)0?([1-9]\d{8})$/
const INDICATIF_FRANCE = '+33'
const PAIRES_DE_CHIFFRES = /\d{2}/g

/**
 * Normalise le téléphone saisi par un client : numéro français, fixe ou
 * mobile, métropole ou outre-mer, quelle que soit la façon de l'écrire
 * (espaces, points, tirets, +33, 0033). `null` si ce n'est pas un numéro
 * français : le garage rappelle, il lui faut un numéro qu'il sait composer.
 */
export function normaliserTelephoneClient(saisie: string): TelephonePublic | null {
  const compact = saisie.trim().replace(SEPARATEURS_ADMIS, '')
  const significatif =
    FORMAT_NATIONAL.exec(compact)?.[1] ?? FORMAT_INTERNATIONAL.exec(compact)?.[1] ?? null
  if (significatif === null) return null
  const national = `0${significatif}`
  return {
    affichable: (national.match(PAIRES_DE_CHIFFRES) ?? []).join(' '),
    lien: `tel:${INDICATIF_FRANCE}${significatif}`,
  }
}

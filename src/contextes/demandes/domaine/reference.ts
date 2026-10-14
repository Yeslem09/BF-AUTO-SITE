import {
  ALPHABET_REFERENCE_DEMANDE,
  LONGUEUR_CODE_REFERENCE_DEMANDE,
  PREFIXE_REFERENCE_DEMANDE,
} from '../../../contrats/index.js'

/** Bits portés par un caractère de l'alphabet de Crockford (32 signes). */
const BITS_PAR_CARACTERE = 5
const CHIFFRES_HEXADECIMAUX = /[0-9a-f]/gi
const MASQUE_CARACTERE = 0b11111
const BITS_PAR_CHIFFRE_HEXADECIMAL = 4

/**
 * Référence d'une demande dans les courriels (Kano connecteurs, C3), tirée
 * de son identifiant aléatoire : 30 bits d'aléa, jamais séquentielle ni
 * devinable (AE-40), stable sans rien stocker. `BF-7K3Q9D`.
 */
export function referenceDeDemande(id: string): string {
  const hexadecimal = (id.match(CHIFFRES_HEXADECIMAUX) ?? []).join('')
  const bitsUtiles = LONGUEUR_CODE_REFERENCE_DEMANDE * BITS_PAR_CARACTERE
  const chiffresUtiles = Math.ceil(bitsUtiles / BITS_PAR_CHIFFRE_HEXADECIMAL)
  let valeur = BigInt(`0x${hexadecimal.slice(0, chiffresUtiles).padEnd(chiffresUtiles, '0')}`)
  valeur >>= BigInt(chiffresUtiles * BITS_PAR_CHIFFRE_HEXADECIMAL - bitsUtiles)
  let code = ''
  for (let rang = 0; rang < LONGUEUR_CODE_REFERENCE_DEMANDE; rang += 1) {
    const indice = Number(valeur & BigInt(MASQUE_CARACTERE))
    code = `${ALPHABET_REFERENCE_DEMANDE[indice] ?? ''}${code}`
    valeur >>= BigInt(BITS_PAR_CARACTERE)
  }
  return `${PREFIXE_REFERENCE_DEMANDE}-${code}`
}

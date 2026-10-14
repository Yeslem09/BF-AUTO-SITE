/**
 * Plaque d'immatriculation française, dans ses deux formats en circulation :
 * - SIV (depuis 2009) : deux lettres, trois chiffres, deux lettres, « AB-123-CD » ;
 * - FNI (ancien format) : un à quatre chiffres, une à trois lettres, puis le
 *   département (deux chiffres, 2A, 2B ou 971 à 976), « 1234 AB 56 ».
 * La saisie est tolérante (minuscules, espaces, tirets, points), la forme
 * enregistrée est unique.
 */

const SEPARATEURS = /[\s.-]/g
const FORMAT_SIV = /^([A-Z]{2})(\d{3})([A-Z]{2})$/
const FORMAT_FNI = /^(\d{1,4})([A-Z]{1,3})(\d{2}|97[1-6]|2[AB])$/

export const EXEMPLE_PLAQUE_SIV = 'AB-123-CD'
export const EXEMPLE_PLAQUE_FNI = '1234 AB 56'

/** Forme normalisée de la plaque, ou `null` si la saisie n'est dans aucun des deux formats. */
export function normaliserPlaque(saisie: string): string | null {
  const compacte = saisie.trim().toUpperCase().replace(SEPARATEURS, '')
  const siv = FORMAT_SIV.exec(compacte)
  if (siv) return `${siv[1]}-${siv[2]}-${siv[3]}`
  const fni = FORMAT_FNI.exec(compacte)
  if (fni) return `${fni[1]} ${fni[2]} ${fni[3]}`
  return null
}

/**
 * Numéro de mobile qui reçoit les SMS, au format international E.164. Un
 * numéro fixe français est refusé : un SMS n'y arrive pas (Kano connecteurs, C6).
 */

export type LectureNumero =
  | { readonly valide: true; readonly international: string }
  | { readonly valide: false; readonly raison: string }

const SEPARATEURS = /[\s.()-]/g
const NATIONAL_FRANCAIS = /^0(\d{9})$/
const FRANCAIS_INTERNATIONAL = /^(?:\+33|0033)0?(\d{9})$/
const MOBILE_FRANCAIS = /^[67]\d{8}$/
const INTERNATIONAL = /^(?:\+|00)([1-9]\d{7,14})$/
const INDICATIF_FRANCE = '+33'

export function lireNumeroMobile(saisie: string): LectureNumero {
  const compact = saisie.trim().replace(SEPARATEURS, '')
  const francais = NATIONAL_FRANCAIS.exec(compact)?.[1] ?? FRANCAIS_INTERNATIONAL.exec(compact)?.[1]
  if (francais !== undefined) {
    return MOBILE_FRANCAIS.test(francais)
      ? { valide: true, international: `${INDICATIF_FRANCE}${francais}` }
      : { valide: false, raison: 'numéro fixe : un SMS n’y arrive pas, il faut un 06 ou un 07' }
  }
  const etranger = INTERNATIONAL.exec(compact)?.[1]
  if (etranger !== undefined) return { valide: true, international: `+${etranger}` }
  return { valide: false, raison: 'numéro de téléphone attendu (06 12 34 56 78 ou +33612345678)' }
}

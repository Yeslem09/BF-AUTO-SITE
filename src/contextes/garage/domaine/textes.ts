import type { MoyenPaiement } from './garage.js'

/** Engagements du socle de confiance (Kano D6), écrits une fois pour tout le site. */
export const ENGAGEMENTS = {
  devisEcrit: 'Devis écrit avant travaux',
  appelAvantSupplement: 'Nous vous appelons avant tout travail supplémentaire',
  piecesRestituees: 'Pièces remplacées restituées sur demande',
} as const

const LIBELLES_PAIEMENT: Readonly<Record<MoyenPaiement, string>> = {
  carte: 'carte bancaire',
  especes: 'espèces',
  cheque: 'chèque',
  virement: 'virement',
}

/** « carte bancaire, espèces ou chèque ». */
export function listerMoyensPaiement(moyens: readonly MoyenPaiement[]): string {
  const libelles = moyens.map((moyen) => LIBELLES_PAIEMENT[moyen])
  const dernier = libelles.at(-1) ?? ''
  return libelles.length <= 1 ? dernier : `${libelles.slice(0, -1).join(', ')} ou ${dernier}`
}

const ESPACE_INSECABLE = '\u00a0'

/** « BF Auto » entre guillemets français, jamais coupés de leur texte en fin de ligne. */
export function entreGuillemets(texte: string): string {
  return `«${ESPACE_INSECABLE}${texte}${ESPACE_INSECABLE}»`
}

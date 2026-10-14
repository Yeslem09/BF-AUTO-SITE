import { jourDeLaSemaine, type DateCalendaire } from './temps-local.js'

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const

const PREMIER_DU_MOIS = 1

/** « 1er » pour le premier jour du mois, le nombre sinon. */
function quantieme(jour: number): string {
  return jour === PREMIER_DU_MOIS ? '1er' : String(jour)
}

export interface OptionsDate {
  /** « 2026 » en fin de date. */
  readonly annee?: boolean
  /** « jeudi » en tête de date (par défaut). */
  readonly jourDeSemaine?: boolean
}

/** « jeudi 8 octobre », « jeudi 8 octobre 2026 », « 1er octobre 2026 ». */
export function dateEnLettres(
  date: DateCalendaire,
  { annee = false, jourDeSemaine = true }: OptionsDate = {},
): string {
  const parties = [
    ...(jourDeSemaine ? [jourDeLaSemaine(date)] : []),
    quantieme(date.jour),
    MOIS[date.mois - 1] ?? '',
    ...(annee ? [String(date.annee)] : []),
  ]
  return parties.join(' ')
}

export function majusculeInitiale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

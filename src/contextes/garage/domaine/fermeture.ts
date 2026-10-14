import { dateEnLettres } from './dates-francaises.js'
import { comparerDates, ecartEnJours, lireDateIso, type DateCalendaire } from './temps-local.js'

/** Motifs d'une fermeture exceptionnelle, choisis dans une liste (Kano D5). */
export const MOTIFS_FERMETURE = ['conges', 'jour-ferie', 'imprevu'] as const

export type MotifFermeture = (typeof MOTIFS_FERMETURE)[number]

export const LIBELLES_MOTIF: Readonly<Record<MotifFermeture, string>> = {
  conges: 'Congés',
  'jour-ferie': 'Jour férié',
  imprevu: 'Imprévu',
}

/** Jours fermés du `du` au `au` inclus, tous deux à l'heure de Paris. */
export interface PeriodeFermeture {
  readonly du: DateCalendaire
  readonly au: DateCalendaire
  readonly motif: MotifFermeture
}

/** Fermeture enregistrée : la période et son identifiant de stockage. */
export interface Fermeture extends PeriodeFermeture {
  readonly identifiant: number
}

/** Au-delà, une faute de frappe (2062 pour 2026) est plus probable qu'une vraie fermeture. */
export const DUREE_MAX_JOURS = 92
/** On ne déclare pas une fermeture à plus d'un an. */
export const ANTICIPATION_MAX_JOURS = 366

export function estMotifFermeture(texte: string): texte is MotifFermeture {
  return (MOTIFS_FERMETURE as readonly string[]).includes(texte)
}

export function couvre(periode: PeriodeFermeture, date: DateCalendaire): boolean {
  return comparerDates(periode.du, date) <= 0 && comparerDates(date, periode.au) <= 0
}

export function chevauchent(a: PeriodeFermeture, b: PeriodeFermeture): boolean {
  return comparerDates(a.du, b.au) <= 0 && comparerDates(b.du, a.au) <= 0
}

/** Première fermeture qui couvre la date, ou `null`. */
export function fermetureCouvrant<P extends PeriodeFermeture>(
  fermetures: readonly P[],
  date: DateCalendaire,
): P | null {
  return fermetures.find((fermeture) => couvre(fermeture, date)) ?? null
}

/** « le jeudi 24 septembre » ou « du lundi 28 septembre au mercredi 7 octobre ». */
export function periodeEnLettres(periode: PeriodeFermeture, avecAnnee = false): string {
  const options = { annee: avecAnnee }
  if (comparerDates(periode.du, periode.au) === 0) {
    return `le ${dateEnLettres(periode.du, options)}`
  }
  return `du ${dateEnLettres(periode.du, options)} au ${dateEnLettres(periode.au, options)}`
}

export type ChampPeriode = 'du' | 'au' | 'motif'

export type ErreursPeriode = Partial<Record<ChampPeriode, string>>

export interface SaisiePeriode {
  readonly du: string
  readonly au: string
  readonly motif: string
}

export type LecturePeriode =
  | { readonly valide: true; readonly periode: PeriodeFermeture }
  | { readonly valide: false; readonly erreurs: ErreursPeriode }

/** « 24/09/2026 », « 24.09.2026 », « 24-09-2026 » ou « 24 09 2026 ». */
const FORMAT_DATE_FRANCAISE = /^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})$/
/** « 24092026 » : le clavier numérique du téléphone n'a pas de barre oblique. */
const FORMAT_DATE_CHIFFRES = /^(\d{2})(\d{2})(\d{4})$/

/** Date affichée dans un champ, toujours à la française, quelle que soit la langue du navigateur. */
export function dateSaisissable(date: DateCalendaire): string {
  const deux = (nombre: number) => String(nombre).padStart(2, '0')
  return `${deux(date.jour)}/${deux(date.mois)}/${date.annee}`
}

/**
 * Date saisie : « JJ/MM/AAAA » (le champ du site, J4, passe 2 du jury : jamais
 * le format du navigateur), ses variantes sans barre oblique, ou
 * « AAAA-MM-JJ ». `null` si elle n'existe pas au calendrier.
 */
export function lireDateSaisie(texte: string): DateCalendaire | null {
  const nettoye = texte.trim().replace(/\s+/g, ' ')
  const francaise = FORMAT_DATE_FRANCAISE.exec(nettoye) ?? FORMAT_DATE_CHIFFRES.exec(nettoye)
  if (!francaise) return lireDateIso(nettoye)
  const [, jour = '', mois = '', annee = ''] = francaise
  return lireDateIso(`${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`)
}

/**
 * Valide une période déclarée par le garagiste. Toutes les erreurs sont
 * rendues d'un coup, chacune rattachée à son champ.
 */
export function lirePeriode(saisie: SaisiePeriode, aujourdhui: DateCalendaire): LecturePeriode {
  const erreurs: ErreursPeriode = {}
  const du = lireDateObligatoire(saisie.du, 'Indiquez le premier jour de fermeture.')
  const au = lireDateObligatoire(saisie.au, 'Indiquez le dernier jour de fermeture.')
  const motif = estMotifFermeture(saisie.motif) ? saisie.motif : null

  if (!du.lue) erreurs.du = du.erreur
  else if (ecartEnJours(aujourdhui, du.date) > ANTICIPATION_MAX_JOURS) {
    erreurs.du = 'Déclarez une fermeture qui commence dans les douze prochains mois.'
  }
  if (!au.lue) erreurs.au = au.erreur
  else if (du.lue) {
    const erreurFin = verifierFin(du.date, au.date, aujourdhui)
    if (erreurFin !== null) erreurs.au = erreurFin
  }
  if (motif === null) erreurs.motif = 'Choisissez le motif dans la liste.'

  if (!du.lue || !au.lue || motif === null || Object.keys(erreurs).length > 0) {
    return { valide: false, erreurs }
  }
  return { valide: true, periode: { du: du.date, au: au.date, motif } }
}

type DateLue =
  | { readonly lue: true; readonly date: DateCalendaire }
  | { readonly lue: false; readonly erreur: string }

function lireDateObligatoire(texte: string, siVide: string): DateLue {
  if (texte.trim() === '') return { lue: false, erreur: siVide }
  const date = lireDateSaisie(texte)
  return date === null
    ? {
        lue: false,
        erreur: 'Date non reconnue : écrivez-la sous la forme jj/mm/aaaa, par exemple 24/09/2026.',
      }
    : { lue: true, date }
}

function verifierFin(
  du: DateCalendaire,
  au: DateCalendaire,
  aujourdhui: DateCalendaire,
): string | null {
  if (comparerDates(au, du) < 0) return 'Le dernier jour doit être le premier jour ou le suivre.'
  if (comparerDates(au, aujourdhui) < 0) return 'Cette période est déjà passée.'
  if (ecartEnJours(du, au) + 1 > DUREE_MAX_JOURS) {
    return `Une fermeture dure ${DUREE_MAX_JOURS} jours au plus : déclarez plusieurs périodes si besoin.`
  }
  return null
}

import { MINUTES_PAR_HEURE, type MinuteDuJour } from './heure.js'
import { jourDepuisIndexUtc, type JourSemaine } from './jours.js'

/** Le garage vit à l'heure de Paris, heure d'été comprise. */
export const FUSEAU_GARAGE = 'Europe/Paris'

const MILLISECONDES_PAR_JOUR = 86_400_000

/** Date du calendrier, sans heure ni fuseau. `mois` va de 1 à 12. */
export interface DateCalendaire {
  readonly annee: number
  readonly mois: number
  readonly jour: number
}

export interface InstantLocal {
  readonly date: DateCalendaire
  readonly minutes: MinuteDuJour
}

const lecteurParFuseau = new Map<string, Intl.DateTimeFormat>()

function lecteur(fuseau: string): Intl.DateTimeFormat {
  let format = lecteurParFuseau.get(fuseau)
  if (!format) {
    format = new Intl.DateTimeFormat('fr-FR', {
      timeZone: fuseau,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
    lecteurParFuseau.set(fuseau, format)
  }
  return format
}

/** Date et heure murales d'un instant dans un fuseau (gère l'heure d'été). */
export function instantLocal(instant: Date, fuseau: string = FUSEAU_GARAGE): InstantLocal {
  const parties = new Map(
    lecteur(fuseau)
      .formatToParts(instant)
      .map((partie) => [partie.type, Number(partie.value)] as const),
  )
  const valeur = (type: Intl.DateTimeFormatPartTypes): number => {
    const lue = parties.get(type)
    if (lue === undefined || Number.isNaN(lue)) {
      throw new RangeError(`Instant illisible dans le fuseau ${fuseau} : ${instant.toISOString()}.`)
    }
    return lue
  }
  return {
    date: { annee: valeur('year'), mois: valeur('month'), jour: valeur('day') },
    minutes: valeur('hour') * MINUTES_PAR_HEURE + valeur('minute'),
  }
}

function versUtcMidi(date: DateCalendaire): number {
  // Midi évite tout effet de bord autour de minuit ; seul le calendrier compte ici.
  return Date.UTC(date.annee, date.mois - 1, date.jour, 12)
}

export function ajouterJours(date: DateCalendaire, nombre: number): DateCalendaire {
  const decalee = new Date(versUtcMidi(date) + nombre * MILLISECONDES_PAR_JOUR)
  return {
    annee: decalee.getUTCFullYear(),
    mois: decalee.getUTCMonth() + 1,
    jour: decalee.getUTCDate(),
  }
}

export function jourDeLaSemaine(date: DateCalendaire): JourSemaine {
  return jourDepuisIndexUtc(new Date(versUtcMidi(date)).getUTCDay())
}

export function dateIso(date: DateCalendaire): string {
  const deuxChiffres = (nombre: number) => String(nombre).padStart(2, '0')
  return `${date.annee}-${deuxChiffres(date.mois)}-${deuxChiffres(date.jour)}`
}

const FORMAT_DATE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

/** Lit « AAAA-MM-JJ ». `null` si le texte ne désigne pas un jour qui existe au calendrier. */
export function lireDateIso(texte: string): DateCalendaire | null {
  const correspondance = FORMAT_DATE_ISO.exec(texte)
  if (!correspondance) return null
  const date = {
    annee: Number(correspondance[1]),
    mois: Number(correspondance[2]),
    jour: Number(correspondance[3]),
  }
  return dateIso(ajouterJours(date, 0)) === texte ? date : null
}

/** `true` si le texte « AAAA-MM-JJ » désigne un jour qui existe au calendrier. */
export function estDateIsoValide(texte: string): boolean {
  return lireDateIso(texte) !== null
}

/** Négatif si `a` précède `b`, nul le même jour, positif sinon. */
export function comparerDates(a: DateCalendaire, b: DateCalendaire): number {
  return versUtcMidi(a) - versUtcMidi(b)
}

/** Nombre de jours de `a` à `b` (négatif si `b` précède `a`). */
export function ecartEnJours(a: DateCalendaire, b: DateCalendaire): number {
  return Math.round((versUtcMidi(b) - versUtcMidi(a)) / MILLISECONDES_PAR_JOUR)
}

/**
 * Temps du garage : les instants sont stockés en UTC et lus à l'heure de
 * Paris, heure d'été comprise (D12). Fonctions pures : l'instant présent
 * arrive toujours en paramètre, jamais lu ici.
 */

export const FUSEAU_GARAGE = 'Europe/Paris'

export const MINUTE_MS = 60_000
export const HEURE_MS = 60 * MINUTE_MS
export const JOUR_MS = 24 * HEURE_MS

const JOURS_DEPUIS_LUNDI: Readonly<Record<string, number>> = {
  lundi: 0,
  mardi: 1,
  mercredi: 2,
  jeudi: 3,
  vendredi: 4,
  samedi: 5,
  dimanche: 6,
}

const lecteur = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU_GARAGE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
})

const lecteurNumerique = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU_GARAGE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

interface PartiesLocales {
  readonly jourSemaine: string
  readonly jour: string
  readonly mois: string
  readonly annee: string
  readonly heure: number
  readonly minute: number
}

function parties(instant: Date): PartiesLocales {
  const lues = new Map(lecteur.formatToParts(instant).map((partie) => [partie.type, partie.value]))
  const valeur = (type: Intl.DateTimeFormatPartTypes): string => {
    const lue = lues.get(type)
    if (lue === undefined) throw new RangeError(`Instant illisible : ${instant.toISOString()}.`)
    return lue
  }
  return {
    jourSemaine: valeur('weekday'),
    jour: valeur('day'),
    mois: valeur('month'),
    annee: valeur('year'),
    heure: Number(valeur('hour')),
    minute: Number(valeur('minute')),
  }
}

/** Heure au format du site : « 19 h », « 8 h 30 ». */
export function formaterHeure(heure: number, minute: number): string {
  return minute === 0 ? `${heure} h` : `${heure} h ${String(minute).padStart(2, '0')}`
}

/**
 * « jeudi 24 septembre à 21 h 05 » ; l'année s'ajoute quand elle diffère de
 * celle de l'instant de référence (une demande reçue l'an passé).
 */
export function formaterInstant(instant: Date, reference: Date = instant): string {
  const lu = parties(instant)
  const annee = lu.annee === parties(reference).annee ? '' : ` ${lu.annee}`
  return `${lu.jourSemaine} ${lu.jour} ${lu.mois}${annee} à ${formaterHeure(lu.heure, lu.minute)}`
}

/** Date du calendrier : `AAAA-MM-JJ`. */
export const FORMAT_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Date civile à Paris de l'instant donné, au format `AAAA-MM-JJ`. */
export function dateAParis(instant: Date): string {
  const lues = new Map(
    lecteurNumerique.formatToParts(instant).map((partie) => [partie.type, partie.value] as const),
  )
  const [annee, mois, jour] = ['year', 'month', 'day'].map((type) => {
    const valeur = lues.get(type as Intl.DateTimeFormatPartTypes)
    if (valeur === undefined) throw new RangeError(`Instant illisible : ${instant.toISOString()}.`)
    return valeur
  })
  return `${annee}-${(mois ?? '').padStart(2, '0')}-${(jour ?? '').padStart(2, '0')}`
}

/** Vrai si le texte est une date `AAAA-MM-JJ` qui existe au calendrier. */
export function estDateValide(texte: string): boolean {
  const lue = FORMAT_DATE.exec(texte)
  if (lue === null) return false
  const [annee, mois, jour] = [lue[1], lue[2], lue[3]].map(Number)
  const date = new Date(Date.UTC(annee ?? 0, (mois ?? 0) - 1, jour ?? 0))
  return (
    date.getUTCFullYear() === annee && date.getUTCMonth() + 1 === mois && date.getUTCDate() === jour
  )
}

/**
 * « jeudi 24 septembre » pour une date `AAAA-MM-JJ` ; l'année s'ajoute quand
 * elle diffère de celle de l'instant de référence.
 */
export function jourEnLettres(date: string, reference: Date): string {
  if (!estDateValide(date)) throw new RangeError(`Date illisible : ${date}.`)
  // Midi UTC tombe le même jour à Paris, heure d'été comme d'hiver.
  const lu = parties(new Date(`${date}T12:00:00.000Z`))
  const annee = lu.annee === parties(reference).annee ? '' : ` ${lu.annee}`
  return `${lu.jourSemaine} ${lu.jour} ${lu.mois}${annee}`
}

/** Heure à Paris de l'instant donné : « 9 h 05 ». */
export function heureAParis(instant: Date): string {
  const lu = parties(instant)
  return formaterHeure(lu.heure, lu.minute)
}

/** Année civile à Paris : le 31 décembre à 23 h 30 UTC, c'est déjà l'an suivant au garage. */
export function anneeAParis(instant: Date): number {
  return Number(parties(instant).annee)
}

/** Minuit, heure de Paris, du lundi de la semaine de l'instant donné. */
export function debutDeSemaine(instant: Date): Date {
  const decalage = JOURS_DEPUIS_LUNDI[parties(instant).jourSemaine]
  if (decalage === undefined) throw new RangeError(`Jour illisible : ${instant.toISOString()}.`)
  const date = new Map(
    lecteurNumerique
      .formatToParts(instant)
      .map((partie) => [partie.type, Number(partie.value)] as const),
  )
  const annee = date.get('year')
  const mois = date.get('month')
  const jour = date.get('day')
  if (annee === undefined || mois === undefined || jour === undefined) {
    throw new RangeError(`Instant illisible : ${instant.toISOString()}.`)
  }
  return minuitAParis(annee, mois, jour - decalage)
}

/**
 * Instant UTC de minuit à Paris pour une date du calendrier. Paris a une
 * heure (hiver) ou deux (été) d'avance sur UTC ; à minuit, jamais au moment
 * d'un changement d'heure (qui a lieu à 2 h ou 3 h), le décalage est net.
 */
function minuitAParis(annee: number, mois: number, jour: number): Date {
  const minuitUtc = Date.UTC(annee, mois - 1, jour)
  const lu = parties(new Date(minuitUtc))
  const avanceMinutes = lu.heure * 60 + lu.minute
  return new Date(minuitUtc - avanceMinutes * MINUTE_MS)
}

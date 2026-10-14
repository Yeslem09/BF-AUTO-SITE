import { plagesDuJour, type CalendrierConnu } from './calendrier.js'
import { dateEnLettres, majusculeInitiale } from './dates-francaises.js'
import { MINUTES_PAR_HEURE, type MinuteDuJour } from './heure.js'
import type { Plage } from './horaires.js'
import { HORIZON_RECHERCHE_JOURS } from './statut-ouverture.js'
import { ajouterJours, dateIso, type DateCalendaire, type InstantLocal } from './temps-local.js'

/** Midi sépare le matin de l'après-midi. */
export const MIDI: MinuteDuJour = 12 * MINUTES_PAR_HEURE

export const MOMENTS = ['matin', 'apres-midi'] as const

export type Moment = (typeof MOMENTS)[number]

const LIBELLES_MOMENT: Readonly<Record<Moment, string>> = {
  matin: 'matin',
  'apres-midi': 'après-midi',
}

/**
 * Demi-journée d'ouverture : le matin (avant midi) ou l'après-midi d'une date,
 * s'il y a au moins une minute d'ouverture ; `debut` est cette première minute.
 */
export interface DemiJournee {
  readonly date: DateCalendaire
  readonly moment: Moment
  readonly debut: MinuteDuJour
}

/** Nombre de demi-journées proposées pour un rendez-vous (Kano D4). */
export const NOMBRE_DEMI_JOURNEES_PROPOSEES = 10

function debutDuMatin(plages: readonly Plage[]): MinuteDuJour | null {
  const premiere = plages.find((plage) => plage.ouverture < MIDI)
  return premiere === undefined ? null : premiere.ouverture
}

function debutDeLApresMidi(plages: readonly Plage[]): MinuteDuJour | null {
  const premiere = plages.find((plage) => plage.fermeture > MIDI)
  return premiere === undefined ? null : Math.max(premiere.ouverture, MIDI)
}

/** Demi-journées d'ouverture d'une date, dans l'ordre du jour. */
export function demiJourneesDuJour(
  calendrier: CalendrierConnu,
  date: DateCalendaire,
): readonly DemiJournee[] {
  const plages = plagesDuJour(calendrier, date)
  const demiJournees: DemiJournee[] = []
  const matin = debutDuMatin(plages)
  if (matin !== null) demiJournees.push({ date, moment: 'matin', debut: matin })
  const apresMidi = debutDeLApresMidi(plages)
  if (apresMidi !== null) demiJournees.push({ date, moment: 'apres-midi', debut: apresMidi })
  return demiJournees
}

/**
 * Les prochaines demi-journées d'ouverture qui n'ont pas encore commencé :
 * une demi-journée déjà entamée n'est jamais promise. Jours fermés et
 * fermetures exceptionnelles exclus ; au plus `nombre`, dans l'horizon de recherche.
 */
export function prochainesDemiJournees(
  calendrier: CalendrierConnu,
  maintenant: InstantLocal,
  nombre: number,
): readonly DemiJournee[] {
  const trouvees: DemiJournee[] = []
  for (let ecart = 0; ecart <= HORIZON_RECHERCHE_JOURS && trouvees.length < nombre; ecart++) {
    const date = ajouterJours(maintenant.date, ecart)
    for (const demiJournee of demiJourneesDuJour(calendrier, date)) {
      const aVenir = ecart > 0 || demiJournee.debut > maintenant.minutes
      if (aVenir && trouvees.length < nombre) trouvees.push(demiJournee)
    }
  }
  return trouvees
}

/** Code stable : `2026-09-24-matin`, `2026-09-24-apres-midi`. */
export function codeDemiJournee(demiJournee: DemiJournee): string {
  return `${dateIso(demiJournee.date)}-${demiJournee.moment}`
}

/** « Jeudi 24 septembre, matin ». */
export function libelleDemiJournee(demiJournee: DemiJournee): string {
  return `${majusculeInitiale(dateEnLettres(demiJournee.date))}, ${LIBELLES_MOMENT[demiJournee.moment]}`
}

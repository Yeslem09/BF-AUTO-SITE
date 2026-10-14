/** Heure de la journée exprimée en minutes depuis minuit (0 à 1439). */
export type MinuteDuJour = number

export const MINUTES_PAR_HEURE = 60
const FORMAT_HEURE = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Lit « HH:MM » sur 24 heures. `null` si le texte n'est pas une heure valide. */
export function lireHeure(texte: string): MinuteDuJour | null {
  const correspondance = FORMAT_HEURE.exec(texte)
  if (!correspondance) return null
  return Number(correspondance[1]) * MINUTES_PAR_HEURE + Number(correspondance[2])
}

/** Écriture française d'une heure : « 19 h » pile, « 8 h 30 » sinon. */
export function libelleHeure(minutes: MinuteDuJour): string {
  const heures = Math.floor(minutes / MINUTES_PAR_HEURE)
  const reste = minutes % MINUTES_PAR_HEURE
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`
}

/**
 * Calendrier d'essai du Kano (jamais les horaires réels du garage) : ouvert du
 * lundi au samedi, de 8 h 30 à 12 h et de 14 h à 19 h, fermé le dimanche.
 * Réservé aux fichiers de test.
 */
import type { CalendrierConnu } from '../domaine/calendrier.js'
import type { MotifFermeture, PeriodeFermeture } from '../domaine/fermeture.js'
import { lireHeure } from '../domaine/heure.js'
import type { Plage, SemaineType } from '../domaine/horaires.js'
import { lireDateIso, type DateCalendaire } from '../domaine/temps-local.js'

export function plage(ouverture: string, fermeture: string): Plage {
  const debut = lireHeure(ouverture)
  const fin = lireHeure(fermeture)
  if (debut === null || fin === null) throw new Error('heure d’essai invalide')
  return { ouverture: debut, fermeture: fin }
}

export const JOURNEE_ESSAI: readonly Plage[] = [plage('08:30', '12:00'), plage('14:00', '19:00')]

export const SEMAINE_ESSAI: SemaineType = {
  lundi: JOURNEE_ESSAI,
  mardi: JOURNEE_ESSAI,
  mercredi: JOURNEE_ESSAI,
  jeudi: JOURNEE_ESSAI,
  vendredi: JOURNEE_ESSAI,
  samedi: JOURNEE_ESSAI,
  dimanche: [],
}

export function date(texte: string): DateCalendaire {
  const lue = lireDateIso(texte)
  if (lue === null) throw new Error(`date d’essai invalide : ${texte}`)
  return lue
}

export function fermeture(
  du: string,
  au: string,
  motif: MotifFermeture = 'conges',
): PeriodeFermeture {
  return { du: date(du), au: date(au), motif }
}

export function calendrier(
  fermetures: readonly PeriodeFermeture[] = [],
  semaine: SemaineType = SEMAINE_ESSAI,
): CalendrierConnu {
  return { semaine, fermetures }
}

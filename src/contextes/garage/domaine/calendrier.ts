import { fermetureCouvrant, type PeriodeFermeture } from './fermeture.js'
import type { Plage, SemaineType } from './horaires.js'
import { jourDeLaSemaine, type DateCalendaire } from './temps-local.js'

/**
 * Ce que le site sait des jours d'ouverture : la semaine type publiable (ou
 * `null`, et le site ne prétend alors rien) moins les fermetures exceptionnelles
 * déclarées par le garagiste.
 */
export interface CalendrierOuverture {
  readonly semaine: SemaineType | null
  readonly fermetures: readonly PeriodeFermeture[]
}

/** Calendrier dont la semaine type est publiable. */
export interface CalendrierConnu extends CalendrierOuverture {
  readonly semaine: SemaineType
}

export function estConnu(calendrier: CalendrierOuverture): calendrier is CalendrierConnu {
  return calendrier.semaine !== null
}

/** Plages ouvertes à une date : aucune un jour de fermeture exceptionnelle. */
export function plagesDuJour(calendrier: CalendrierConnu, date: DateCalendaire): readonly Plage[] {
  if (fermetureCouvrant(calendrier.fermetures, date) !== null) return []
  return calendrier.semaine[jourDeLaSemaine(date)]
}

/**
 * `true` si le garage aurait dû ouvrir ce jour-là et qu'une fermeture
 * exceptionnelle l'en empêche. Un dimanche habituellement fermé, compris dans
 * des congés, n'est pas une fermeture exceptionnelle.
 */
export function estFermeExceptionnellement(
  calendrier: CalendrierConnu,
  date: DateCalendaire,
): boolean {
  return (
    calendrier.semaine[jourDeLaSemaine(date)].length > 0 &&
    fermetureCouvrant(calendrier.fermetures, date) !== null
  )
}

import { estFermeExceptionnellement, plagesDuJour, type CalendrierConnu } from './calendrier.js'
import { majusculeInitiale } from './dates-francaises.js'
import { libelleHeure } from './heure.js'
import type { Plage } from './horaires.js'
import { JOURS_SEMAINE } from './jours.js'
import { ajouterJours, jourDeLaSemaine, type DateCalendaire } from './temps-local.js'

export const LIBELLE_JOUR_FERME = 'Fermé'
export const LIBELLE_JOUR_FERME_EXCEPTIONNELLEMENT = 'Fermé exceptionnellement'

export interface LigneHoraire {
  /** Jour avec majuscule initiale : « Jeudi ». */
  readonly jour: string
  /** Vrai pour la première ligne : le jour courant. */
  readonly aujourdhui: boolean
  /** Une entrée par plage : « 8 h 30 à 12 h », « 14 h à 19 h ». Vide un jour fermé. */
  readonly plages: readonly string[]
  /** Fermé ce jour-là par une fermeture exceptionnelle, alors qu'il aurait dû ouvrir. */
  readonly fermeExceptionnellement: boolean
}

function plagesEnLettres(plages: readonly Plage[]): readonly string[] {
  return plages.map(
    (plage) => `${libelleHeure(plage.ouverture)} à ${libelleHeure(plage.fermeture)}`,
  )
}

/** « 8 h 30 à 12 h, 14 h à 19 h », « Fermé » ou « Fermé exceptionnellement ». */
export function decrireLigne(ligne: LigneHoraire): string {
  if (ligne.fermeExceptionnellement) return LIBELLE_JOUR_FERME_EXCEPTIONNELLEMENT
  return ligne.plages.length === 0 ? LIBELLE_JOUR_FERME : ligne.plages.join(', ')
}

/** « 8 h 30 à 12 h, 14 h à 19 h », ou « Fermé » pour un jour sans plage. */
export function decrirePlages(plages: readonly Plage[]): string {
  return plages.length === 0 ? LIBELLE_JOUR_FERME : plagesEnLettres(plages).join(', ')
}

/**
 * Les sept prochains jours, aujourd'hui en tête (Kano B-03, US-40), avec les
 * fermetures exceptionnelles de la semaine qui vient.
 */
export function decrireSemaineGlissante(
  calendrier: CalendrierConnu,
  aujourdhui: DateCalendaire,
): readonly LigneHoraire[] {
  return JOURS_SEMAINE.map((_, ecart) => {
    const date = ajouterJours(aujourdhui, ecart)
    return {
      jour: majusculeInitiale(jourDeLaSemaine(date)),
      aujourdhui: ecart === 0,
      plages: plagesEnLettres(plagesDuJour(calendrier, date)),
      fermeExceptionnellement: estFermeExceptionnellement(calendrier, date),
    }
  })
}

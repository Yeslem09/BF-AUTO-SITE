import { lireHeure } from './heure.js'
import { SEMAINE_FERMEE, type Plage, type SemaineType } from './horaires.js'
import { JOURS_SEMAINE, type JourSemaine } from './jours.js'
import { estObjet, sousChemin, verifierCles, type Rapport } from './lecture-json.js'
import type { Lecteur } from './lecture-valeur.js'

const CLES_PLAGE = ['ouverture', 'fermeture'] as const

/**
 * Lit une semaine type : une entrée par jour de lundi à dimanche, plages
 * « HH:MM », ouverture avant fermeture, plages triées et séparées. Une semaine
 * sans aucune plage n'est pas une semaine d'ouverture : c'est une erreur.
 */
export const lireSemaine: Lecteur<SemaineType> = (brut, chemin, rapport) => {
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet attendu, avec une entrée par jour de lundi à dimanche')
    return SEMAINE_FERMEE
  }
  verifierCles(brut, chemin, JOURS_SEMAINE, rapport)
  const semaine: Record<JourSemaine, readonly Plage[]> = { ...SEMAINE_FERMEE }
  for (const jour of JOURS_SEMAINE) {
    semaine[jour] = lireJour(brut[jour], sousChemin(chemin, jour), rapport)
  }
  if (JOURS_SEMAINE.every((jour) => semaine[jour].length === 0)) {
    rapport.signaler(chemin, 'aucune plage d’ouverture : renseigner au moins un jour')
  }
  return semaine
}

function lireJour(brut: unknown, chemin: string, rapport: Rapport): readonly Plage[] {
  if (brut === undefined) return []
  if (!Array.isArray(brut)) {
    rapport.signaler(chemin, 'liste de plages attendue ([] pour un jour fermé)')
    return []
  }
  const plages: Plage[] = []
  brut.forEach((element: unknown, index) => {
    const plage = lirePlage(element, sousChemin(chemin, index), rapport)
    if (plage) plages.push(plage)
  })
  plages.forEach((plage, index) => {
    const precedente = plages[index - 1]
    if (precedente && precedente.fermeture >= plage.ouverture) {
      rapport.signaler(
        chemin,
        `les plages ${index} et ${index + 1} se chevauchent ou se touchent : les fusionner ou les ordonner`,
      )
    }
  })
  return plages
}

function lirePlage(brut: unknown, chemin: string, rapport: Rapport): Plage | null {
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet { "ouverture": "HH:MM", "fermeture": "HH:MM" } attendu')
    return null
  }
  verifierCles(brut, chemin, CLES_PLAGE, rapport)
  const ouverture = lireHeureChamp(brut['ouverture'], sousChemin(chemin, 'ouverture'), rapport)
  const fermeture = lireHeureChamp(brut['fermeture'], sousChemin(chemin, 'fermeture'), rapport)
  if (ouverture === null || fermeture === null) return null
  if (ouverture >= fermeture) {
    rapport.signaler(
      chemin,
      `l’ouverture (${String(brut['ouverture'])}) doit précéder la fermeture (${String(brut['fermeture'])})`,
    )
    return null
  }
  return { ouverture, fermeture }
}

function lireHeureChamp(brut: unknown, chemin: string, rapport: Rapport): number | null {
  const minutes = typeof brut === 'string' ? lireHeure(brut) : null
  if (minutes === null) {
    rapport.signaler(
      chemin,
      `« ${String(brut)} » n’est pas une heure au format HH:MM (00:00 à 23:59)`,
    )
  }
  return minutes
}

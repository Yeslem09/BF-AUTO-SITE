import type { StatutOuverture } from '../../../contrats/index.js'
import {
  estConnu,
  estFermeExceptionnellement,
  plagesDuJour,
  type CalendrierConnu,
  type CalendrierOuverture,
} from './calendrier.js'
import { dateEnLettres } from './dates-francaises.js'
import { fermetureCouvrant } from './fermeture.js'
import { libelleHeure } from './heure.js'
import {
  ajouterJours,
  instantLocal,
  jourDeLaSemaine,
  type DateCalendaire,
  type InstantLocal,
} from './temps-local.js'

export const LIBELLE_HORAIRES_A_CONFIRMER = 'Horaires à confirmer'
const LIBELLE_FERME = 'Fermé'
const LIBELLE_FERME_EXCEPTIONNELLEMENT = 'Fermé exceptionnellement'
const LIBELLE_FERME_AUJOURDHUI = 'Fermé exceptionnellement aujourd’hui'

/** Au-delà, on renonce à annoncer une réouverture (congés très longs). */
export const HORIZON_RECHERCHE_JOURS = 60
/** Jusqu'à ce nombre de jours, le nom du jour suffit (« lundi ») ; au-delà, la date. */
export const ECART_MAX_JOUR_NOMME = 6

/**
 * Statut d'ouverture du garage à un instant, lu à l'heure de Paris, fermetures
 * exceptionnelles comprises. Fonction pure : le même instant donne toujours le
 * même statut.
 */
export function calculerStatutOuverture(
  calendrier: CalendrierOuverture,
  instant: Date,
): StatutOuverture {
  const maintenant = instantLocal(instant)
  if (!estConnu(calendrier)) {
    // Sans horaires, une fermeture déclarée pour aujourd'hui reste une certitude.
    return fermetureCouvrant(calendrier.fermetures, maintenant.date) === null
      ? { etat: 'a-confirmer', libelle: LIBELLE_HORAIRES_A_CONFIRMER }
      : { etat: 'ferme', libelle: LIBELLE_FERME_AUJOURDHUI }
  }
  const plageEnCours = plagesDuJour(calendrier, maintenant.date).find(
    (plage) => plage.ouverture <= maintenant.minutes && maintenant.minutes < plage.fermeture,
  )
  if (plageEnCours) {
    return { etat: 'ouvert', libelle: `Ouvert, ferme à ${libelleHeure(plageEnCours.fermeture)}` }
  }
  return { etat: 'ferme', libelle: libelleFermeture(calendrier, maintenant) }
}

function libelleFermeture(calendrier: CalendrierConnu, maintenant: InstantLocal): string {
  const debut = estFermeExceptionnellement(calendrier, maintenant.date)
    ? LIBELLE_FERME_EXCEPTIONNELLEMENT
    : LIBELLE_FERME
  const plages = plagesDuJour(calendrier, maintenant.date)
  const prochaineAujourdhui = plages.find((plage) => plage.ouverture > maintenant.minutes)
  if (prochaineAujourdhui) {
    const pauseEnCours = plages.some((plage) => plage.fermeture <= maintenant.minutes)
    const verbe = pauseEnCours ? 'rouvre' : 'ouvre'
    return `${debut}, ${verbe} à ${libelleHeure(prochaineAujourdhui.ouverture)}`
  }
  for (let ecart = 1; ecart <= HORIZON_RECHERCHE_JOURS; ecart++) {
    const date = ajouterJours(maintenant.date, ecart)
    const premiere = plagesDuJour(calendrier, date)[0]
    if (premiere) {
      return `${debut}, ouvre ${designerJour(date, ecart)} à ${libelleHeure(premiere.ouverture)}`
    }
  }
  return debut
}

/**
 * « vendredi » dans la semaine, lendemain compris, « le lundi 24 août »
 * au-delà. Jamais « demain » : lu la nuit, « demain » se comprend comme le
 * jour qui commence, pas comme le suivant.
 */
function designerJour(date: DateCalendaire, ecart: number): string {
  if (ecart <= ECART_MAX_JOUR_NOMME) return jourDeLaSemaine(date)
  return `le ${dateEnLettres(date)}`
}

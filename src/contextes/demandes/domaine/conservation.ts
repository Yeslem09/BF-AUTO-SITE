import { JOUR_MS } from './temps.js'

/**
 * Minimisation (D5, US-34) : une demande disparaît 12 mois après la plus
 * récente de deux dates, sa réception ou le dernier changement de son statut.
 * Le site n'est pas le fichier client du garage.
 */
export const DUREE_CONSERVATION_MOIS = 12

/** Traitées récentes montrées dans l'espace garagiste, sous les demandes à rappeler (D5). */
export const JOURS_TRAITEES_AFFICHEES = 30

/** Envois non confirmés : gardés un mois, le temps d'être comptés chaque semaine. */
export const JOURS_CONSERVATION_ENVOIS_SUSPECTS = 30

/** Instant avant lequel une demande est à purger : même jour et même heure, 12 mois plus tôt. */
export function limiteDeConservation(maintenant: Date): Date {
  const limite = new Date(maintenant.getTime())
  limite.setUTCMonth(limite.getUTCMonth() - DUREE_CONSERVATION_MOIS)
  return limite
}

/** Dernière activité d'une demande : le dernier changement de statut, sinon sa réception. */
export function derniereActivite(recueLe: Date, statutChangeLe: Date | null): Date {
  return statutChangeLe !== null && statutChangeLe > recueLe ? statutChangeLe : recueLe
}

export function estAPurger(recueLe: Date, statutChangeLe: Date | null, maintenant: Date): boolean {
  return derniereActivite(recueLe, statutChangeLe) < limiteDeConservation(maintenant)
}

export function debutTraiteesAffichees(maintenant: Date): Date {
  return new Date(maintenant.getTime() - JOURS_TRAITEES_AFFICHEES * JOUR_MS)
}

export function limiteEnvoisSuspects(maintenant: Date): Date {
  return new Date(maintenant.getTime() - JOURS_CONSERVATION_ENVOIS_SUSPECTS * JOUR_MS)
}

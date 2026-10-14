import type { DepotAcces } from './ports.js'

export interface BilanReinitialisation {
  readonly sessions: number
  readonly liens: number
}

export type ReinitialiserAcces = () => BilanReinitialisation

/**
 * Commande d'exploitation d'Anthony (téléphone perdu, doute) : toutes les
 * sessions sont révoquées, et les liens pas encore utilisés avec elles, pour
 * qu'un lien en attente ne rouvre pas la porte qu'on vient de fermer.
 */
export function creerReinitialiserAcces(dependances: {
  readonly depot: DepotAcces
}): ReinitialiserAcces {
  return () => dependances.depot.toutRevoquer()
}

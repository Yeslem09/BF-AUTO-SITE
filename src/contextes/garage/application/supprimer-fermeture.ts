import type { DepotFermetures } from './ports.js'

/** `false` si la fermeture n'existe plus (double appui, autre onglet). */
export type SupprimerFermeture = (identifiant: number) => Promise<boolean>

export function creerSupprimerFermeture(depot: DepotFermetures): SupprimerFermeture {
  return (identifiant) => depot.supprimer(identifiant)
}

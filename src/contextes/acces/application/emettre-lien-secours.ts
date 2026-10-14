import { CHEMINS } from '../../../contrats/index.js'
import type { Horloge } from './ports.js'
import { preparerLien, type DependancesPreparerLien } from './preparer-lien.js'

export interface LienDeSecours {
  readonly adresse: string
  readonly expireLe: Date
}

export type EmettreLienDeSecours = () => LienDeSecours

/**
 * Lien de connexion remis par l'exploitant qui a la main sur le serveur, quand
 * le canal d'envoi est en panne ou pas encore configuré. Mêmes règles qu'un
 * lien envoyé : usage unique, 15 minutes.
 */
export function creerEmettreLienDeSecours(
  dependances: DependancesPreparerLien & {
    readonly horloge: Horloge
    readonly adresseDuLien: (jeton: string) => string
  },
): EmettreLienDeSecours {
  return () => {
    const { jeton, lien } = preparerLien(
      dependances,
      dependances.horloge.maintenant(),
      CHEMINS.garagiste,
    )
    return { adresse: dependances.adresseDuLien(jeton), expireLe: lien.expireLe }
  }
}

import { nouveauLien, type LienConnexion } from '../domaine/lien-connexion.js'
import type { DepotAcces, GenerateurJeton, Hachage } from './ports.js'

export interface DependancesPreparerLien {
  readonly depot: DepotAcces
  readonly generateur: GenerateurJeton
  readonly hachage: Hachage
}

export interface LienPrepare {
  /** Le jeton en clair : il ne doit sortir que dans le message au garagiste. */
  readonly jeton: string
  readonly lien: LienConnexion
}

/**
 * Crée un lien de connexion et n'en garde en base que l'empreinte. Partagé par
 * la demande de lien (envoyé) et le lien de secours (affiché à l'exploitant).
 */
export function preparerLien(
  dependances: DependancesPreparerLien,
  maintenant: Date,
  retour: string,
): LienPrepare {
  const jeton = dependances.generateur.generer()
  const lien = nouveauLien(dependances.hachage.empreinte(jeton), maintenant, retour)
  dependances.depot.purger(maintenant)
  dependances.depot.enregistrerLien(lien)
  return { jeton, lien }
}

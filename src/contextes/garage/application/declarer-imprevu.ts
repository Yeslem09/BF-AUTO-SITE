import { fermetureCouvrant } from '../domaine/fermeture.js'
import { instantLocal } from '../domaine/temps-local.js'
import type { DepotFermetures, Horloge } from './ports.js'

export type ResultatImprevu = { readonly dejaFerme: boolean }

export type DeclarerImprevu = () => Promise<ResultatImprevu>

/**
 * « Imprévu aujourd'hui » (Kano D5) : ferme la journée en cours, à l'heure de
 * Paris. Si elle est déjà déclarée fermée, rien n'est ajouté (double appui).
 */
export function creerDeclarerImprevu(depot: DepotFermetures, horloge: Horloge): DeclarerImprevu {
  return async () => {
    const maintenant = horloge.maintenant()
    const aujourdhui = instantLocal(maintenant).date
    if (fermetureCouvrant(await depot.listerDepuis(aujourdhui), aujourdhui) !== null) {
      return { dejaFerme: true }
    }
    await depot.ajouter({ du: aujourdhui, au: aujourdhui, motif: 'imprevu' }, maintenant)
    return { dejaFerme: false }
  }
}

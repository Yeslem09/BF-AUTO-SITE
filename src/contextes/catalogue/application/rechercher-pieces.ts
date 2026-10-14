import type { ModeSite } from '../../../contrats/index.js'
import { publierCatalogue, type CataloguePublie } from '../domaine/publication.js'
import {
  nettoyerRequete,
  rechercherFamilles,
  type ResultatRecherche,
} from '../domaine/recherche.js'
import type { SourceCatalogue } from './ports.js'

export interface CatalogueRecherche {
  readonly catalogue: CataloguePublie
  /** Requête nettoyée, reprise dans le champ de recherche ; vide sans recherche. */
  readonly requete: string
  /** `null` sans recherche ; sinon les familles publiées qui répondent, éventuellement aucune. */
  readonly resultat: ResultatRecherche | null
}

export type RechercherPieces = (requete: string) => Promise<CatalogueRecherche>

/**
 * Le catalogue publié dans le mode du site et, si une requête est donnée, les
 * familles publiées qui y répondent : une famille masquée n'est jamais trouvée.
 */
export function creerRechercherPieces(source: SourceCatalogue, mode: ModeSite): RechercherPieces {
  return async (brute) => {
    const catalogue = publierCatalogue(await source.charger(), mode)
    const requete = nettoyerRequete(brute)
    return {
      catalogue,
      requete,
      resultat: requete === '' ? null : rechercherFamilles(catalogue.familles, requete),
    }
  }
}

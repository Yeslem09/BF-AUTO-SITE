import type { Catalogue } from '../domaine/catalogue.js'

/** Fournit le catalogue, déjà validé par le domaine. */
export interface SourceCatalogue {
  charger(): Promise<Catalogue>
}

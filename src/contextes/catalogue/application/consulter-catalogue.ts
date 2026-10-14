import type { ModeSite } from '../../../contrats/index.js'
import { publierCatalogue, type CataloguePublie } from '../domaine/publication.js'
import type { SourceCatalogue } from './ports.js'

export type ConsulterCatalogue = () => Promise<CataloguePublie>

/** Le catalogue tel que le mode du site permet de le montrer : familles, tarifs, exclusions. */
export function creerConsulterCatalogue(
  source: SourceCatalogue,
  mode: ModeSite,
): ConsulterCatalogue {
  return async () => publierCatalogue(await source.charger(), mode)
}

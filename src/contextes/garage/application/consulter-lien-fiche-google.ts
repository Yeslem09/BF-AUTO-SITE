import type { ModeSite } from '../../../contrats/index.js'
import { publier, type Publication } from '../domaine/valeur-publiee.js'
import type { SourceIdentiteGarage } from './ports.js'

/** Lien vers les horaires exceptionnels de la fiche Google, rappelé après une fermeture (Kano D5). */
export type ConsulterLienFicheGoogle = () => Promise<Publication<string>>

export function creerConsulterLienFicheGoogle(
  source: SourceIdentiteGarage,
  mode: ModeSite,
): ConsulterLienFicheGoogle {
  return async () => publier((await source.charger()).suivi.lienGestionFicheGoogle, mode)
}

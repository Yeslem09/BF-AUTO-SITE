import { FIGURES_FAMILLES, type FigureTechnique } from '../../../../../web/index.js'

/**
 * Figure technique d'une famille : toutes vivent dans la couche web
 * (`FIGURES_FAMILLES`, dessins dans `public/img/familles/`), si bien que le
 * pré-diagnostic et le catalogue montrent la même pour une même famille.
 * `null` si aucune n'est dessinée pour elle : la page garde son texte.
 */
export function figureDeLaFamille(identifiant: string): FigureTechnique | null {
  return FIGURES_FAMILLES[identifiant] ?? null
}

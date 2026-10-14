/**
 * Surface publique de la couche web pour les contextes : tout ce dont un
 * adaptateur entrant a besoin pour rendre une page, rien de plus.
 * Composants CSS et HTML attendu : docs/design/composants.md.
 */
export { brut, echapper, ErreurGabarit, estHtml, html } from './html.js'
export type { Html, Interpolable } from './html.js'
export { rendrePastilleStatut, rendreStatutOuverture } from './statut.js'
export { lienItineraire } from './itineraire.js'
export { SYMBOLE } from './logo.js'
export type { BarreFixePage, CadrePage, Rubrique, VuePage } from './page.js'
export type {
  EmplacementAccueil,
  ModuleContexte,
  OutilsPage,
  RendreBlocAccueil,
} from './module-contexte.js'
export { FIGURES_FAMILLES, rendreFigureTechnique } from './figure-technique.js'
export type { FigureTechnique, OptionsFigure } from './figure-technique.js'
export { vueEnConstruction } from './vues/en-construction.js'
export type { PageEnConstruction } from './vues/en-construction.js'

import { CHEMINS } from '../../contrats/index.js'
import { html } from '../html.js'
import type { Rubrique, VuePage } from '../page.js'

export interface PageEnConstruction {
  readonly titre: string
  readonly description: string
  readonly chemin: string
  readonly rubrique: Rubrique
}

/** Page provisoire d'une section pas encore livrée : dit honnêtement ce qu'il en est. */
export function vueEnConstruction(page: PageEnConstruction): VuePage {
  return {
    titre: page.titre,
    description: page.description,
    chemin: page.chemin,
    rubrique: page.rubrique,
    indexable: false,
    contenu: html`<div class="entete-page">
  <div class="conteneur">
    <h1>${page.titre}</h1>
    <p class="texte-intro">Section en construction.</p>
  </div>
</div>
<div class="conteneur section">
  <p><a href="${CHEMINS.accueil}">Retour à l’accueil</a></p>
</div>`,
  }
}

import { html, type Html, type VuePage } from '../../../../../web/index.js'
import { CHAMP_JETON_FORMULAIRE, CHEMINS } from '../../../../../contrats/index.js'

export const SURTITRE = 'Espace garagiste'

export interface PageEspace {
  readonly titre: string
  readonly description: string
  readonly chemin: string
  readonly contenu: Html
  readonly statutHttp?: number
}

/** Toute page de l'espace : jamais indexée, rattachée à la rubrique garagiste. */
export function pageEspace(page: PageEspace): VuePage {
  return {
    titre: page.titre,
    description: page.description,
    chemin: page.chemin,
    contenu: page.contenu,
    rubrique: 'garagiste',
    indexable: false,
    ...(page.statutHttp === undefined ? {} : { statutHttp: page.statutHttp }),
  }
}

export function champJetonFormulaire(jeton: string): Html {
  return html`<input type="hidden" name="${CHAMP_JETON_FORMULAIRE}" value="${jeton}">`
}

/** Accord simple du nom après un nombre. */
export function pluriel(nombre: number, singulier: string, plurielForme: string): string {
  return `${nombre} ${nombre > 1 ? plurielForme : singulier}`
}

export interface EnTeteEspace {
  readonly titre: string
  readonly surtitre?: string
  readonly intro?: Html
  /** Page de l'espace atteinte depuis son accueil : le fil passe par « Espace garagiste ». */
  readonly dansLEspace?: boolean
}

/**
 * En-tête de page de l'espace (`.entete-page`, docs/design/composants.md) :
 * fil d'Ariane, surtitre, titre, chapeau. La page courante termine le fil,
 * sans lien vers elle-même.
 */
export function enTeteEspace(entete: EnTeteEspace): Html {
  const etapes = [
    html`<li><a href="${CHEMINS.accueil}">Accueil</a></li>`,
    entete.dansLEspace === true && html`<li><a href="${CHEMINS.garagiste}">${SURTITRE}</a></li>`,
    html`<li><a aria-current="page">${entete.titre}</a></li>`,
  ]
  return html`<div class="entete-page">
  <div class="conteneur">
    <nav class="fil-ariane" aria-label="Fil d’Ariane"><ol>${etapes}</ol></nav>
    <p class="surtitre">${entete.surtitre ?? SURTITRE}</p>
    <h1>${entete.titre}</h1>
    ${entete.intro !== undefined && html`<p class="texte-intro">${entete.intro}</p>`}
  </div>
</div>`
}

import { CHEMINS } from '../../../../../contrats/index.js'
import { html, type Html } from '../../../../../web/index.js'
import { insecables } from './typographie.js'

/** Une étape du fil d'Ariane. */
export interface EtapeFil {
  readonly libelle: string
  readonly chemin: string
}

export interface EnTetePage {
  /** Étapes après la racine ; la dernière est la page courante. */
  readonly fil: readonly EtapeFil[]
  readonly surtitre: string | Html
  readonly titre: string | Html
  readonly intro?: string
  /** Ce qui suit le chapeau dans la bande : choix du type, pastilles, message. */
  readonly suite?: Html
}

const ACCUEIL: EtapeFil = { libelle: 'Accueil', chemin: CHEMINS.accueil }

/** Étape du fil des pages de l'espace garagiste, avant la page elle-même. */
export const ESPACE_GARAGISTE: EtapeFil = { libelle: 'Espace garagiste', chemin: CHEMINS.garagiste }

/**
 * En-tête de page du système de design (`.entete-page`, docs/design/composants.md) :
 * fil d'Ariane depuis l'accueil, surtitre, titre, chapeau. La page courante termine le fil,
 * marquée `aria-current` et sans lien vers elle-même.
 */
export function enTetePage(entete: EnTetePage): Html {
  const etapes = [ACCUEIL, ...entete.fil]
  const derniere = etapes.length - 1
  const fil = etapes.map((etape, rang) =>
    rang === derniere
      ? html`<li><a aria-current="page">${insecables(etape.libelle)}</a></li>`
      : html`<li><a href="${etape.chemin}">${insecables(etape.libelle)}</a></li>`,
  )
  return html`<div class="entete-page">
  <div class="conteneur">
    <nav class="fil-ariane" aria-label="Fil d’Ariane"><ol>${fil}</ol></nav>
    <p class="surtitre">${entete.surtitre}</p>
    <h1>${entete.titre}</h1>
    ${entete.intro !== undefined && html`<p class="texte-intro">${insecables(entete.intro)}</p>`}
    ${entete.suite}
  </div>
</div>`
}

import type { ModeSite } from '../contrats/index.js'
import { rendreBarreFixe } from './barre-fixe.js'
import { rendreEntete } from './entete.js'
import { html, type Html } from './html.js'
import { SPRITE_LOGO } from './logo.js'
import { appelPousse, type CadrePage, type VuePage } from './page.js'
import { rendrePied } from './pied.js'
import { RESSOURCES } from './ressources.js'

export type { BarreFixePage, CadrePage, Rubrique, VuePage } from './page.js'
export { rendreStatutOuverture } from './statut.js'

export interface ParametresMiseEnPage {
  /** Origine publique sans barre finale, par exemple `https://www.bf-auto.fr`. */
  readonly urlPublique: string
  /** Ajoute l'empreinte de version à un chemin de ressource publique. */
  readonly versionner: (cheminPublic: string) => string
  /** Absent : production, aucun bandeau. */
  readonly mode?: ModeSite
  /** Couleur de la barre du navigateur, lue dans les jetons ; absente, aucune balise. */
  readonly couleurTheme?: string | null
}

const SEPARATEUR_TITRE = ' | '
const CIBLE_EVITEMENT = 'contenu'
/** Dimensions de l’image de partage (public/og-image.png, docs/logo/final-ecrou). */
const IMAGE_PARTAGE = { largeur: 1200, hauteur: 630 } as const

/** Titre de l'onglet : le nom du garage est ajouté s'il n'y figure pas déjà. */
export function titreDocument(titre: string, nomGarage: string): string {
  return titre.includes(nomGarage) ? titre : `${titre}${SEPARATEUR_TITRE}${nomGarage}`
}

export function rendrePage(vue: VuePage, cadre: CadrePage, parametres: ParametresMiseEnPage): Html {
  const { identite, statut } = cadre
  const titre = titreDocument(vue.titre, identite.nom)
  const urlCanonique = `${parametres.urlPublique}${vue.chemin}`
  const scripts = [RESSOURCES.scriptCommun, ...(vue.scripts ?? [])]
  const { barreFixe } = vue
  const avecBarre = appelPousse(vue.rubrique) && barreFixe !== 'masquee'
  const lienRappel = typeof barreFixe === 'object' ? barreFixe.lienRappel : undefined
  return html`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${titre}</title>
    <meta name="description" content="${vue.description}">
    ${vue.indexable === false && html`<meta name="robots" content="noindex">`}
    <link rel="canonical" href="${urlCanonique}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="${identite.nom}">
    <meta property="og:title" content="${titre}">
    <meta property="og:description" content="${vue.description}">
    <meta property="og:url" content="${urlCanonique}">
    <meta property="og:image" content="${`${parametres.urlPublique}${RESSOURCES.imagePartage}`}">
    <meta property="og:image:width" content="${IMAGE_PARTAGE.largeur}">
    <meta property="og:image:height" content="${IMAGE_PARTAGE.hauteur}">
    ${parametres.couleurTheme && html`<meta name="theme-color" content="${parametres.couleurTheme}">`}
    <link rel="icon" href="${RESSOURCES.faviconSvg}" type="image/svg+xml">
    <link rel="icon" href="${RESSOURCES.faviconPng}" sizes="32x32" type="image/png">
    <link rel="icon" href="${RESSOURCES.faviconPetit}" sizes="16x16" type="image/png">
    <link rel="apple-touch-icon" href="${RESSOURCES.iconeApple}">
    ${RESSOURCES.polices.map((police) => html`<link rel="preload" href="${police}" as="font" type="font/woff2" crossorigin>`)}
    <link rel="stylesheet" href="${parametres.versionner(RESSOURCES.feuilleDeStyle)}">
    ${scripts.map((script) => html`<script src="${parametres.versionner(script)}" defer></script>`)}
  </head>
  <body>
    <a class="evitement" href="#${CIBLE_EVITEMENT}">Aller au contenu</a>
    ${SPRITE_LOGO}
    ${rendreEntete(identite, statut, vue.rubrique, {
      preDiagnosticPublie: cadre.preDiagnosticPublie ?? true,
      bandeau: rendreBandeauMode(parametres.mode),
    })}
    <main id="${CIBLE_EVITEMENT}" class="principal" tabindex="-1">
      ${vue.contenu}
    </main>
    ${rendrePied(cadre)}
    ${avecBarre && rendreBarreFixe(cadre, lienRappel)}
  </body>
</html>
`
}

const BANDEAUX_MODE: Readonly<Record<ModeSite, string | null>> = {
  production: null,
  relecture: 'Mode relecture : les valeurs à valider sont surlignées.',
  demonstration: 'Version de démonstration : contenus à confirmer par le garage.',
}

/**
 * Bandeau discret qui dit la vérité sur le mode du site ; rien en production.
 * Posé en tête de l'en-tête : il vit dans le repère « banner », aucun texte de
 * la page ne reste hors repère (règle « region » d'axe-core).
 */
export function rendreBandeauMode(mode: ModeSite | undefined): Html | null {
  const texte = BANDEAUX_MODE[mode ?? 'production']
  return texte === null ? null : html`<p class="bandeau-mode" role="note">${texte}</p>`
}

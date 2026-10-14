import { CHEMINS, PARAMETRES_DEMANDE, type TypeDemande } from '../contrats/index.js'
import { html, type Html } from './html.js'

/** Un accès direct à l'une des intentions du visiteur (verdict Kano, point 1). */
export interface LienIntention {
  readonly titre: string
  readonly aide: string
  readonly chemin: string
}

const TYPE_RENDEZ_VOUS: TypeDemande = 'rendez-vous'

/** Les intentions du site, formulées une fois : accueil, erreurs et tout raccourci les reprennent. */
export const INTENTIONS = {
  preDiagnostic: {
    titre: 'Pré-diagnostic',
    aide: 'Un souci ? Cinq questions au plus',
    chemin: CHEMINS.preDiagnostic,
  },
  catalogue: {
    titre: 'Pièces détachées',
    aide: 'Vendues au comptoir ou posées',
    chemin: CHEMINS.catalogue,
  },
  rendezVous: {
    titre: 'Demander un rendez-vous',
    aide: 'Confirmé par téléphone',
    chemin: `${CHEMINS.demande}?${PARAMETRES_DEMANDE.type}=${TYPE_RENDEZ_VOUS}`,
  },
  tarifs: {
    titre: 'Consulter les tarifs',
    aide: 'Taux horaire et prix TTC',
    chemin: CHEMINS.tarifs,
  },
} as const satisfies Record<string, LienIntention>

/** Liste de liens en boutons bordés (composant `liste-choix`), titre et aide sur deux lignes. */
export function rendreListeIntentions(liens: readonly LienIntention[], classe = ''): Html {
  const elements = liens.map(
    (lien) =>
      html`<li><a class="bouton-choix" href="${lien.chemin}"><span class="bouton-choix__titre">${lien.titre}</span><span class="bouton-choix__aide">${lien.aide}</span></a></li>`,
  )
  return html`<ul class="${`liste-choix ${classe}`.trim()}">${elements}</ul>`
}

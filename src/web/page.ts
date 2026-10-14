import type { IdentiteGaragePublique, StatutOuverture } from '../contrats/index.js'
import type { Html } from './html.js'

export type Rubrique =
  | 'accueil'
  | 'pre-diagnostic'
  | 'catalogue'
  | 'rendez-vous'
  | 'tarifs'
  | 'acces'
  | 'droits'
  | 'garagiste'

/**
 * Pages hors plan public (espace garagiste, D5) : ni bouton d'appel dans
 * l'en-tête, ni barre fixe basse. Le garagiste n'a pas à s'appeler lui-même.
 */
const RUBRIQUES_SANS_APPEL_POUSSE: ReadonlySet<Rubrique> = new Set(['garagiste'])

/** Vrai si la page pousse l'appel au garage : en-tête et barre fixe basse. */
export function appelPousse(rubrique: Rubrique | undefined): boolean {
  return rubrique === undefined || !RUBRIQUES_SANS_APPEL_POUSSE.has(rubrique)
}

/**
 * Ce qu'une page demande à la barre fixe basse du téléphone (`VuePage.barreFixe`) :
 * - `{ lienRappel }` : le bouton « Être rappelé » mène à ce chemin local, par
 *   exemple `/demande?type=rappel&prediagnostic=<code>` sur le résultat du
 *   pré-diagnostic, pour que la demande emporte les réponses au lieu d'ouvrir
 *   un formulaire vide ; garage ouvert, ce rappel remplace l'itinéraire ;
 * - `'masquee'` : aucune barre, pour que rien ne détourne de l'action de la
 *   page (formulaire de demande, écran « Confirmez l'envoi », confirmation
 *   d'envoi). Le bouton d'appel de l'en-tête reste.
 */
export type BarreFixePage = 'masquee' | { readonly lienRappel: string }

/** Ce qu'une route fournit pour obtenir une page complète. */
export interface VuePage {
  /** Titre propre à la page ; le nom du garage est ajouté s'il n'y figure pas. */
  readonly titre: string
  /** Description pour les moteurs de recherche et les partages (160 caractères environ). */
  readonly description: string
  /** Chemin canonique de la page, par exemple `/pieces-et-reparations`. */
  readonly chemin: string
  readonly contenu: Html
  /** Entrée de navigation à marquer comme courante. `garagiste` : page hors plan public, sans appel poussé. */
  readonly rubrique?: Rubrique
  readonly statutHttp?: number
  /** Scripts propres à la page, par exemple `/js/pre-diagnostic/assistant.js`. */
  readonly scripts?: readonly string[]
  /** `false` pour les pages d'erreur ou de confirmation, exclues des moteurs. */
  readonly indexable?: boolean
  /** Barre fixe basse du téléphone (`BarreFixePage`). Absent : la barre calculée depuis le statut. */
  readonly barreFixe?: BarreFixePage
}

/** Données du garage nécessaires à l'en-tête, au pied et à la barre fixe de chaque page. */
export interface CadrePage {
  readonly identite: IdentiteGaragePublique
  readonly statut: StatutOuverture
  /**
   * Faux : le pré-diagnostic n'est pas publié, aucune page ne lie
   * `/pre-diagnostic` (Kano D3). Absent : publié (le serveur le renseigne).
   */
  readonly preDiagnosticPublie?: boolean
}

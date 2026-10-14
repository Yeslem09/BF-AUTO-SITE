import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerAsyncHookHandler,
} from 'fastify'
import type { Html } from './html.js'
import type { VuePage } from './mise-en-page.js'

/** Outils que la couche web prête à chaque contexte pour répondre. */
export interface OutilsPage {
  /** Rend la vue dans la mise en page commune (en-tête, pied, statut) et l'envoie. */
  envoyerPage(reponse: FastifyReply, vue: VuePage): Promise<FastifyReply>
  /**
   * Crochet à poser en `preHandler` sur toute route de l'espace garagiste. Sans
   * session valide (cookie `NOM_COOKIE_SESSION`), une requête GET est redirigée
   * (303) vers la page de connexion avec `retour=<chemin demandé>`, toute autre
   * requête reçoit 401.
   */
  readonly exigerGaragiste: preHandlerAsyncHookHandler
  /**
   * Jeton anti-falsification à poser, dans le champ caché
   * `CHAMP_JETON_FORMULAIRE` (contrats), sur tout formulaire POST de l'espace
   * garagiste. Il est lié à la session du cookie : vide sans session valide,
   * si bien que l'envoi sera refusé.
   */
  jetonFormulaireGaragiste(requete: FastifyRequest): string
  /**
   * Crochet à poser en `preHandler`, après `exigerGaragiste`, sur tout POST de
   * l'espace garagiste : un envoi venu d'une autre origine, sans jeton, ou avec
   * le jeton d'une autre session reçoit 403 et la route ne s'exécute pas ;
   * rien n'est modifié.
   */
  readonly exigerFormulaireGaragiste: preHandlerAsyncHookHandler
}

/**
 * Emplacements de la page d'accueil, chacun fourni par un seul contexte :
 * garage fournit `statut`, `information`, `questions`, `garage` et `encart` ;
 * pre-diagnostic fournit `pre-diagnostic` ; catalogue fournit `recherche-pieces`
 * (bande d'ouverture) et `catalogue` (pleine largeur) ; demandes fournit `rappel`.
 * Disposition : docs/design/composants.md.
 */
export type EmplacementAccueil =
  | 'statut'
  | 'information'
  | 'pre-diagnostic'
  | 'recherche-pieces'
  | 'catalogue'
  | 'questions'
  | 'garage'
  | 'rappel'
  | 'encart'

/**
 * Rend le bloc d'un emplacement de l'accueil à l'instant donné. `null` : rien
 * à montrer à cet instant (donnée absente, rien de publié) ; l'emplacement est
 * alors absent de la page pour cette requête, sans cadre vide ni texte d'attente.
 */
export type RendreBlocAccueil = (maintenant: Date) => Promise<Html | null>

/**
 * Contrat d'un contexte auprès du serveur : un nom (pour les journaux), une
 * fonction qui enregistre ses routes et, s'il en fournit, ses blocs de la page
 * d'accueil. Le serveur ne connaît rien d'autre.
 */
export interface ModuleContexte {
  readonly nom: string
  enregistrer(app: FastifyInstance, outils: OutilsPage): void | Promise<void>
  readonly blocsAccueil?: Partial<Record<EmplacementAccueil, RendreBlocAccueil>>
}

/**
 * Anti-falsification partagée de l'espace garagiste (Kano D5, B-30) : tout
 * formulaire POST de l'espace, quel que soit le contexte qui le publie, porte
 * un jeton lié à la session et doit venir du site lui-même.
 */

/** Champ caché qui porte le jeton dans chaque formulaire POST de l'espace. */
export const CHAMP_JETON_FORMULAIRE = 'jeton_formulaire'

/** Ce qu'un envoi de formulaire présente pour être admis. */
export interface EnvoiFormulaireGaragiste {
  /** Valeur du cookie de session (`NOM_COOKIE_SESSION`), absente sans cookie. */
  readonly jetonSession: string | undefined
  /** Valeur reçue dans le champ `CHAMP_JETON_FORMULAIRE`, quelle qu'en soit la forme. */
  readonly jetonFormulaire: unknown
  /** En-tête `Origin` de la requête. */
  readonly origine: string | undefined
  /** En-tête `Referer`, repli des navigateurs qui n'envoient pas `Origin`. */
  readonly referent: string | undefined
  /** En-tête `Host`, tel que le navigateur l'a adressé. */
  readonly hote: string | undefined
}

/** Fournie par l'accès, branchée par la composition dans la couche web. */
export interface ProtectionFormulairesGaragiste {
  /** Jeton à poser dans un formulaire de la session désignée ; `null` sans session valide. */
  jeton(jetonSession: string | undefined): string | null
  /** Vrai si l'envoi vient d'une page du site et porte le jeton de sa propre session. */
  admettre(envoi: EnvoiFormulaireGaragiste): boolean
}

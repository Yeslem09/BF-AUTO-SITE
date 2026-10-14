/**
 * État des notifications de demande, pour la sonde de santé (Kano D5, D11) :
 * `degradee` quand au moins une notification échoue depuis plus d'une heure, ou
 * qu'un connecteur (envoi, lecture de la boîte) est en panne.
 */
export interface EtatNotifications {
  readonly etat: 'ok' | 'degradee'
  /** Demandes dont la notification échoue depuis plus d'une heure. */
  readonly echecsDurables: number
  /**
   * Connecteurs en panne (envoi de courriel, lecture de la boîte), nommés pour
   * la sonde (Kano connecteurs, C4) ; absent ou vide : aucun.
   */
  readonly connecteursEnEchec?: readonly string[]
}

/** Fournie par les demandes, lue par `/sante` : 503 tant que l'état est dégradé. */
export type SurveillerNotifications = () => Promise<EtatNotifications>

/** Rattache un courriel au fil d'une demande (Kano connecteurs, C3). */
export interface FilCourriel {
  /** Référence de la demande, `BF-XXXXXX`. */
  readonly reference: string
  /** 1 pour la notification, 2 pour la relance : le même rang renvoyé garde le même identifiant. */
  readonly rang: number
}

/** Un courriel en texte brut vers un seul destinataire. */
export interface CourrielSortant {
  readonly destinataire: string
  readonly objet: string
  readonly texte: string
  /** Absent : courriel sans demande (lien de connexion, signalement, essai sans référence). */
  readonly fil?: FilCourriel
}

export interface RemiseCourriel {
  /** Identifiant du message remis au serveur, `<...@...>`. */
  readonly identifiantMessage: string
}

/**
 * Remet un courriel au serveur d'envoi. Rejette une `ErreurConnecteur`
 * (nature et remède) en cas d'échec ; « remis au serveur » n'est pas « lu ».
 */
export interface ExpediteurCourriel {
  /** `smtp` : le courriel quitte le serveur ; `console` : il s'écrit dans le journal. */
  readonly canal: 'smtp' | 'console'
  envoyer(courriel: CourrielSortant): Promise<RemiseCourriel>
  /** Connexion et authentification, sans rien envoyer. */
  verifier(): Promise<void>
}

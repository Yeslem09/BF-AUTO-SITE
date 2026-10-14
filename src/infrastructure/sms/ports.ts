export const FOURNISSEURS_SMS = ['ovh', 'brevo', 'console'] as const

export type FournisseurSms = (typeof FOURNISSEURS_SMS)[number]

export interface SmsSortant {
  /** Numéro au format international E.164, par exemple `+33605922838`. */
  readonly destinataire: string
  /** Texte libre : il est converti dans l'alphabet GSM avant l'envoi. */
  readonly texte: string
}

export interface RemiseSms {
  /** Identifiant rendu par le fournisseur ; `null` en console. */
  readonly identifiant: string | null
  /** Nombre de SMS facturés pour ce message. */
  readonly segments: number
}

export interface EtatCompteSms {
  /** Crédits restants ; `null` quand le fournisseur ne le dit pas (jamais 0 par défaut). */
  readonly creditsRestants: number | null
}

/**
 * Envoie un SMS au garagiste (Kano connecteurs, C6). Rejette une
 * `ErreurConnecteur` en cas d'échec : le courriel, lui, part quand même.
 */
export interface EnvoiSms {
  readonly fournisseur: FournisseurSms
  envoyer(sms: SmsSortant): Promise<RemiseSms>
  /** Identifiants valides et crédits restants, sans rien envoyer. */
  verifier(): Promise<EtatCompteSms>
}

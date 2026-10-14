/**
 * Lecture de la boîte (Kano connecteurs, C5) : les réponses du garagiste à
 * une demande, et les rapports de non-remise des courriels du site. Rien
 * d'autre n'est lu, et rien n'est jamais modifié dans la boîte.
 */

/** Point de reprise : on ne relit jamais un message déjà vu. Gardé en base par l'appelant. */
export interface Filigrane {
  /** UIDVALIDITY du dossier : s'il change, les UID ont été renumérotés. */
  readonly validiteUid: string
  /** Plus grand UID déjà examiné. */
  readonly dernierUid: number
}

/** Seule commande qu'une réponse peut porter : ranger la demande « Traitée ». */
export type CommandeReponse = 'marquer-traitee'

/** Verdict d'authentification posé par le serveur de réception (`Authentication-Results`). */
export type Authentification = 'reussie' | 'echouee' | 'inconnue'

export interface ReponseRecue {
  readonly nature: 'reponse'
  readonly uid: number
  readonly recuLe: Date
  /** Références de demande portées par l'objet ou les en-têtes de fil. */
  readonly references: readonly string[]
  /** Adresse de l'expéditeur, en minuscules ; `null` si absente. */
  readonly expediteur: string | null
  /** Texte de la réponse, sans la citation ni la signature, borné. Jamais rendu à l'écran. */
  readonly texte: string
  /** `null` : la réponse n'est pas une commande (« Réponse reçue, non reconnue »). */
  readonly commande: CommandeReponse | null
  readonly authentification: Authentification
}

export interface NonRemiseRecue {
  readonly nature: 'non-remise'
  readonly uid: number
  readonly recuLe: Date
  readonly references: readonly string[]
  /** `echec` : le courriel n'arrivera pas ; `retard` : il est encore en cours de remise. */
  readonly action: 'echec' | 'retard'
  readonly destinataire: string | null
  /** Code d'état (par exemple 5.1.1) ; `null` si le rapport n'en donne pas. */
  readonly statut: string | null
  /** Motif du serveur, sur une ligne et borné ; `null` si absent. */
  readonly motif: string | null
}

export type MessageRecu = ReponseRecue | NonRemiseRecue

export interface Releve {
  readonly messages: readonly MessageRecu[]
  /** Filigrane à garder pour le prochain relevé. */
  readonly filigrane: Filigrane
  /** Messages retenus par le premier tri puis écartés (sans référence, envoi du site, répondeur). */
  readonly ecartes: number
  /** Messages qui n'ont pas pu être analysés : comptés, jamais relus en boucle. */
  readonly illisibles: number
  /** Vrai si l'UIDVALIDITY a changé : le relevé est reparti de la fin du dossier. */
  readonly reinitialise: boolean
}

export interface EtatBoite {
  readonly dossier: string
  readonly messages: number
}

export interface BoiteDeReception {
  /** Nouveaux messages référencés depuis le filigrane ; `null` au premier relevé (repart de la fin). */
  relever(filigrane: Filigrane | null): Promise<Releve>
  /** Diagnostic : messages référencés reçus depuis la date, sans filigrane ni modification. */
  listerRecents(depuis: Date): Promise<readonly MessageRecu[]>
  /** Connexion, authentification et ouverture du dossier en lecture seule. */
  verifier(): Promise<EtatBoite>
}

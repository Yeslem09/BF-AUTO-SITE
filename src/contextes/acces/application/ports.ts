import type { LienConnexion } from '../domaine/lien-connexion.js'
import type { Session } from '../domaine/session.js'

export interface Horloge {
  maintenant(): Date
}

/** Jeton opaque aléatoire (au moins 128 bits), en base64url. */
export interface GenerateurJeton {
  generer(): string
}

/** Empreinte à sens unique d'un jeton : seule forme stockée en base. */
export interface Hachage {
  empreinte(jeton: string): string
}

/** Liens de connexion et sessions, connus par l'empreinte de leur jeton. */
export interface DepotAcces {
  enregistrerLien(lien: LienConnexion): void
  trouverLien(empreinte: string): LienConnexion | null
  /**
   * Marque le lien utilisé et enregistre la session, d'un seul tenant. Faux si
   * le lien n'est plus utilisable à `maintenant` (déjà servi, expiré, inconnu) :
   * deux ouvertures simultanées du même lien n'ouvrent qu'une session.
   */
  echangerLienContreSession(empreinteLien: string, session: Session, maintenant: Date): boolean
  trouverSession(empreinte: string): Session | null
  prolongerSession(empreinte: string, expireLe: Date): void
  supprimerSession(empreinte: string): void
  /** Révoque toutes les sessions et tous les liens non encore utilisés. */
  toutRevoquer(): { readonly sessions: number; readonly liens: number }
  /** Oublie les sessions expirées et les liens au-delà de leur durée de conservation. */
  purger(maintenant: Date): void
}

/**
 * Mémoire courte des demandes de lien, pour la limitation par adresse et
 * l'alerte globale. Les instants antérieurs à `depuis` peuvent être oubliés.
 */
export interface RegistreDemandesLien {
  noterReception(instant: Date): void
  recuesDepuis(depuis: Date): readonly Date[]
  noterAcceptation(adresseClient: string, instant: Date): void
  accepteesDepuis(adresseClient: string, depuis: Date): readonly Date[]
  derniereAlerte(): Date | null
  noterAlerte(instant: Date): void
}

export interface MessageSortant {
  readonly destinataire: string
  readonly objet: string
  readonly texte: string
}

/** Envoi d'un message écrit (courriel, ou console en développement). */
export interface Messagerie {
  envoyer(message: MessageSortant): Promise<void>
}

/**
 * Ce que devient réellement un message confié à un canal, pour que l'écran ne
 * prétende jamais qu'un courriel est parti quand il ne l'est pas :
 * - `courriel` : il quitte le serveur vers la boîte du destinataire ;
 * - `journal` : aucun serveur d'envoi n'est configuré, il s'écrit seulement
 *   dans le journal du serveur (production ou relecture) ;
 * - `demonstration` : il s'écrit dans le journal, et la visite de
 *   démonstration doit pouvoir continuer sans boîte à lettres.
 */
export type Remise = 'courriel' | 'journal' | 'demonstration'

/** Un canal complet : un moyen d'envoi, une adresse qui le lit, et ce que devient le message. */
export interface Canal {
  readonly messagerie: Messagerie
  readonly destinataire: string
  readonly remise: Remise
}

/** Prévient Anthony d'un événement anormal ; ne lève jamais. */
export interface Alerteur {
  alerter(objet: string, texte: string): Promise<void>
}

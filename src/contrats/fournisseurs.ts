import type { ReferenceFamille } from './reference-famille.js'
import type { ResumePreDiagnostic } from './resume-pre-diagnostic.js'

/**
 * Capacités qu'un contexte offre aux autres, branchées par la racine de
 * composition. Le contexte appelant ne sait pas qui répond.
 */

/** Fournie par le catalogue : `null` si l'identifiant ne désigne aucune famille. */
export type TrouverFamille = (identifiant: string) => Promise<ReferenceFamille | null>

/**
 * Fournie par le catalogue : « Ce que nous ne faisons pas », publié selon le
 * mode, à dire avant qu'un client ne remplisse une demande (US-44).
 */
export type ListerCeQueNousNeFaisonsPas = () => Promise<readonly string[]>

/** Ce que le catalogue publie de son offre de pièces, pour la demande de devis. */
export interface OffrePieces {
  /** Engagement de vérification des pièces avant toute commande (AT-4, US-28) ; `null` s'il n'est pas publié. */
  readonly engagementVerification: string | null
  /**
   * Vente au comptoir publiée (arbitrage 4 du Kano) : le devis propose alors
   * « Retrait au garage » ou « Pose à l'atelier ».
   */
  readonly venteAuComptoir: boolean
}

/** Fournie par le catalogue, lue par le formulaire de devis. */
export type ConsulterOffrePieces = () => Promise<OffrePieces>

/**
 * Prix du socle tel que le catalogue, SEULE source des prix, le publie
 * (Kano AE-05) : déjà mis en mots, au format unique du site.
 */
export interface TarifPublie {
  /** « 45,00 € TTC », « À partir de 29,00 € TTC », ou « Gratuit » pour un premier contrôle à zéro euro. */
  readonly montant: string
  readonly gratuit: boolean
  /** Ce que le prix comprend, sans point final. */
  readonly comprend: string
  /** Date d'effet en toutes lettres : « 1er octobre 2026 ». */
  readonly dateEffet: string
  /** Durée annoncée (premier contrôle) : « 30 minutes environ » ; `null` sinon. */
  readonly duree: string | null
  /** Premier contrôle : `true` s'il est déduit du prix de la réparation confiée au garage ; `null` sinon. */
  readonly deduitDeLaReparation: boolean | null
  /**
   * Proposition calée sur le marché, pas encore confirmée par le garage :
   * jamais publiée en production, marquée en relecture.
   */
  readonly aValider: boolean
}

/** Exemple de prix d'une prestation courante (bloc atelier de l'accueil). */
export interface ExemplePrix {
  /** « Vidange », « Plaquettes avant posées ». */
  readonly intitule: string
  /** Au format unique du site : « À partir de 59,00 € TTC ». */
  readonly montant: string
  /** Véhicule de référence et date d'effet, en une ligne : « Citadine essence, prix au 1er octobre 2026 ». */
  readonly precision: string
  /** Page de la famille qui détaille la prestation. */
  readonly lien: string
  readonly aValider: boolean
}

/**
 * Taux horaire et premier contrôle, `null` tant que le prix n'est pas publié
 * dans le mode du site ; trois exemples au plus pour l'accueil, vide sinon.
 */
export interface TarifsDuSocle {
  readonly tauxHoraire: TarifPublie | null
  readonly premierControle: TarifPublie | null
  readonly exemples: readonly ExemplePrix[]
}

/** Fournie par le catalogue, lue par la zone « Vos questions » du garage. */
export type ConsulterTarifsDuSocle = () => Promise<TarifsDuSocle>

/**
 * Fournie par le pré-diagnostic : reconstitue un résumé à partir du code opaque
 * que le pré-diagnostic place dans son lien vers la demande. `null` si le code
 * est inconnu ou invalide.
 */
export type RetrouverResumePreDiagnostic = (code: string) => Promise<ResumePreDiagnostic | null>

/** Demi-journée d'ouverture que le client peut cocher dans une demande de rendez-vous. */
export interface DemiJourneeProposee {
  /** Code stable, par exemple `2026-09-24-matin`. */
  readonly code: string
  /** Libellé affiché, par exemple « Jeudi 24 septembre, matin ». */
  readonly libelle: string
}

/**
 * Fournie par le garage : les prochaines demi-journées d'ouverture à partir de
 * `maintenant`. Liste vide tant que les horaires ne sont pas confirmés.
 */
export type ProposerDemiJournees = (maintenant: Date) => Promise<readonly DemiJourneeProposee[]>

/**
 * Moments où le client peut répondre au téléphone (Kano D4), choisis dans
 * toute demande : le garage en tient compte pour annoncer son rappel (AT-3).
 */
export const MOMENTS_REPONSE = ['des-que-possible', 'matin', 'midi', 'fin-de-journee'] as const

export type MomentReponse = (typeof MOMENTS_REPONSE)[number]

/**
 * Fournie par le garage : phrase de suite annoncée après une demande envoyée
 * à `envoi` par un client joignable au `moment` indiqué (« Nous vous rappelons
 * jeudi, en fin de journée. »), ou `null` si aucun délai n'est validé.
 */
export type AnnoncerRappel = (envoi: Date, moment: MomentReponse) => Promise<string | null>

/**
 * Fournie par l'accès : `true` si le jeton (valeur du cookie de session,
 * absent si le cookie manque) désigne une session garagiste valide.
 */
export type VerifierSessionGaragiste = (jeton: string | undefined) => Promise<boolean>

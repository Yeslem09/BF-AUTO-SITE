import type {
  AdressePostale,
  CoordonneesGeographiques,
  TelephonePublic,
} from '../../../contrats/index.js'
import type { SemaineType } from './horaires.js'
import type { DelaiRappel } from './rappel.js'
import type { ValeurIndispensable, ValeurPubliee } from './valeur-publiee.js'

/** Photo réelle de la façade, servie depuis `public/img/garage/`. */
export interface PhotoFacade {
  readonly chemin: string
  readonly texteAlternatif: string
  readonly largeur: number
  readonly hauteur: number
}

export const MOYENS_PAIEMENT = ['carte', 'especes', 'cheque', 'virement'] as const

export type MoyenPaiement = (typeof MOYENS_PAIEMENT)[number]

export interface Hebergeur {
  readonly nom: string
  readonly adresse: string
  readonly telephone: string
}

export const ROLES_PRESTATAIRE = ['courriel', 'sms'] as const

export type RolePrestataire = (typeof ROLES_PRESTATAIRE)[number]

/** Prestataire qui achemine les messages (RGPD art. 13 : destinataires et lieu de traitement). */
export interface PrestataireEnvoi {
  readonly role: RolePrestataire
  readonly nom: string
  readonly lieuTraitement: string
}

export interface Mediateur {
  readonly nom: string
  readonly adresse: string
  /** Adresse https du site du médiateur (R616-1). */
  readonly site: string
}

export interface IdentiteGarage {
  readonly nom: ValeurIndispensable<string>
  /** Nom actuel de la fiche Google, avant son renommage en « BF Auto ». */
  readonly ancienNom: ValeurPubliee<string>
  readonly accroche: ValeurPubliee<string>
  /** Ce que fait l'atelier, en une phrase (« Mécanique, entretien, carrosserie et peinture, toutes marques »). */
  readonly activites: ValeurPubliee<string>
  readonly adresse: ValeurIndispensable<AdressePostale>
  readonly telephone: ValeurIndispensable<TelephonePublic>
  readonly courriel: ValeurPubliee<string>
  readonly coordonnees: ValeurPubliee<CoordonneesGeographiques>
}

/**
 * Socle de confiance du Kano D6 : tout y est bloquant pour la production. Le
 * taux horaire et le premier contrôle en font partie, mais vivent dans le
 * catalogue, seule source des prix (AE-05) : le garage les lit par contrat.
 */
export interface SocleDeConfiance {
  readonly prenomGaragiste: ValeurPubliee<string>
  readonly photoFacade: ValeurPubliee<PhotoFacade>
  readonly devisEcritAvantTravaux: ValeurPubliee<boolean>
  readonly appelAvantTravauxSupplementaires: ValeurPubliee<boolean>
  readonly accueilSansRendezVous: ValeurPubliee<boolean>
}

export interface InformationsPratiques {
  readonly piecesRemplaceesRestituees: ValeurPubliee<boolean>
  readonly moyensPaiement: ValeurPubliee<readonly MoyenPaiement[]>
  readonly documentsAApporter: ValeurPubliee<readonly string[]>
  readonly stationnement: ValeurPubliee<string>
  readonly attenteSurPlace: ValeurPubliee<string>
  /** Ce que porte la façade tant que l'enseigne n'indique pas « BF Auto ». */
  readonly enseigneActuelle: ValeurPubliee<string>
  readonly reperes: ValeurPubliee<readonly string[]>
  /**
   * Arrêts de transport en commun proches, relevés sur une source officielle
   * (données ouvertes d'Île-de-France Mobilités) : jamais de mémoire.
   */
  readonly transports: ValeurPubliee<readonly string[]>
}

export interface SuiviClient {
  readonly delaiRappel: ValeurPubliee<DelaiRappel>
  readonly lienAvisGoogle: ValeurPubliee<string>
  readonly lienGestionFicheGoogle: ValeurPubliee<string>
  readonly memeExploitant: ValeurPubliee<boolean>
}

/** Éditeur du site (LCEN art. 1-1 et 19). */
export interface Editeur {
  readonly raisonSociale: ValeurPubliee<string>
  readonly formeJuridique: ValeurPubliee<string>
  readonly capital: ValeurPubliee<string>
  readonly siege: ValeurPubliee<string>
  readonly registre: ValeurPubliee<string>
  /** Quatorze chiffres ; les neuf premiers forment le SIREN. */
  readonly siret: ValeurPubliee<string>
  readonly tva: ValeurPubliee<string>
  readonly directeurPublication: ValeurPubliee<string>
}

export interface Hebergement {
  readonly hebergeur: ValeurPubliee<Hebergeur>
  readonly region: ValeurPubliee<string>
  readonly prestatairesEnvoi: ValeurPubliee<readonly PrestataireEnvoi[]>
  /** Garantie qui encadre tout transfert hors de l'Union européenne (RGPD chapitre V). */
  readonly encadrementTransferts: ValeurPubliee<string>
}

/** Nom, marque et domaine (Kano D13) : bloquants pour la production. */
export interface Marque {
  /** Nom de domaine du site, sans protocole : « bfauto-choisy.fr ». */
  readonly nomDeDomaine: ValeurPubliee<string>
  /** Où est consignée la recherche d'antériorité INPI et TMview (classes 12, 35 et 37). */
  readonly anterioriteMarque: ValeurPubliee<string>
}

/** Tout ce que le fichier du garage déclare, chaque valeur avec son statut. */
export interface Garage {
  readonly identite: IdentiteGarage
  readonly horaires: ValeurPubliee<SemaineType>
  readonly socle: SocleDeConfiance
  readonly pratique: InformationsPratiques
  readonly suivi: SuiviClient
  readonly editeur: Editeur
  readonly hebergement: Hebergement
  readonly mediateur: ValeurPubliee<Mediateur>
  readonly marque: Marque
}

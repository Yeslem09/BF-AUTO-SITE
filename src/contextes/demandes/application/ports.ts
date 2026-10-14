import type { JetonLu, NatureJeton } from '../domaine/anti-abus.js'
import type { Demande, StatutDemande } from '../domaine/demande.js'
import type { EtatNotification } from '../domaine/etat-notification.js'
import type { MessageNotification } from '../domaine/message-notification.js'
import type { EvenementSuivi, SuiviCourriel } from '../domaine/suivi-courriel.js'

/** Donne l'instant présent. Horloge fixe ou pilotée dans les tests. */
export interface Horloge {
  maintenant(): Date
}

/** Journal applicatif : jamais de donnée personnelle dans les détails (identifiant de demande seulement). */
export interface Journal {
  info(message: string, details?: Readonly<Record<string, unknown>>): void
  avertir(message: string, details?: Readonly<Record<string, unknown>>): void
  erreur(message: string, details?: Readonly<Record<string, unknown>>): void
}

/** Jetons rattachés à une demande enregistrée. */
export interface JetonsDemande {
  /** Jeton du formulaire envoyé : un second envoi du même jeton ne crée pas de seconde demande. */
  readonly formulaire: string
  /** Jeton aléatoire de la page de confirmation, seule clé de `/demande/envoyee`. */
  readonly confirmation: string
}

/** Une ligne lue en base : la demande, ou le constat qu'elle est illisible, ou rien. */
export type LectureDemande =
  | { readonly etat: 'trouvee'; readonly demande: Demande }
  | { readonly etat: 'illisible' }
  | { readonly etat: 'absente' }

export interface ListeDemandes {
  readonly demandes: readonly Demande[]
  /** Identifiants des lignes illisibles : signalées, jamais masquées ni fatales à la liste. */
  readonly illisibles: readonly string[]
}

export type IssueEnregistrement = 'enregistree' | 'jeton-deja-utilise'

/** Stockage durable des demandes : conservé après un redémarrage (B-24, US-46). */
export interface DepotDemandes {
  enregistrer(demande: Demande, jetons: JetonsDemande): Promise<IssueEnregistrement>
  /** Jeton de confirmation de la demande déjà enregistrée avec ce jeton de formulaire. */
  confirmationDuFormulaire(jetonFormulaire: string): Promise<string | null>
  trouverParConfirmation(jetonConfirmation: string): Promise<LectureDemande>
  trouver(id: string): Promise<LectureDemande>
  /** Toutes les demandes à rappeler, et les traitées dont le statut a changé depuis la date donnée. */
  listerPourLeGaragiste(traiteesDepuis: Date): Promise<ListeDemandes>
  /** Les seules demandes « À rappeler » (compteur de l'espace, rappels promis). */
  listerARappeler(): Promise<ListeDemandes>
  /** Demandes reçues entre deux instants, bornes comprises, quel que soit leur statut (doublons). */
  listerRecuesEntre(debut: Date, fin: Date): Promise<ListeDemandes>
  /** Remplace la liste des appels restés sans réponse. */
  noterTentativesAppel(id: string, tentatives: readonly Date[]): Promise<void>
  noterPremiereConsultation(id: string, instant: Date): Promise<void>
  changerStatut(id: string, statut: StatutDemande, instant: Date): Promise<void>
  enregistrerNotification(id: string, notification: EtatNotification): Promise<void>
  /**
   * Demandes à rappeler dont la notification est à (re)faire : en échec avec
   * un essai échu, ou jamais tentée et reçue avant `enAttenteAvant` (le
   * service s'est arrêté entre l'enregistrement et l'envoi).
   */
  notificationsARenvoyer(echeance: Date, enAttenteAvant: Date): Promise<readonly string[]>
  /** Nombre de demandes à rappeler dont la notification échoue depuis avant la date donnée. */
  compterEchecsDepuis(avant: Date): Promise<number>
  /** Supprime les demandes dont la dernière activité précède la limite ; renvoie leur nombre. */
  purger(limite: Date): Promise<number>
  /** Note ce que la boîte du garage a appris de la demande (dernier événement de chaque nature). */
  noterSuiviCourriel(id: string, evenement: EvenementSuivi): Promise<void>
  suiviCourriel(id: string): Promise<SuiviCourriel>
}

/** Envois suspects montrés à l'écran « Confirmez l'envoi », comptés s'ils ne sont pas confirmés (D9). */
export interface RegistreEnvoisSuspects {
  /**
   * Note un envoi suspect sous le jeton de confirmation émis. `remplace` : le
   * jeton de confirmation précédent quand c'est la confirmation elle-même qui
   * est suspecte ; c'est le même envoi, compté une fois.
   */
  noter(jetonConfirmation: string, recuLe: Date, remplace: string | null): Promise<void>
  confirmer(jetonConfirmation: string, instant: Date): Promise<void>
  compterNonConfirmesDepuis(debut: Date): Promise<number>
  purger(limite: Date): Promise<number>
}

/** Remet le message au garagiste. Rejette en cas d'échec : la demande, elle, est déjà enregistrée. */
export interface Notificateur {
  readonly canal: string
  envoyer(message: MessageNotification): Promise<void>
}

/** SMS au garagiste pour une demande « Ne roulez pas » (Kano connecteurs, C6). Rejette en cas d'échec. */
export interface AlerteSms {
  envoyer(texte: string): Promise<void>
}

/** Ce que la boîte du garage rapporte d'une demande, sans son texte (Kano connecteurs, C5). */
export type EvenementBoite =
  | {
      readonly nature: 'reponse'
      readonly references: readonly string[]
      readonly recueLe: Date
      /** Adresse de l'expéditeur, en minuscules. */
      readonly expediteur: string | null
      /** Vrai si la réponse est « fait », « rappelé » ou « traité ». */
      readonly commandeTraitee: boolean
      /** Vrai si le serveur de réception signale un échec d'authentification. */
      readonly authentificationEchouee: boolean
    }
  | {
      readonly nature: 'non-remise'
      readonly references: readonly string[]
      readonly recueLe: Date
      readonly motif: string
    }

/** Un relevé : ses événements, et la confirmation qui fait avancer le point de reprise. */
export interface ReleveBoite {
  readonly evenements: readonly EvenementBoite[]
  /** À appeler une fois les événements appliqués : sans elle, le relevé suivant les rapporte encore. */
  confirmer(): Promise<void>
}

/** Nouveaux événements de la boîte depuis le relevé confirmé ; rejette si la boîte est injoignable. */
export interface SourceBoite {
  relever(): Promise<ReleveBoite>
}

/** Jetons signés par le serveur : ni forgeables ni modifiables sans la clé. */
export interface SignatureJetons {
  emettre(nature: NatureJeton, emisLe: Date): string
  /** `null` si le jeton manque, est mal formé ou a été altéré. */
  lire(jeton: string): JetonLu | null
}

export interface GenerateurAleas {
  /** Identifiant de demande, aléatoire et non séquentiel (AE-40). */
  identifiant(): string
  /** Jeton de confirmation : 128 bits d'aléa (US-12). */
  jetonConfirmation(): string
}

/** Compte les envois par adresse client sur une fenêtre glissante (D9, US-47). */
export interface LimiteurEnvois {
  estAtteinte(cle: string, instant: Date): boolean
  compter(cle: string, instant: Date): void
}

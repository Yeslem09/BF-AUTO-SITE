/**
 * Outils de test du contexte demandes : horloge pilotée, journal et
 * notificateur en mémoire, saisies valides, et un environnement complet sur
 * une vraie base SQLite (en mémoire ou sur disque) plutôt qu'une doublure du
 * dépôt, plus permissive que la production (piège 19). Réservé aux tests.
 */
import type {
  DemiJourneeProposee,
  NiveauUrgence,
  OffrePieces,
  ResumePreDiagnostic,
  TypeDemande,
} from '../../contrats/index.js'
import { creerSignatureJetonsHmac } from './adaptateurs/jetons/signature-jetons-hmac.js'
import { aleasCrypto } from './adaptateurs/jetons/aleas-crypto.js'
import { creerLimiteurMemoire } from './adaptateurs/memoire/limiteur-memoire.js'
import { BASE_EN_MEMOIRE, ouvrirBaseDemandes, type Base } from './adaptateurs/sqlite/base.js'
import { lireOuCreerCleJetons } from './adaptateurs/sqlite/cle-sqlite.js'
import { creerDepotDemandesSqlite } from './adaptateurs/sqlite/depot-demandes-sqlite.js'
import { creerRegistreEnvoisSuspectsSqlite } from './adaptateurs/sqlite/registre-envois-suspects-sqlite.js'
import { creerEnvoyerDemande } from './application/envoyer-demande.js'
import { creerNotifierDemande } from './application/notifier-demande.js'
import type {
  DepotDemandes,
  Horloge,
  Journal,
  Notificateur,
  RegistreEnvoisSuspects,
  SignatureJetons,
} from './application/ports.js'
import { creerPreparerFormulaire } from './application/preparer-formulaire.js'
import type { MessageNotification } from './domaine/message-notification.js'
import type { SaisieDemande } from './domaine/validation.js'

export interface HorlogePilotee extends Horloge {
  avancer(millisecondes: number): void
  regler(instant: Date): void
}

export function horlogePilotee(depart: Date): HorlogePilotee {
  let instant = new Date(depart.getTime())
  return {
    maintenant: () => new Date(instant.getTime()),
    avancer: (millisecondes) => {
      instant = new Date(instant.getTime() + millisecondes)
    },
    regler: (nouvel) => {
      instant = new Date(nouvel.getTime())
    },
  }
}

export interface LigneJournal {
  readonly niveau: 'info' | 'avertir' | 'erreur'
  readonly message: string
  readonly details: Readonly<Record<string, unknown>> | undefined
}

export function journalMemoire(): Journal & { readonly lignes: LigneJournal[] } {
  const lignes: LigneJournal[] = []
  return {
    lignes,
    info: (message, details) => lignes.push({ niveau: 'info', message, details }),
    avertir: (message, details) => lignes.push({ niveau: 'avertir', message, details }),
    erreur: (message, details) => lignes.push({ niveau: 'erreur', message, details }),
  }
}

export interface NotificateurMemoire extends Notificateur {
  readonly messages: MessageNotification[]
  /** Nombre d'envois tentés, réussis ou non. */
  readonly essais: () => number
  /** `true` : chaque envoi échoue, comme un serveur de courriel injoignable. */
  enPanne(panne: boolean): void
}

export function notificateurMemoire(): NotificateurMemoire {
  const messages: MessageNotification[] = []
  let panne = false
  let essais = 0
  return {
    canal: 'essai',
    messages,
    essais: () => essais,
    enPanne: (etat) => {
      panne = etat
    },
    async envoyer(message) {
      essais += 1
      if (panne) throw new Error('Serveur de courriel injoignable')
      messages.push(message)
    },
  }
}

/** Mercredi 16 septembre 2026, 10 h à Paris. */
export const INSTANT_ESSAI = new Date('2026-09-16T08:00:00.000Z')

export const DEMI_JOURNEES_ESSAI: readonly DemiJourneeProposee[] = [
  { code: '2026-09-17-matin', libelle: 'Jeudi 17 septembre, matin' },
  { code: '2026-09-17-apres-midi', libelle: 'Jeudi 17 septembre, après-midi' },
  { code: '2026-09-18-matin', libelle: 'Vendredi 18 septembre, matin' },
]

export const FAMILLE_ESSAI = { identifiant: 'freinage', libelle: 'Freinage' }

/** « Ce que nous ne faisons pas » tel que le catalogue d'essai le publie. */
export const EXCLUSIONS_ESSAI: readonly string[] = [
  'Carrosserie et peinture',
  'Véhicules de plus de 3,5 tonnes',
]

/** Offre de pièces du catalogue d'essai : engagement de vérification et vente au comptoir publiés. */
export const OFFRE_PIECES_ESSAI: OffrePieces = {
  engagementVerification:
    'Avant de commander une pièce, nous vérifions qu’elle convient à votre véhicule.',
  venteAuComptoir: true,
}

export function resumeEssai(urgence: NiveauUrgence = 'ne-pas-rouler'): ResumePreDiagnostic {
  return {
    symptome: { identifiant: 'freinage', libelle: 'Un bruit ou une sensation au freinage' },
    reponses: [
      { question: 'La pédale de frein est-elle molle ?', reponse: 'Oui, elle s’enfonce' },
      { question: 'Depuis quand ?', reponse: 'Depuis ce matin' },
    ],
    urgence,
    conclusion: 'Le circuit de freinage doit être contrôlé avant de reprendre la route.',
  }
}

/** Saisie valide d'un type donné : chaque test ne change que ce qu'il éprouve. */
export function saisieEssai(
  type: TypeDemande,
  surcharges: Partial<SaisieDemande> = {},
): SaisieDemande {
  const communs: SaisieDemande = {
    type,
    objet: '',
    motif: '',
    creneaux: [],
    pieces: [],
    plaque: '',
    marque: '',
    modele: '',
    annee: '',
    energie: '',
    gamme: '',
    modalite: '',
    precisions: '',
    prenom: 'Julie',
    telephone: '06 12 34 56 78',
    moment: 'fin-de-journee',
  }
  const parType: Readonly<Record<TypeDemande, Partial<SaisieDemande>>> = {
    'rendez-vous': { objet: 'entretien', creneaux: ['2026-09-17-matin'], marque: 'peugeot' },
    devis: { objet: 'reparation', plaque: 'AB-123-CD' },
    rappel: { motif: 'souci' },
  }
  return { ...communs, ...parType[type], ...surcharges }
}

export interface EnvironnementEssai {
  readonly base: Base
  readonly horloge: HorlogePilotee
  readonly journal: ReturnType<typeof journalMemoire>
  readonly notificateur: NotificateurMemoire
  readonly depot: DepotDemandes
  readonly registre: RegistreEnvoisSuspects
  readonly jetons: SignatureJetons
  readonly envoyerDemande: ReturnType<typeof creerEnvoyerDemande>
  readonly notifierDemande: ReturnType<typeof creerNotifierDemande>
  readonly preparerFormulaire: ReturnType<typeof creerPreparerFormulaire>
}

/** Cas d'usage réels branchés sur une vraie base SQLite et des doublures d'horloge et d'envoi. */
export function environnementEssai(chemin: string = BASE_EN_MEMOIRE): EnvironnementEssai {
  const base = ouvrirBaseDemandes(chemin)
  const horloge = horlogePilotee(INSTANT_ESSAI)
  const journal = journalMemoire()
  const notificateur = notificateurMemoire()
  const depot = creerDepotDemandesSqlite(base)
  const registre = creerRegistreEnvoisSuspectsSqlite(base)
  const jetons = creerSignatureJetonsHmac(lireOuCreerCleJetons(base))
  const preparerFormulaire = creerPreparerFormulaire({
    horloge,
    jetons,
    journal,
    trouverFamille: async (identifiant) =>
      identifiant === FAMILLE_ESSAI.identifiant ? FAMILLE_ESSAI : null,
    retrouverResumePreDiagnostic: async (code) =>
      code === 'code-urgent'
        ? resumeEssai('ne-pas-rouler')
        : code === 'code-leger'
          ? resumeEssai('sans-urgence')
          : null,
    proposerDemiJournees: async () => DEMI_JOURNEES_ESSAI,
    listerCeQueNousNeFaisonsPas: async () => EXCLUSIONS_ESSAI,
    consulterOffrePieces: async () => OFFRE_PIECES_ESSAI,
  })
  const notifierDemande = creerNotifierDemande({
    depot,
    notificateur,
    horloge,
    journal,
    lienFiche: (id) => `https://garage.exemple/garagiste/demandes/${id}`,
  })
  const envoyerDemande = creerEnvoyerDemande({
    preparerFormulaire,
    depot,
    registre,
    jetons,
    aleas: aleasCrypto,
    limiteur: creerLimiteurMemoire(),
    horloge,
    journal,
    notifierDemande,
  })
  return {
    base,
    horloge,
    journal,
    notificateur,
    depot,
    registre,
    jetons,
    envoyerDemande,
    notifierDemande,
    preparerFormulaire,
  }
}

export const DELAI_HUMAIN_MS = 4_000

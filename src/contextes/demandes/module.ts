import { join } from 'node:path'
import type {
  AnnoncerRappel,
  CompterDemandesARappeler,
  ConsulterOffrePieces,
  GarageFermeAujourdhui,
  IdentiteGaragePublique,
  ListerCeQueNousNeFaisonsPas,
  ListerRappelsPromis,
  ModeSite,
  ProposerDemiJournees,
  RetrouverResumePreDiagnostic,
  SurveillerNotifications,
  TrouverFamille,
} from '../../contrats/index.js'
import type { ModuleContexte } from '../../web/index.js'
import { chargerParametresDemandes } from './adaptateurs/fichier/parametres-fichier.js'
import { aleasCrypto } from './adaptateurs/jetons/aleas-crypto.js'
import { creerSignatureJetonsHmac } from './adaptateurs/jetons/signature-jetons-hmac.js'
import { creerLimiteurMemoire } from './adaptateurs/memoire/limiteur-memoire.js'
import { creerExpediteurConsole } from '../../infrastructure/courriel/envoi/expediteur-console.js'
import type { ExpediteurCourriel } from '../../infrastructure/courriel/envoi/ports.js'
import type { BoiteDeReception } from '../../infrastructure/courriel/lecture/ports.js'
import type { EnvoiSms } from '../../infrastructure/sms/ports.js'
import { creerSourceBoite } from './adaptateurs/courriel/source-boite.js'
import { creerAlerteSms } from './adaptateurs/notification/alerte-sms.js'
import {
  creerNotificateurCourriel,
  notificateurIndisponible,
} from './adaptateurs/notification/notificateur-courriel.js'
import { creerDepotFiligraneSqlite } from './adaptateurs/sqlite/filigrane-sqlite.js'
import { ouvrirBaseDemandes } from './adaptateurs/sqlite/base.js'
import { lireOuCreerCleJetons } from './adaptateurs/sqlite/cle-sqlite.js'
import { creerDepotDemandesSqlite } from './adaptateurs/sqlite/depot-demandes-sqlite.js'
import { creerRegistreEnvoisSuspectsSqlite } from './adaptateurs/sqlite/registre-envois-suspects-sqlite.js'
import { horlogeSysteme } from './adaptateurs/systeme/horloge-systeme.js'
import { creerJournalFastify } from './adaptateurs/systeme/journal-fastify.js'
import { creerJournalRelais } from './adaptateurs/systeme/journal-relais.js'
import { demarrerTachesDeFond } from './adaptateurs/systeme/taches-de-fond.js'
import { cheminFiche } from './adaptateurs/web/adresses.js'
import { enregistrerRoutesGaragiste } from './adaptateurs/web/routes-garagiste.js'
import { enregistrerRoutesPubliques } from './adaptateurs/web/routes-publiques.js'
import { blocRappel } from './adaptateurs/web/vues/bloc-rappel.js'
import type { GarageAffiche } from './adaptateurs/web/vues/communs.js'
import {
  creerCompterDemandesARappeler,
  creerListerRappelsPromis,
} from './application/capacites-espace.js'
import { creerChangerStatut } from './application/changer-statut.js'
import { creerChangerType } from './application/changer-type.js'
import { creerConsulterConfirmation } from './application/consulter-confirmation.js'
import { creerConsulterFiche } from './application/consulter-fiche.js'
import { creerEnvoyerDemande } from './application/envoyer-demande.js'
import { creerListerDemandes } from './application/lister-demandes.js'
import { creerNotifierDemande } from './application/notifier-demande.js'
import { creerAnnulerTentative, creerNoterTentative } from './application/noter-tentative.js'
import type { Horloge, Notificateur } from './application/ports.js'
import { creerPreparerFormulaire } from './application/preparer-formulaire.js'
import { creerPromettreRappel } from './application/promettre-rappel.js'
import { creerPurgerDemandes } from './application/purger-demandes.js'
import { creerReleverBoite } from './application/relever-boite.js'
import { creerRenvoyerNotifications } from './application/renvoyer-notifications.js'
import { creerSurveillerNotifications } from './application/surveiller-notifications.js'
import { numeroRappelAffiche } from './domaine/numero-rappel.js'

/** Connecteurs partagés (src/infrastructure) que la composition branche sur les demandes. */
export interface ConnecteursDemandes {
  /** Envoi de courriel ; `null` : console hors production, échec visible en production. */
  readonly expediteur: ExpediteurCourriel | null
  /** Lecture de la boîte (réponses « fait », non-remises) ; `null` : désactivée. */
  readonly lecture: {
    readonly boite: BoiteDeReception
    readonly dossier: string
    readonly intervalleSecondes: number
    /** Adresses dont une commande « fait » est acceptée (le garage, la boîte lue). */
    readonly expediteursAdmis: readonly string[]
  } | null
  /** SMS « Ne roulez pas » ; `null` : désactivé. */
  readonly sms: { readonly envoi: EnvoiSms; readonly destinataire: string } | null
}

/** Aucun connecteur : console hors production (tests, démonstration sans configuration). */
export const SANS_CONNECTEURS: ConnecteursDemandes = { expediteur: null, lecture: null, sms: null }

/** Ce que la racine de composition fournit aux demandes. */
export interface DependancesDemandes {
  /** Mode du site : production, relecture ou demonstration (contrat ModeSite). */
  readonly mode: ModeSite
  /** Fichier SQLite des demandes reçues. */
  readonly cheminBase: string
  /** Destinataire des notifications de nouvelle demande. `null` : pas encore connu. */
  readonly courrielGarage: string | null
  readonly connecteurs: ConnecteursDemandes
  /** Fourni par le catalogue : `/demande?type=devis&famille=<identifiant>`. */
  readonly trouverFamille: TrouverFamille
  /** Fourni par le catalogue : « Ce que nous ne faisons pas », au-dessus du formulaire (US-44). */
  readonly listerCeQueNousNeFaisonsPas: ListerCeQueNousNeFaisonsPas
  /** Fourni par le catalogue : engagement de vérification des pièces, sur le devis (US-28). */
  readonly consulterOffrePieces: ConsulterOffrePieces
  /** Fourni par le pré-diagnostic : `/demande?type=rappel&prediagnostic=<code>`. */
  readonly retrouverResumePreDiagnostic: RetrouverResumePreDiagnostic
  /** Fourni par le garage : demi-journées à cocher pour un rendez-vous (vide tant que rien n'est confirmé). */
  readonly proposerDemiJournees: ProposerDemiJournees
  /** Fourni par le garage : phrase de suite après l'envoi, ou `null` si aucun délai n'est validé. */
  readonly annoncerRappel: AnnoncerRappel
  /** Dossier des données versionnées (variable CHEMIN_DONNEES), où se trouve `demandes.json`. */
  readonly cheminDonnees: string
  /** Origine publique du site (URL_PUBLIQUE), pour le lien absolu vers la fiche dans la notification. */
  readonly urlPublique: string
  /**
   * Identité du garage (fournie par le contexte garage) : nom et téléphone
   * dans la confirmation, la mention sur les données et les refus.
   */
  readonly fournirIdentite: () => Promise<IdentiteGaragePublique>
  /** Horloge partagée du site (fixe pour les captures). Absente : l'horloge système. */
  readonly horloge?: Horloge
  /**
   * Fourni par le garage : le garage est-il fermé aujourd'hui ? La liste et
   * l'accueil de l'espace disent alors les rappels promis à reporter. Absent :
   * rien n'est dit de la fermeture.
   */
  readonly garageFermeAujourdhui?: GarageFermeAujourdhui
}

export interface ContexteDemandes {
  readonly module: ModuleContexte
  /**
   * État des notifications pour la sonde de santé : `degradee` quand une
   * notification échoue depuis plus d'une heure (D5, US-16) ; `/sante` répond
   * alors 503.
   */
  readonly surveillerNotifications: SurveillerNotifications
  /**
   * Offert à l'accès (accueil de l'espace garagiste) : « 3 à rappeler, dont 1
   * Ne roulez pas », le nombre de la liste des demandes (contrat).
   */
  readonly compterDemandesARappeler: CompterDemandesARappeler
  /**
   * Offert au garage (fermetures exceptionnelles) : les rappels promis pour
   * une date, ou une période, et pas encore faits, pour prévenir le garagiste
   * qui ferme ce jour-là (contrat `ListerRappelsPromis`). Branché par la
   * racine de composition, par un appel différé : le garage est assemblé avant.
   */
  readonly listerRappelsPromis: ListerRappelsPromis
}

const FICHIER_PARAMETRES = 'demandes.json'
const MILLISECONDES_PAR_SECONDE = 1_000

/** Destinataire d'essai hors production quand COURRIEL_GARAGE manque : il ne désigne personne. */
const DESTINATAIRE_CONSOLE = 'garage@demonstration.invalid'

/**
 * Canal de notification (D5) : courriel si l'envoi et le destinataire sont
 * connus ; sinon la console hors production, et en production un échec
 * visible plutôt qu'une réussite silencieuse.
 */
function choisirNotificateur(dependances: DependancesDemandes): Notificateur {
  const { connecteurs, courrielGarage, mode } = dependances
  const options = { invitationReponse: connecteurs.lecture !== null }
  if (connecteurs.expediteur !== null && courrielGarage !== null) {
    return creerNotificateurCourriel(connecteurs.expediteur, courrielGarage, options)
  }
  if (mode === 'production') return notificateurIndisponible
  return creerNotificateurCourriel(
    creerExpediteurConsole((texte) => console.info(texte)),
    courrielGarage ?? DESTINATAIRE_CONSOLE,
    options,
  )
}

/**
 * Assemble le contexte demandes. Le fichier de paramètres est validé et la
 * base ouverte ici : en cas de problème, le serveur ne démarre pas.
 */
export async function assemblerDemandes(
  dependances: DependancesDemandes,
): Promise<ContexteDemandes> {
  const horloge = dependances.horloge ?? horlogeSysteme
  const { garageFermeAujourdhui } = dependances
  const parametres = await chargerParametresDemandes(
    join(dependances.cheminDonnees, FICHIER_PARAMETRES),
  )
  const base = ouvrirBaseDemandes(dependances.cheminBase)
  const depot = creerDepotDemandesSqlite(base)
  const registre = creerRegistreEnvoisSuspectsSqlite(base)
  const jetons = creerSignatureJetonsHmac(lireOuCreerCleJetons(base))
  const journal = creerJournalRelais()
  const notificateur = choisirNotificateur(dependances)
  const { urlPublique } = dependances

  const { lecture, sms } = dependances.connecteurs
  const notifierDemande = creerNotifierDemande({
    depot,
    notificateur,
    horloge,
    journal,
    lienFiche: (id) => `${urlPublique}${cheminFiche(id)}`,
    ...(sms === null ? {} : { alerteSms: creerAlerteSms(sms.envoi, sms.destinataire) }),
  })
  const releverBoite =
    lecture === null
      ? null
      : creerReleverBoite({
          depot,
          source: creerSourceBoite(lecture.boite, creerDepotFiligraneSqlite(base), lecture.dossier),
          horloge,
          journal,
          expediteursAdmis: lecture.expediteursAdmis,
        })
  const preparerFormulaire = creerPreparerFormulaire({
    horloge,
    jetons,
    journal,
    trouverFamille: dependances.trouverFamille,
    listerCeQueNousNeFaisonsPas: dependances.listerCeQueNousNeFaisonsPas,
    consulterOffrePieces: dependances.consulterOffrePieces,
    retrouverResumePreDiagnostic: dependances.retrouverResumePreDiagnostic,
    proposerDemiJournees: dependances.proposerDemiJournees,
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
    promettreRappel: creerPromettreRappel({
      annoncerRappel: dependances.annoncerRappel,
      proposerDemiJournees: dependances.proposerDemiJournees,
      journal,
    }),
  })
  const consulterConfirmation = creerConsulterConfirmation({
    depot,
    horloge,
    journal,
    annoncerRappel: dependances.annoncerRappel,
  })
  const taches = {
    renvoyerNotifications: creerRenvoyerNotifications({ depot, horloge, notifierDemande }),
    purgerDemandes: creerPurgerDemandes({ depot, registre, horloge, journal }),
    ...(releverBoite === null || lecture === null
      ? {}
      : {
          releverBoite: {
            executer: () => releverBoite.relever(),
            intervalleMs: lecture.intervalleSecondes * MILLISECONDES_PAR_SECONDE,
          },
        }),
  }
  const garage = async (): Promise<GarageAffiche> => ({
    identite: await dependances.fournirIdentite(),
  })

  return {
    module: {
      nom: 'demandes',
      enregistrer: (app, outils) => {
        journal.brancher(creerJournalFastify(app.log))
        if (notificateur === notificateurIndisponible) {
          journal.avertir(
            'Demandes : aucun canal de notification en production (SMTP_UTILISATEUR, SMTP_MOT_DE_PASSE, COURRIEL_GARAGE) ; chaque demande sera marquée « Notification non envoyée ».',
          )
        }
        enregistrerRoutesPubliques(app, outils, {
          preparerFormulaire,
          envoyerDemande,
          consulterConfirmation,
          changerType: creerChangerType({ preparerFormulaire, jetons }),
          garage,
          numeroRappel: numeroRappelAffiche(parametres.numeroRappel, dependances.mode),
        })
        enregistrerRoutesGaragiste(app, outils, {
          listerDemandes: creerListerDemandes({
            depot,
            registre,
            horloge,
            ...(garageFermeAujourdhui === undefined ? {} : { garageFermeAujourdhui }),
          }),
          consulterFiche: creerConsulterFiche({ depot, horloge }),
          changerStatut: creerChangerStatut({ depot, horloge, journal }),
          noterTentative: creerNoterTentative({ depot, horloge, journal }),
          annulerTentative: creerAnnulerTentative({ depot, horloge, journal }),
          horloge,
        })
        demarrerTachesDeFond(app, taches, journal)
        app.addHook('onClose', async () => {
          base.close()
        })
      },
      blocsAccueil: {
        rappel: async () =>
          blocRappel(await garage(), jetons.emettre('formulaire', horloge.maintenant())),
      },
    },
    compterDemandesARappeler: creerCompterDemandesARappeler({
      depot,
      cheminFiche,
      horloge,
      ...(garageFermeAujourdhui === undefined ? {} : { garageFermeAujourdhui }),
    }),
    listerRappelsPromis: creerListerRappelsPromis({ depot, cheminFiche }),
    surveillerNotifications: creerSurveillerNotifications({
      depot,
      horloge,
      ...(releverBoite === null ? {} : { releveEnEchecDepuis: () => releverBoite.enEchecDepuis() }),
    }),
  }
}

import { randomBytes } from 'node:crypto'
import type {
  CompterDemandesARappeler,
  ModeSite,
  ProtectionFormulairesGaragiste,
  VerifierSessionGaragiste,
} from '../../contrats/index.js'
import type { ModuleContexte } from '../../web/index.js'
import { avertissementsDeDemarrage, choisirCanaux } from './adaptateurs/configuration/canaux.js'
import type { ReglagesAcces } from './adaptateurs/configuration/reglages.js'
import { generateurJetonAleatoire, hachageSha256 } from './adaptateurs/crypto/jetons.js'
import { horlogeSysteme } from './adaptateurs/horloge/horloge-systeme.js'
import { creerRegistreDemandesMemoire } from './adaptateurs/memoire/registre-demandes-memoire.js'
import { creerAlerteur } from './adaptateurs/messagerie/alerteur.js'
import { creerMessagerieConsole } from './adaptateurs/messagerie/messagerie-console.js'
import { creerMessagerieCourriel } from './adaptateurs/messagerie/messagerie-courriel.js'
import { creerDepotAccesSqlite } from './adaptateurs/sqlite/depot-acces-sqlite.js'
import {
  creerProtectionFormulaires,
  creerProtectionPartagee,
} from './adaptateurs/web/anti-falsification.js'
import { adresseDuLien } from './adaptateurs/web/chemins-acces.js'
import { enregistrerRoutesAcces } from './adaptateurs/web/routes.js'
import { creerDemanderLienConnexion } from './application/demander-lien-connexion.js'
import { creerExaminerLien } from './application/examiner-lien.js'
import { creerFermerSession } from './application/fermer-session.js'
import { creerIdentifierSession } from './application/identifier-session.js'
import { creerOuvrirSession } from './application/ouvrir-session.js'
import type { GenerateurJeton, Horloge, Messagerie } from './application/ports.js'
import { creerSignalerChangement } from './application/signaler-changement.js'

/**
 * Secret des jetons anti-falsification : tiré au premier démarrage puis gardé
 * dans la base, pour qu'un formulaire ouvert avant un déploiement reste accepté.
 */
const SECRET_FORMULAIRES = 'formulaires'
const OCTETS_SECRET_FORMULAIRES = 32

/** Ce que la racine de composition fournit à l'accès. */
export interface DependancesAcces {
  /** Mode du site : production, relecture ou demonstration (contrat ModeSite). */
  readonly mode: ModeSite
  /** Fichier SQLite partagé avec les demandes ; l'accès y tient ses tables `acces_*`. */
  readonly cheminBase: string
  /** Origine publique, adresses et serveur d'envoi, transmis par la composition. */
  readonly reglages: ReglagesAcces
  /**
   * Fourni par les demandes : « 3 à rappeler, dont 1 Ne roulez pas » sur
   * l'accueil de l'espace. Absent : l'accueil ne dit rien des demandes.
   */
  readonly compterDemandesARappeler?: CompterDemandesARappeler
  /** Remplacements pour les tests : horloge fixe, aléa prévisible, envoi retenu. */
  readonly horloge?: Horloge
  readonly generateur?: GenerateurJeton
  readonly messagerie?: Messagerie
}

export interface ContexteAcces {
  readonly module: ModuleContexte
  /** Offert à la couche web : valide le jeton du cookie de session garagiste. */
  readonly verifierSession: VerifierSessionGaragiste
  /**
   * Offert à la couche web, pour tous les formulaires de l'espace (fermetures,
   * demandes) : jeton lié à la session et vérification de la provenance.
   */
  readonly protectionFormulairesGaragiste: ProtectionFormulairesGaragiste
}

/**
 * Assemble l'accès à l'espace garagiste : connexion par lien sans mot de passe,
 * sessions de 90 jours glissants révocables, protection anti-falsification des
 * formulaires, tableau de bord et signalement d'un changement (Kano D5, US-33,
 * US-49). Des réglages invalides font échouer l'assemblage : le site ne démarre pas.
 */
export async function assemblerAcces(dependances: DependancesAcces): Promise<ContexteAcces> {
  const { mode } = dependances
  const { reglages } = dependances
  const horloge = dependances.horloge ?? horlogeSysteme
  const generateur = dependances.generateur ?? generateurJetonAleatoire
  const hachage = hachageSha256
  const depot = creerDepotAccesSqlite(dependances.cheminBase)
  depot.purger(horloge.maintenant())
  const protection = creerProtectionFormulaires(
    depot.secret(SECRET_FORMULAIRES, () => randomBytes(OCTETS_SECRET_FORMULAIRES)),
  )

  const messagerieConsole = dependances.messagerie ?? creerMessagerieConsole()
  const messagerieSmtp =
    dependances.messagerie ??
    (reglages.expediteur === null ? null : creerMessagerieCourriel(reglages.expediteur))
  const canaux = choisirCanaux(mode, reglages, {
    console: messagerieConsole,
    smtp: messagerieSmtp,
  })

  const identifierSession = creerIdentifierSession({ depot, hachage, horloge })
  const casUsage = {
    demanderLien: creerDemanderLienConnexion({
      depot,
      generateur,
      hachage,
      horloge,
      registre: creerRegistreDemandesMemoire(),
      canalGaragiste: canaux.canalGaragiste,
      alerteur: creerAlerteur(canaux.canalResponsable),
      adresseDuLien: (jeton: string) => adresseDuLien(reglages.urlPublique, jeton),
    }),
    examinerLien: creerExaminerLien({ depot, hachage, horloge }),
    ouvrirSession: creerOuvrirSession({ depot, generateur, hachage, horloge }),
    identifierSession,
    fermerSession: creerFermerSession({ depot }),
    signalerChangement: creerSignalerChangement({ canalResponsable: canaux.canalResponsable }),
  }

  return {
    module: {
      nom: 'acces',
      enregistrer: (app, outils) => {
        for (const avertissement of avertissementsDeDemarrage(mode, reglages)) {
          app.log.warn(avertissement)
        }
        app.addHook('onClose', async () => depot.fermer())
        enregistrerRoutesAcces(app, outils, casUsage, {
          urlPublique: reglages.urlPublique,
          canalGaragisteDisponible: canaux.canalGaragiste !== null,
          canalResponsableDisponible: canaux.canalResponsable !== null,
          protection,
          horloge,
          ...(dependances.compterDemandesARappeler === undefined
            ? {}
            : { compterDemandesARappeler: dependances.compterDemandesARappeler }),
        })
      },
    },
    verifierSession: async (jeton) => identifierSession(jeton) !== null,
    protectionFormulairesGaragiste: creerProtectionPartagee({
      protection,
      sessionDe: identifierSession,
      originePublique: reglages.urlPublique,
    }),
  }
}

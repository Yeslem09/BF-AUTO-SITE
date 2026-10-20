import type { FastifyBaseLogger } from 'fastify'
import type {
  AnnoncerRappel,
  ConsulterTarifsDuSocle,
  GarageFermeAujourdhui,
  ModeSite,
  PreDiagnosticPublie,
  ProposerDemiJournees,
} from '../../contrats/index.js'
import { html, type CadrePage, type ModuleContexte } from '../../web/index.js'
import { creerSourceIdentiteFichier } from './adaptateurs/fichier/source-identite-fichier.js'
import { creerDepotFermeturesSqlite } from './adaptateurs/sqlite/depot-fermetures-sqlite.js'
import { enregistrerRoutesGaragiste } from './adaptateurs/web/routes-garagiste.js'
import { enregistrerRoutesPubliques } from './adaptateurs/web/routes.js'
import {
  blocEncart,
  blocGarage,
  blocInformation,
  blocQuestions,
  blocStatut,
} from './adaptateurs/web/vues/blocs-accueil.js'
import { creerAnnoncerRappel } from './application/annoncer-rappel.js'
import { creerConsulterGarage } from './application/consulter-garage.js'
import { creerConsulterInformationsLegales } from './application/consulter-informations-legales.js'
import { creerConsulterLienFicheGoogle } from './application/consulter-lien-fiche-google.js'
import { creerDeclarerFermeture } from './application/declarer-fermeture.js'
import { creerDeclarerImprevu } from './application/declarer-imprevu.js'
import { creerListerFermetures } from './application/lister-fermetures.js'
import type { Horloge, ListerRappelsPromis } from './application/ports.js'
import { creerProposerDemiJournees } from './application/proposer-demi-journees.js'
import { creerRappelsPromisPendant } from './application/rappels-promis-pendant.js'
import { creerSupprimerFermeture } from './application/supprimer-fermeture.js'
import { manquesPourLaProduction } from './domaine/porte-publication.js'
import { publier } from './domaine/valeur-publiee.js'

export interface DependancesGarage {
  /** Mode du site : production, relecture ou demonstration (contrat ModeSite). */
  readonly mode: ModeSite
  /** Chemin du fichier d'identité, en pratique `donnees/garage.json`. */
  readonly cheminFichier: string
  readonly horloge: Horloge
  /** Fichier SQLite des fermetures exceptionnelles (BASE_SQLITE, partagé avec les demandes). */
  readonly cheminBase: string
  /** Fourni par le pré-diagnostic : « Vos questions » ne le lie que s'il est publié. */
  readonly preDiagnosticPublie: PreDiagnosticPublie
  /** Fourni par le catalogue, seule source des prix (AE-05) : exemples de prix de l'atelier, « Combien coûte un premier contrôle ? ». */
  readonly consulterTarifsDuSocle: ConsulterTarifsDuSocle
  /**
   * Facultatif, fourni par les demandes (capacité « rappels promis pour une
   * date », contrat `ListerRappelsPromis`) : l'écran de fermeture prévient des
   * rappels déjà promis ces jours-là. Absent : aucune alerte.
   */
  readonly listerRappelsPromis?: ListerRappelsPromis
}

export interface ContexteGarage {
  readonly module: ModuleContexte
  /** Identité publique et statut d'ouverture à l'instant présent, pour la mise en page. */
  readonly fournirCadre: () => Promise<CadrePage>
  /** Offert au contexte demandes : demi-journées proposées pour un rendez-vous. */
  readonly proposerDemiJournees: ProposerDemiJournees
  /** Offert au contexte demandes : phrase de suite annoncée après une demande. */
  readonly annoncerRappel: AnnoncerRappel
  /**
   * Offert au contexte demandes : une fermeture exceptionnelle couvre-t-elle
   * aujourd'hui ? La liste des demandes et l'accueil de l'espace le disent.
   */
  readonly fermeAujourdhui: GarageFermeAujourdhui
  /**
   * Données bloquantes du garage encore à valider (Kano D8), une ligne par
   * donnée, pour la porte de démarrage unique de la racine de composition.
   * Vide quand le garage peut être mis en ligne.
   */
  readonly donneesBloquantesAValider: readonly string[]
  /**
   * Ferme la base du garage quand la composition échoue avant que le serveur
   * ne la prenne en charge (sinon fermée à l'arrêt du serveur).
   */
  readonly fermer: () => void
}

/** Message du journal quand une fermeture illisible est écartée de la liste. */
export const MESSAGE_FERMETURE_ILLISIBLE = 'Fermeture exceptionnelle illisible écartée'

/**
 * Assemble le contexte garage. Le fichier du garage est lu et validé ici (un
 * fichier invalide fait échouer l'assemblage) ; les données bloquantes encore
 * à valider sont recensées pour la porte de démarrage de la composition.
 */
export async function assemblerGarage(dependances: DependancesGarage): Promise<ContexteGarage> {
  const { mode, horloge } = dependances
  const source = creerSourceIdentiteFichier(dependances.cheminFichier)
  const garageCharge = await source.charger()
  const donneesBloquantesAValider = manquesPourLaProduction(garageCharge)
  // L'encart « Nouveau nom » n'existe que si l'ancien nom est publiable : un
  // emplacement fourni est toujours rendu, même vide.
  const encartPublie = publier(garageCharge.identite.ancienNom, mode).visible
  // Le journal du serveur n'existe qu'une fois le module enregistré ; avant, la console.
  let journal: Pick<FastifyBaseLogger, 'warn'> = console
  const depot = creerDepotFermeturesSqlite(dependances.cheminBase, {
    signalerLigneIllisible: (ligne) => journal.warn({ ligne }, MESSAGE_FERMETURE_ILLISIBLE),
  })

  const consulterGarage = creerConsulterGarage(source, depot, mode)
  const consulterInformationsLegales = creerConsulterInformationsLegales(source, mode)

  return {
    module: {
      nom: 'garage',
      enregistrer: (app, outils) => {
        journal = app.log
        app.addHook('onClose', async () => depot.fermer())
        enregistrerRoutesPubliques(app, outils, {
          consulterGarage,
          consulterInformationsLegales,
          horloge,
        })
        enregistrerRoutesGaragiste(app, outils, {
          listerFermetures: creerListerFermetures(depot, horloge),
          declarerFermeture: creerDeclarerFermeture(depot, horloge),
          declarerImprevu: creerDeclarerImprevu(depot, horloge),
          supprimerFermeture: creerSupprimerFermeture(depot),
          consulterLienFicheGoogle: creerConsulterLienFicheGoogle(source, mode),
          rappelsPromisPendant: creerRappelsPromisPendant(dependances.listerRappelsPromis ?? null),
        })
      },
      blocsAccueil: {
        statut: async (maintenant) => blocStatut(await consulterGarage(maintenant)),
        information: async (maintenant) => {
          const [fiche, tarifs] = await Promise.all([
            consulterGarage(maintenant),
            dependances.consulterTarifsDuSocle(),
          ])
          return blocInformation(fiche, tarifs, mode === 'relecture')
        },
        questions: async (maintenant) => {
          const [fiche, tarifs] = await Promise.all([
            consulterGarage(maintenant),
            dependances.consulterTarifsDuSocle(),
          ])
          return blocQuestions(fiche, {
            preDiagnosticPublie: dependances.preDiagnosticPublie,
            tarifs,
            relecture: mode === 'relecture',
          })
        },
        garage: async (maintenant) => blocGarage(await consulterGarage(maintenant)),
        ...(encartPublie && {
          encart: async (maintenant) => blocEncart(await consulterGarage(maintenant)) ?? html``,
        }),
      },
    },
    fournirCadre: async () => {
      const { identite, statut } = await consulterGarage(horloge.maintenant())
      return { identite, statut }
    },
    proposerDemiJournees: creerProposerDemiJournees(source, depot, mode),
    annoncerRappel: creerAnnoncerRappel(source, depot, mode),
    fermeAujourdhui: async () =>
      (await creerListerFermetures(depot, horloge)()).fermetureDuJour !== null,
    donneesBloquantesAValider,
    fermer: () => depot.fermer(),
  }
}

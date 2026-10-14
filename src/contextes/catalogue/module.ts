import { join } from 'node:path'
import type {
  ConsulterOffrePieces,
  ConsulterTarifsDuSocle,
  IdentiteGaragePublique,
  ListerCeQueNousNeFaisonsPas,
  ModeSite,
  PreDiagnosticPublie,
  TrouverFamille,
} from '../../contrats/index.js'
import type { ModuleContexte } from '../../web/index.js'
import { creerSourceCatalogueFichier } from './adaptateurs/fichier/source-catalogue-fichier.js'
import { enregistrerRoutesCatalogue } from './adaptateurs/web/routes.js'
import { blocCatalogue, blocRecherchePieces } from './adaptateurs/web/vues/bloc-accueil.js'
import { creerConsulterCatalogue } from './application/consulter-catalogue.js'
import { creerConsulterFamille } from './application/consulter-famille.js'
import {
  creerConsulterOffrePieces,
  creerConsulterTarifsDuSocle,
  creerListerCeQueNousNeFaisonsPas,
} from './application/offert-aux-autres.js'
import { creerRechercherPieces } from './application/rechercher-pieces.js'
import { creerTrouverFamille } from './application/trouver-famille.js'
import { recenserBloquantsAValider } from './domaine/publication.js'

/** Nom du fichier du catalogue dans le dossier des données versionnées. */
export const FICHIER_CATALOGUE = 'catalogue.json'

/** Ce que la racine de composition fournit au catalogue. */
export interface DependancesCatalogue {
  /** Mode du site : production, relecture ou demonstration (contrat ModeSite). */
  readonly mode: ModeSite
  /** Dossier des données versionnées (`donnees/`), qui contient `catalogue.json`. */
  readonly cheminDonnees: string
  /**
   * Identité du garage (contrat, fournie par le contexte garage) : la ville des
   * titres de page (« Freinage à Choisy-le-Roi ») et le téléphone.
   */
  readonly garage: Pick<IdentiteGaragePublique, 'adresse' | 'telephone'>
  /** Fourni par le pré-diagnostic : les pages ne le lient que s'il est publié, sinon le téléphone. */
  readonly preDiagnosticPublie: PreDiagnosticPublie
}

export interface ContexteCatalogue {
  readonly module: ModuleContexte
  /** Offert au contexte demandes pour préremplir une demande depuis une famille d'intervention. */
  readonly trouverFamille: TrouverFamille
  /** Offert au contexte demandes (US-44) : « Ce que nous ne faisons pas », au-dessus du formulaire. */
  readonly listerCeQueNousNeFaisonsPas: ListerCeQueNousNeFaisonsPas
  /** Offert au contexte demandes (US-28) : l'engagement de vérification, sur le devis. */
  readonly consulterOffrePieces: ConsulterOffrePieces
  /**
   * Offert au garage (AE-05) : taux horaire et premier contrôle pour « Vos
   * questions », exemples de prix pour le bloc atelier de l'accueil.
   */
  readonly consulterTarifsDuSocle: ConsulterTarifsDuSocle
  /**
   * Données bloquantes de D8 encore à valider (familles, exclusions, taux
   * horaire, premier contrôle, prix de démonstration), pour la porte de
   * démarrage en production. Vide quand le catalogue peut être mis en ligne.
   */
  readonly donneesBloquantesAValider: readonly string[]
}

/**
 * Assemble le contexte catalogue. Le fichier est lu et validé ici : s'il est
 * invalide, l'assemblage échoue et le serveur ne démarre pas.
 */
export async function assemblerCatalogue(
  dependances: DependancesCatalogue,
): Promise<ContexteCatalogue> {
  const { mode } = dependances
  const source = creerSourceCatalogueFichier(join(dependances.cheminDonnees, FICHIER_CATALOGUE))
  const catalogue = await source.charger()
  const consulterCatalogue = creerConsulterCatalogue(source, mode)
  const consulterFamille = creerConsulterFamille(source, mode)
  const ville = dependances.garage.adresse.ville
  const renvoi = {
    preDiagnosticPublie: dependances.preDiagnosticPublie,
    telephone: dependances.garage.telephone,
  }

  return {
    module: {
      nom: 'catalogue',
      enregistrer: (app, outils) =>
        enregistrerRoutesCatalogue(app, outils, {
          consulterCatalogue,
          consulterFamille,
          rechercherPieces: creerRechercherPieces(source, mode),
          ville,
          renvoi,
        }),
      blocsAccueil: {
        'recherche-pieces': async () => blocRecherchePieces(await consulterCatalogue()),
        catalogue: async () => blocCatalogue(await consulterCatalogue()),
      },
    },
    trouverFamille: creerTrouverFamille(source, mode),
    listerCeQueNousNeFaisonsPas: creerListerCeQueNousNeFaisonsPas(source, mode),
    consulterOffrePieces: creerConsulterOffrePieces(source, mode),
    consulterTarifsDuSocle: creerConsulterTarifsDuSocle(source, mode),
    donneesBloquantesAValider: recenserBloquantsAValider(catalogue),
  }
}

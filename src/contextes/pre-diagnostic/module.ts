import { join } from 'node:path'
import type {
  ModeSite,
  PreDiagnosticPublie,
  RetrouverResumePreDiagnostic,
  TrouverFamille,
} from '../../contrats/index.js'
import type { CadrePage, ModuleContexte } from '../../web/index.js'
import { creerSourceArbreFichier } from './adaptateurs/fichier/source-arbre-fichier.js'
import { enregistrerRoutesPreDiagnostic } from './adaptateurs/web/routes.js'
import {
  blocAccueilPreDiagnostic,
  blocAccueilSansParcours,
} from './adaptateurs/web/vues/bloc-accueil.js'
import { chargerArbre } from './application/charger-arbre.js'
import { creerConsulterEtape } from './application/consulter-etape.js'
import { creerConsulterLivret } from './application/consulter-livret.js'
import { creerRetrouverResume } from './application/retrouver-resume.js'
import { etapeSymptome, type EtapeSymptome } from './domaine/parcours.js'
import { estPublie } from './domaine/publication.js'

/** Fichier de l'arbre, dans le dossier des données versionnées. */
export const FICHIER_ARBRE = 'pre-diagnostic.json'

/** Ce que la racine de composition fournit au pré-diagnostic. */
export interface DependancesPreDiagnostic {
  /** Mode du site : production, relecture ou demonstration (contrat ModeSite). */
  readonly mode: ModeSite
  /** Dossier des données versionnées (`donnees/`), où vit l'arbre de questions. */
  readonly cheminDonnees: string
  /**
   * Facultatif : identité et statut d'ouverture du garage (la fonction
   * `fournirCadre` du contexte garage convient telle quelle). Fournis, l'arrêt
   * et les résultats proposent « Appeler le garage » selon qu'il est ouvert ;
   * absents, ils renvoient au numéro affiché dans l'en-tête de chaque page.
   */
  readonly consulterGarage?: () => Promise<CadrePage>
  /**
   * Facultatif : la famille d'une piste dans le catalogue (capacité
   * `trouverFamille`). Fournie, chaque demande de prix du résultat porte le
   * prix indicatif de sa famille (« dès 89,00 € TTC ») ; absente, sans prix.
   */
  readonly trouverFamille?: TrouverFamille
}

export interface ContextePreDiagnostic {
  readonly module: ModuleContexte
  /** Offert au contexte demandes pour préremplir une demande depuis un pré-diagnostic. */
  readonly retrouverResumePreDiagnostic: RetrouverResumePreDiagnostic
  /**
   * Offert à la mise en page, au garage et au catalogue : ils ne lient
   * `/pre-diagnostic` que s'il est publié, et invitent à appeler sinon.
   */
  readonly preDiagnosticPublie: PreDiagnosticPublie
}

/**
 * Assemble le contexte. L'arbre est lu et passe la porte ici : refusé, il
 * empêche le démarrage. En production sans relecture datée, le pré-diagnostic
 * n'est pas publié : aucune route (l'adresse répond 404), aucun résumé
 * reconstitué, et l'accueil remplace la première question par l'appel (ou
 * « Être rappelé » quand le garage est fermé) ; le reste du site démarre.
 */
export async function assemblerPreDiagnostic(
  dependances: DependancesPreDiagnostic,
): Promise<ContextePreDiagnostic> {
  const arbre = await chargerArbre(
    creerSourceArbreFichier(join(dependances.cheminDonnees, FICHIER_ARBRE)),
  )
  const publie = estPublie(arbre, dependances.mode)
  const consulterEtape = creerConsulterEtape(arbre)
  const retrouverResume = creerRetrouverResume(arbre)
  const entree = etapeSymptome(arbre)

  return {
    module: {
      nom: 'pre-diagnostic',
      enregistrer: (app, outils) => {
        if (!publie) return
        enregistrerRoutesPreDiagnostic(app, outils, {
          mode: dependances.mode,
          arbre,
          consulterEtape,
          consulterLivret: creerConsulterLivret(arbre),
          consulterGarage: dependances.consulterGarage ?? null,
          trouverFamille: dependances.trouverFamille ?? null,
        })
      },
      blocsAccueil: blocsAccueil(publie, entree, dependances.consulterGarage),
    },
    retrouverResumePreDiagnostic: async (code) => (publie ? retrouverResume(code) : null),
    preDiagnosticPublie: publie,
  }
}

/** Publié : la première question ; sinon, l'invitation à appeler, si l'on sait joindre le garage. */
function blocsAccueil(
  publie: boolean,
  entree: EtapeSymptome,
  consulterGarage: (() => Promise<CadrePage>) | undefined,
): NonNullable<ModuleContexte['blocsAccueil']> {
  if (publie) return { 'pre-diagnostic': async () => blocAccueilPreDiagnostic(entree) }
  if (consulterGarage === undefined) return {}
  return { 'pre-diagnostic': async () => blocAccueilSansParcours(await consulterGarage()) }
}

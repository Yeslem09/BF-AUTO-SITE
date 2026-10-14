import type { FastifyInstance } from 'fastify'
import type { ModeSite, ReferenceFamille, TrouverFamille } from '../../../../contrats/index.js'
import { CHEMINS } from '../../../../contrats/index.js'
import type { CadrePage, OutilsPage } from '../../../../web/index.js'
import type { ConsulterEtape } from '../../application/consulter-etape.js'
import type { ConsulterLivret } from '../../application/consulter-livret.js'
import type { Arbre } from '../../domaine/arbre.js'
import type { Etape } from '../../domaine/parcours.js'
import { CHEMIN_LIVRET, estRequeteVide, lireEtat } from './adresses.js'
import { niveauSansAcces } from './journal.js'
import type { ContexteVue } from './vues/commun.js'
import { vueEtape } from './vues/etape.js'
import { famillesDesPistes } from './vues/pistes.js'
import { vueLivret } from './vues/livret.js'

export interface DependancesRoutes {
  readonly mode: ModeSite
  readonly arbre: Arbre
  readonly consulterEtape: ConsulterEtape
  readonly consulterLivret: ConsulterLivret
  /** Téléphone et statut du garage ; absent, les pages renvoient au numéro de l'en-tête. */
  readonly consulterGarage: (() => Promise<CadrePage>) | null
  /** Familles du catalogue (libellé, prix indicatif) ; absent, les demandes de prix n'ont pas de prix. */
  readonly trouverFamille: TrouverFamille | null
}

/**
 * Une seule adresse pour tout le parcours : l'état voyage dans la requête
 * (formulaires GET), la page rendue dépend de l'étape atteinte. Le livret de
 * relecture n'existe jamais en production.
 */
export function enregistrerRoutesPreDiagnostic(
  app: FastifyInstance,
  outils: OutilsPage,
  dependances: DependancesRoutes,
): void {
  const contexte = async (): Promise<ContexteVue> => ({
    mention: dependances.arbre.mention,
    actions: dependances.arbre.actions,
    contact: dependances.consulterGarage === null ? null : await dependances.consulterGarage(),
    aRelire: dependances.mode === 'relecture' && dependances.arbre.relecture === null,
  })

  // Les réponses voyagent dans l'adresse : le journal d'accès ne la recopie pas.
  app.get(
    CHEMINS.preDiagnostic,
    { logLevel: niveauSansAcces(app.log.level) },
    async (requete, reponse) => {
      const etape = dependances.consulterEtape(lireEtat(requete.query))
      const [cadre, familles] = await Promise.all([
        contexte(),
        famillesDuResultat(etape, dependances.trouverFamille, (erreur) =>
          requete.log.warn({ err: erreur }, 'Familles du catalogue indisponibles : prix omis'),
        ),
      ])
      return outils.envoyerPage(
        reponse,
        vueEtape(etape, { ...cadre, familles }, estRequeteVide(requete.query)),
      )
    },
  )

  if (dependances.mode !== 'production') {
    app.get(CHEMIN_LIVRET, async (_requete, reponse) =>
      outils.envoyerPage(reponse, vueLivret(dependances.consulterLivret())),
    )
  }
}

/**
 * Familles désignées par les pistes d'un résultat, retrouvées dans le
 * catalogue pour leur prix indicatif. Le catalogue en panne ne bloque jamais
 * le résultat : les liens restent, sans prix.
 */
async function famillesDuResultat(
  etape: Etape,
  trouverFamille: TrouverFamille | null,
  signaler: (erreur: unknown) => void,
): Promise<ReadonlyMap<string, ReferenceFamille>> {
  if (trouverFamille === null || etape.type !== 'resultat') return new Map()
  if (etape.conclusion.type !== 'pistes') return new Map()
  const identifiants = famillesDesPistes(etape.conclusion.resultat.pistes)
  try {
    const trouvees = await Promise.all(
      identifiants.map((identifiant) => trouverFamille(identifiant)),
    )
    return new Map(
      trouvees.flatMap((famille) => (famille === null ? [] : [[famille.identifiant, famille]])),
    )
  } catch (erreur) {
    signaler(erreur)
    return new Map()
  }
}

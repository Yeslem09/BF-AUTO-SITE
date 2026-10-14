import type { FastifyInstance } from 'fastify'
import { CHEMINS } from '../../../../contrats/index.js'
import type { OutilsPage } from '../../../../web/index.js'
import type { ConsulterCatalogue } from '../../application/consulter-catalogue.js'
import type { ConsulterFamille } from '../../application/consulter-famille.js'
import type { RechercherPieces } from '../../application/rechercher-pieces.js'
import { PARAMETRE_RECHERCHE, type RenvoiDoute } from './vues/commun.js'
import { vueFamilleIntrouvable } from './vues/famille-introuvable.js'
import { vueListeFamilles } from './vues/liste-familles.js'
import { vuePageFamille } from './vues/page-famille.js'
import { vueTarifs } from './vues/tarifs.js'

export interface CasUsageCatalogue {
  readonly consulterCatalogue: ConsulterCatalogue
  readonly consulterFamille: ConsulterFamille
  readonly rechercherPieces: RechercherPieces
  /** Ville du garage, reprise dans les titres des pages (référencement local, B-19). */
  readonly ville: string
  /** Pré-diagnostic publié ou téléphone du garage, pour le client qui doute. */
  readonly renvoi: RenvoiDoute
}

interface ParametresFamille {
  readonly famille: string
}

/** La requête `?q=` : un seul texte ; une valeur répétée ou absente vaut « pas de recherche ». */
function lireRequete(query: unknown): string {
  if (typeof query !== 'object' || query === null) return ''
  const valeur = (query as Record<string, unknown>)[PARAMETRE_RECHERCHE]
  return typeof valeur === 'string' ? valeur : ''
}

export function enregistrerRoutesCatalogue(
  app: FastifyInstance,
  outils: OutilsPage,
  casUsage: CasUsageCatalogue,
): void {
  const { consulterCatalogue, consulterFamille, rechercherPieces, ville, renvoi } = casUsage

  app.get(CHEMINS.catalogue, async (requete, reponse) =>
    outils.envoyerPage(
      reponse,
      vueListeFamilles(await rechercherPieces(lireRequete(requete.query)), ville, renvoi),
    ),
  )

  app.get<{ Params: ParametresFamille }>(
    `${CHEMINS.catalogue}/:famille`,
    async (requete, reponse) => {
      const fiche = await consulterFamille(requete.params.famille)
      const vue =
        fiche === null
          ? vueFamilleIntrouvable(await consulterCatalogue())
          : vuePageFamille(fiche, ville, renvoi)
      return outils.envoyerPage(reponse, vue)
    },
  )

  app.get(CHEMINS.tarifs, async (_requete, reponse) =>
    outils.envoyerPage(reponse, vueTarifs(await consulterCatalogue(), ville)),
  )
}

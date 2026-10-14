import type { ModeSite } from '../../../contrats/index.js'
import {
  publierCatalogue,
  trouverFamillePubliee,
  type FamillePubliee,
  type MentionPubliee,
} from '../domaine/publication.js'
import type { SourceCatalogue } from './ports.js'

/**
 * Page d'une famille : la famille elle-même, l'engagement de la pièce vérifiée
 * et posée, la gamme au choix et la vente au comptoir si elles sont publiées.
 */
export interface FicheFamille {
  readonly famille: FamillePubliee
  readonly engagementPiecePosee: MentionPubliee | null
  readonly gammeAuChoix: MentionPubliee | null
  readonly venteAuComptoir: MentionPubliee | null
}

export type ConsulterFamille = (identifiant: string) => Promise<FicheFamille | null>

/** Une famille publiée dans le mode du site ; `null` si elle est inconnue ou pas encore publiée. */
export function creerConsulterFamille(source: SourceCatalogue, mode: ModeSite): ConsulterFamille {
  return async (identifiant) => {
    const catalogue = publierCatalogue(await source.charger(), mode)
    const famille = trouverFamillePubliee(catalogue, identifiant)
    return famille === null
      ? null
      : {
          famille,
          engagementPiecePosee: catalogue.engagementPiecePosee,
          gammeAuChoix: catalogue.gammeAuChoix,
          venteAuComptoir: catalogue.venteAuComptoir,
        }
  }
}

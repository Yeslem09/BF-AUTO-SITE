import type {
  ConsulterOffrePieces,
  ConsulterTarifsDuSocle,
  ListerCeQueNousNeFaisonsPas,
  ModeSite,
} from '../../../contrats/index.js'
import { publierCatalogue, publierTarifsDuSocle } from '../domaine/publication.js'
import type { SourceCatalogue } from './ports.js'

/**
 * Capacités offertes aux autres contextes : chacune relit le fichier, si bien
 * qu'une donnée corrigée se voit partout à la fois.
 */

/** Aux demandes (US-44) : « Ce que nous ne faisons pas », tel que le mode le publie. */
export function creerListerCeQueNousNeFaisonsPas(
  source: SourceCatalogue,
  mode: ModeSite,
): ListerCeQueNousNeFaisonsPas {
  return async () =>
    publierCatalogue(await source.charger(), mode).ceQueNousNeFaisonsPas.map(
      (mention) => mention.texte,
    )
}

/**
 * Aux demandes (US-28, arbitrage 4) : l'engagement de vérification des pièces
 * et la vente au comptoir, s'ils sont publiés.
 */
export function creerConsulterOffrePieces(
  source: SourceCatalogue,
  mode: ModeSite,
): ConsulterOffrePieces {
  return async () => {
    const publie = publierCatalogue(await source.charger(), mode)
    return {
      engagementVerification: publie.engagementPiecePosee?.texte ?? null,
      venteAuComptoir: publie.venteAuComptoir !== null,
    }
  }
}

/**
 * Au garage (AE-05) : taux horaire, premier contrôle et exemples de l'accueil,
 * depuis la seule source des prix, tels que le mode les publie (une
 * proposition de démonstration n'est jamais offerte en production).
 */
export function creerConsulterTarifsDuSocle(
  source: SourceCatalogue,
  mode: ModeSite,
): ConsulterTarifsDuSocle {
  return async () => publierTarifsDuSocle(await source.charger(), mode)
}

import type { ModeSite, TrouverFamille } from '../../../contrats/index.js'
import {
  piecesDOccasionPossibles,
  prixMisEnAvant,
  publierCatalogue,
  trouverFamillePubliee,
} from '../domaine/publication.js'
import type { SourceCatalogue } from './ports.js'

/**
 * Capacité offerte aux contextes des demandes et du pré-diagnostic : la
 * référence d'une famille publiée dans le mode du site, avec ce que la
 * demande de prix doit en savoir (pièce seule possible, gamme d'occasion
 * possible, pièces à cocher, prestations sans pièce) et son prix indicatif
 * (« dès 89,00 € TTC »). Une famille pas encore confirmée par le garage n'existe
 * pas en production, pas plus qu'un identifiant inconnu.
 */
export function creerTrouverFamille(source: SourceCatalogue, mode: ModeSite): TrouverFamille {
  return async (identifiant) => {
    const famille = trouverFamillePubliee(
      publierCatalogue(await source.charger(), mode),
      identifiant.trim(),
    )
    if (famille === null) return null
    const pieces = famille.ventePieceSeule ? famille.pieces : []
    const forfaitsPrestations = famille.forfaits.filter((forfait) => forfait.prestation)
    const prestations = forfaitsPrestations.map((forfait) => forfait.intitule)
    const enAvant = prixMisEnAvant(famille)
    return {
      identifiant: famille.identifiant,
      libelle: famille.libelle,
      ventePieceSeule: famille.ventePieceSeule,
      piecesDOccasion: piecesDOccasionPossibles(famille),
      ...(pieces.length > 0 && { pieces }),
      ...(prestations.length > 0 && {
        prestations,
        prixDesPrestations: Object.fromEntries(
          forfaitsPrestations.map((forfait) => [forfait.intitule, forfait.prix.indicatif]),
        ),
      }),
      ...(enAvant !== null && { prixIndicatif: enAvant.prix.indicatif }),
    }
  }
}

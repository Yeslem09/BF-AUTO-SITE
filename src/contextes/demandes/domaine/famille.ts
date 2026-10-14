import type { ReferenceFamille } from '../../../contrats/index.js'
import { PIECES_MAXIMUM } from './referentiels.js'

/**
 * Ce que la famille du catalogue dit de la demande de prix (J2 et J3, passe 2
 * du jury) : une prestation (carrosserie, peinture, diagnostic) ne propose ni
 * gamme de pièce ni retrait ; une famille exclue du réemploi (freinage) ne
 * propose jamais l'occasion.
 */

/** Vrai pour une famille qui est une prestation : ni gamme ni retrait au comptoir. */
export function estPrestation(famille: ReferenceFamille | null): boolean {
  return famille?.ventePieceSeule === false
}

/** Vrai si la gamme « d'occasion ou reconditionnée » peut être proposée pour cette famille. */
export function occasionPossible(famille: ReferenceFamille | null): boolean {
  return famille?.piecesDOccasion !== false && !estPrestation(famille)
}

/**
 * Prix indicatif à afficher après le sujet (« dès 89,00 € TTC ») : celui de la
 * prestation demandée (« Révision » : « dès 129,00 € TTC »), sinon celui de la
 * famille. Jamais celui de la famille pour une prestation : c'est le prix d'un
 * autre forfait. Absent ou vide : rien n'est affiché.
 */
export function prixIndicatifDe(
  famille: ReferenceFamille | null,
  prestation: string | null = null,
): string | null {
  const prix =
    prestation === null ? famille?.prixIndicatif : famille?.prixDesPrestations?.[prestation]
  return typeof prix === 'string' && prix.trim() !== '' ? prix.trim() : null
}

/**
 * Vrai quand la demande n'a pas de pièce à choisir : famille prestation
 * (carrosserie, peinture) ou prestation nommée d'une famille (révision,
 * vidange, géométrie). Ni pièces, ni gamme, ni retrait au comptoir.
 */
export function sansPiece(famille: ReferenceFamille | null, prestation: string | null): boolean {
  return prestation !== null || estPrestation(famille)
}

/** Pièces proposées pour une famille : celles du catalogue, dans l'ordre, au plus douze. */
export function piecesProposees(famille: ReferenceFamille | null): readonly string[] {
  return (famille?.pieces ?? []).slice(0, PIECES_MAXIMUM)
}

function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[\s _-]+/g, ' ')
    .trim()
    .toLocaleLowerCase('fr-FR')
}

/**
 * Prestation demandée d'après le paramètre `prestation` de l'adresse (lien
 * d'un tarif : « Révision ») : le nom exact publié par le catalogue
 * (`ReferenceFamille.prestations`), retrouvé sans tenir compte des accents, de
 * la casse ni des tirets ; `null` sinon. Jamais un texte de l'adresse qui
 * n'est pas une prestation publiée (piège 40).
 */
export function prestationDuParametre(
  famille: ReferenceFamille | null,
  valeur: string,
): string | null {
  const cherchee = normaliser(valeur.slice(0, 120))
  if (cherchee === '') return null
  return (famille?.prestations ?? []).find((nom) => normaliser(nom) === cherchee) ?? null
}

/**
 * Pièce à pré-cocher d'après le paramètre `piece` de l'adresse (lien d'un
 * tarif : « Plaquettes avant ») : le nom exact du catalogue, retrouvé sans
 * tenir compte des accents, de la casse ni des tirets ; rien sinon. Jamais un
 * texte de l'adresse qui n'est pas une pièce publiée (piège 40).
 */
export function pieceDuParametre(famille: ReferenceFamille | null, valeur: string): string[] {
  const cherchee = normaliser(valeur.slice(0, 120))
  if (cherchee === '') return []
  const trouvee = piecesProposees(famille).find((piece) => normaliser(piece) === cherchee)
  return trouvee === undefined ? [] : [trouvee]
}

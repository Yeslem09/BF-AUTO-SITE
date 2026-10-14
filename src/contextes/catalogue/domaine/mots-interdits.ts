/**
 * Expressions qu'aucun texte du catalogue ne peut porter : chacune ferait une
 * promesse que personne ne tient (stock, compatibilité automatique, vente en
 * ligne, délai, prix « à partir de » sans référence) ou une allégation
 * invérifiable. Kano : AE-03, AE-05, AE-21, AE-22, AE-24, US-28, US-29.
 */
export interface ExpressionInterdite {
  /** Forme lue par le rédacteur dans le message d'erreur. */
  readonly libelle: string
  /** Motif appliqué au texte normalisé (minuscules, sans accents, apostrophe droite). */
  readonly motif: RegExp
}

export const EXPRESSIONS_INTERDITES: readonly ExpressionInterdite[] = [
  { libelle: 'stock', motif: /\bstocks?\b/ },
  { libelle: 'panier', motif: /\bpaniers?\b/ },
  { libelle: 'compatible', motif: /\bcompatib/ },
  { libelle: 'payer', motif: /\bpayer\b/ },
  { libelle: 'paiement en ligne', motif: /\bpaiements? en ligne\b/ },
  { libelle: 'vérification gratuite', motif: /\bverifications? gratuites?\b/ },
  { libelle: 'à partir de', motif: /\ba partir de\b/ },
  { libelle: 'sous 24 h', motif: /\bsous 24 ?h/ },
  { libelle: 'meilleur prix', motif: /\bmeilleurs? prix\b/ },
  { libelle: 'écologique', motif: /\becologiques?\b/ },
  { libelle: 'non polluant', motif: /\bnon polluante?s?\b/ },
]

const MARQUES_DIACRITIQUES = /\p{M}/gu
const APOSTROPHES = /[\u2019\u02bc]/g

export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(MARQUES_DIACRITIQUES, '')
    .replace(APOSTROPHES, "'")
    .toLowerCase()
}

/** Libellés des expressions interdites présentes dans le texte, dans l'ordre de la liste. */
export function expressionsInterditesDans(texte: string): readonly string[] {
  const normalise = normaliser(texte)
  return EXPRESSIONS_INTERDITES.filter(({ motif }) => motif.test(normalise)).map(
    ({ libelle }) => libelle,
  )
}

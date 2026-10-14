/**
 * Organes exclus des pièces issues de l'économie circulaire (code de la
 * consommation, R224-22 à D224-25-5 : « pièces mécaniques ou électroniques,
 * sauf celles des trains roulants, de la direction, du freinage et des
 * éléments de liaison au sol assemblés, soumis à usure mécanique et non
 * démontables »). Référentiel UNIQUE : la page « Vos droits » (garage) en tire
 * sa liste, et le catalogue ne propose jamais la gamme d'occasion ou
 * reconditionnée pour une famille rattachée à l'un de ces organes ; il le dit
 * aux demandes (`ReferenceFamille.piecesDOccasion`).
 */
export const ORGANES_EXCLUS_DU_REEMPLOI = {
  'trains-roulants': {
    nom: 'les trains roulants',
    complement: 'des trains roulants',
  },
  direction: {
    nom: 'la direction',
    complement: 'de la direction',
  },
  freinage: {
    nom: 'le freinage',
    complement: 'du freinage',
  },
  'liaison-au-sol': {
    nom: 'les éléments de liaison au sol',
    complement:
      'des éléments de liaison au sol assemblés, soumis à usure mécanique et non démontables',
  },
} as const

export type OrganeExcluDuReemploi = keyof typeof ORGANES_EXCLUS_DU_REEMPLOI

/** Codes des organes exclus, dans l'ordre du texte de loi. */
export const CODES_ORGANES_EXCLUS = Object.keys(
  ORGANES_EXCLUS_DU_REEMPLOI,
) as readonly OrganeExcluDuReemploi[]

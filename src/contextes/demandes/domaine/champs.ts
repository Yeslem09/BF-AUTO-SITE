import type { TypeDemande } from '../../../contrats/index.js'

/** Champs d'une demande tels que le client les remplit ; `vehicule` désigne le bloc entier. */
export const CHAMPS_DEMANDE = [
  'type',
  'objet',
  'motif',
  'creneaux',
  'vehicule',
  'plaque',
  'marque',
  'modele',
  'annee',
  'energie',
  'pieces',
  'gamme',
  'modalite',
  'precisions',
  'prenom',
  'telephone',
  'moment',
] as const

export type ChampDemande = (typeof CHAMPS_DEMANDE)[number]

/** Champs qu'un type de demande peut rendre obligatoires. */
export type ChampObligatoire =
  'objet' | 'motif' | 'creneaux' | 'vehicule' | 'prenom' | 'telephone' | 'moment'

/** Ce que la demande porte déjà en arrivant : une famille du catalogue, un pré-diagnostic. */
export interface VarianteDemande {
  readonly familleCitee: boolean
  readonly preDiagnostic: boolean
}

/** P-07 : au plus cinq champs obligatoires à remplir par type, champs préremplis exclus. */
export const MAXIMUM_CHAMPS_OBLIGATOIRES = 5

const CONTACT: readonly ChampObligatoire[] = ['prenom', 'telephone', 'moment']

/**
 * Champs obligatoires d'un type de demande, dans l'ordre du formulaire (le
 * besoin d'abord, les coordonnées en dernier, B-07 ; après un pré-diagnostic,
 * seules à remplir, elles passent devant le résumé). Source unique : la
 * validation et l'affichage des mentions « facultatif » en dépendent.
 *
 * Le bloc `vehicule` d'un devis compte pour un champ : la plaque suffit, et
 * marque, modèle, année et énergie ne la remplacent que si elle manque (P-07).
 */
export function champsObligatoires(
  type: TypeDemande,
  variante: VarianteDemande,
): readonly ChampObligatoire[] {
  switch (type) {
    case 'rendez-vous':
      return [...(variante.familleCitee ? [] : (['objet'] as const)), 'creneaux', ...CONTACT]
    case 'devis':
      return [...(variante.familleCitee ? [] : (['objet'] as const)), 'vehicule', ...CONTACT]
    case 'rappel':
      return [...(variante.preDiagnostic ? [] : (['motif'] as const)), ...CONTACT]
  }
}

import { CHEMINS } from '../../../../contrats/index.js'

/** Pages de l'espace garagiste propres au contexte garage (Kano D5, capacité 2). */
export const CHEMINS_FERMETURES = {
  liste: CHEMINS.garagisteFermetures,
  imprevu: `${CHEMINS.garagisteFermetures}/imprevu`,
  /** Modèle Fastify ; l'adresse réelle vient de `cheminSuppression`. */
  suppression: `${CHEMINS.garagisteFermetures}/:identifiant/supprimer`,
} as const

export function cheminSuppression(identifiant: number): string {
  return `${CHEMINS.garagisteFermetures}/${identifiant}/supprimer`
}

/**
 * Compte rendu d'une action, passé à la liste après redirection. Code fermé :
 * aucune valeur libre de l'adresse n'est jamais rendue à l'écran (piège 40).
 */
export const PARAMETRE_COMPTE_RENDU = 'fait'

export const COMPTES_RENDUS = [
  'enregistree',
  'deja-fermee',
  'supprimee',
  'retablie',
  'introuvable',
] as const

export type CompteRendu = (typeof COMPTES_RENDUS)[number]

export function lireCompteRendu(valeur: unknown): CompteRendu | null {
  return COMPTES_RENDUS.find((code) => code === valeur) ?? null
}

/**
 * Ce que la boîte du garage a appris d'une demande (Kano connecteurs, C5),
 * affiché sur sa fiche : une réponse reçue mais non reconnue comme commande,
 * ou le courriel de notification revenu en erreur. Rien du texte reçu.
 */
export interface SuiviCourriel {
  readonly reponseNonReconnueLe: Date | null
  readonly nonRemise: { readonly le: Date; readonly motif: string } | null
}

export const SUIVI_COURRIEL_VIDE: SuiviCourriel = { reponseNonReconnueLe: null, nonRemise: null }

export type EvenementSuivi =
  | { readonly nature: 'reponse-non-reconnue'; readonly le: Date }
  | { readonly nature: 'non-remise'; readonly le: Date; readonly motif: string }

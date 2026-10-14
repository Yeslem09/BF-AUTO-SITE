/**
 * Forme de la référence d'une demande dans les courriels (Kano connecteurs,
 * C3) : « BF- » puis 6 caractères de l'alphabet de Crockford (sans I, L, O,
 * U). Partagée par le contexte demandes, qui la calcule, et l'infrastructure
 * de courriel, qui la place dans l'objet et la retrouve dans les réponses.
 */
export const PREFIXE_REFERENCE_DEMANDE = 'BF'
export const ALPHABET_REFERENCE_DEMANDE = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const LONGUEUR_CODE_REFERENCE_DEMANDE = 6

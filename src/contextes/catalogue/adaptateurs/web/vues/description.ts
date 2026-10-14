/** Longueur que les moteurs de recherche affichent sans couper (B-27). */
export const LONGUEUR_MAX_DESCRIPTION = 155
const POINTS_DE_SUSPENSION = '…'

/**
 * Description de page d'au plus 155 caractères : coupée à la fin d'un mot et
 * terminée par des points de suspension si elle est trop longue.
 */
export function resumerPourDescription(texte: string): string {
  if (texte.length <= LONGUEUR_MAX_DESCRIPTION) return texte
  const place = LONGUEUR_MAX_DESCRIPTION - POINTS_DE_SUSPENSION.length
  const coupe = texte.slice(0, place + 1)
  const dernierEspace = coupe.lastIndexOf(' ')
  const debut = dernierEspace > 0 ? coupe.slice(0, dernierEspace) : texte.slice(0, place)
  return `${debut.replace(/[\s,;:.]+$/, '')}${POINTS_DE_SUSPENSION}`
}

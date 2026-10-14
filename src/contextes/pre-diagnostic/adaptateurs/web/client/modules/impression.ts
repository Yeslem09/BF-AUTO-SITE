/**
 * Bouton « Imprimer la fiche » : absent de la page sans JavaScript (le menu du
 * navigateur imprime la même fiche), révélé et branché quand le script tourne.
 */
export const ATTRIBUT_IMPRIMER = 'data-pre-diagnostic-imprimer'

export function installerImpression(fenetre: Window): void {
  for (const bouton of fenetre.document.querySelectorAll<HTMLButtonElement>(
    `button[${ATTRIBUT_IMPRIMER}]`,
  )) {
    bouton.hidden = false
    bouton.addEventListener('click', () => fenetre.print())
  }
}

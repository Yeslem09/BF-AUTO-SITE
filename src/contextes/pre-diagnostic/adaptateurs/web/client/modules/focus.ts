/**
 * Chaque réponse recharge la page : sans script, le focus repart du haut du
 * document et il faut des dizaines de tabulations pour revenir à la question.
 * Le script le pose sur l'élément marqué (la question, le message d'erreur,
 * ou la conduite à tenir), qui porte `tabindex="-1"` : un lecteur d'écran
 * l'annonce, et le téléphone le fait défiler jusqu'à l'écran.
 */
export const ATTRIBUT_FOCUS = 'data-pre-diagnostic-focus'

export function placerLeFocus(fenetre: Window): void {
  const cible = fenetre.document.querySelector<HTMLElement>(`[${ATTRIBUT_FOCUS}]`)
  cible?.focus()
}

/**
 * Empêche le double envoi d'un formulaire marqué `data-envoi-unique` (double
 * clic, impatience sur un réseau lent). Le bouton n'est pas désactivé : un
 * bouton désactivé disparaîtrait des données envoyées. Le formulaire est
 * seulement marqué occupé, et les envois suivants sont ignorés.
 */
export const ATTRIBUT_ENVOI_UNIQUE = 'data-envoi-unique'
const MARQUE_ENVOI_EN_COURS = 'envoiEnCours'

export function installerEnvoiUnique(fenetre: Window): void {
  fenetre.document.addEventListener('submit', (evenement) => {
    const formulaire = evenement.target
    if (!(formulaire instanceof HTMLFormElement)) return
    if (!formulaire.hasAttribute(ATTRIBUT_ENVOI_UNIQUE)) return
    // Un script propre au formulaire a déjà bloqué l'envoi (validation) : rien à faire.
    if (evenement.defaultPrevented) return
    if (formulaire.dataset[MARQUE_ENVOI_EN_COURS] !== undefined) {
      evenement.preventDefault()
      return
    }
    formulaire.dataset[MARQUE_ENVOI_EN_COURS] = ''
    formulaire.setAttribute('aria-busy', 'true')
  })

  // Retour arrière depuis la page suivante : la page restaurée doit redevenir utilisable.
  fenetre.addEventListener('pageshow', (evenement) => {
    if (!evenement.persisted) return
    for (const formulaire of fenetre.document.querySelectorAll<HTMLFormElement>(
      `form[${ATTRIBUT_ENVOI_UNIQUE}]`,
    )) {
      delete formulaire.dataset[MARQUE_ENVOI_EN_COURS]
      formulaire.removeAttribute('aria-busy')
    }
  })
}

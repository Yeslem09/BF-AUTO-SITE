/**
 * Menu du téléphone (`<details class="menu">`) : il s'ouvre et se ferme sans
 * script ; ce module ajoute seulement la touche Échap, qui le ferme et rend le
 * focus au bouton « Menu » quand le focus était dans le menu (sinon il
 * resterait sur un lien devenu invisible). Un focus posé ailleurs dans la page
 * n'est pas déplacé.
 */
const SELECTEUR_MENU_OUVERT = 'details.menu[open]'
const TOUCHE_ECHAP = 'Escape'

export function installerFermetureMenu(fenetre: Window): void {
  const { document } = fenetre
  document.addEventListener('keydown', (evenement) => {
    if (evenement.key !== TOUCHE_ECHAP || evenement.defaultPrevented) return
    for (const menu of document.querySelectorAll<HTMLDetailsElement>(SELECTEUR_MENU_OUVERT)) {
      const actif = document.activeElement
      const focusPerdu = actif === null || actif === document.body || menu.contains(actif)
      menu.open = false
      if (focusPerdu) menu.querySelector<HTMLElement>('summary')?.focus()
    }
  })
}

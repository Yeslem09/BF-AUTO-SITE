// @vitest-environment happy-dom
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { installerFermetureMenu } from './menu.js'

const MENU = `<header>
  <details class="menu">
    <summary class="menu__bouton"><span class="menu__ouvrir">Menu</span><span class="menu__fermer">Fermer<span class="visuellement-masque"> le menu</span></span></summary>
    <nav class="menu__panneau" aria-label="Navigation principale"><ul class="menu__liste"><li><a class="menu__lien" href="/tarifs">Tarifs</a></li></ul></nav>
  </details>
</header>
<main><a id="ailleurs" href="/acces-et-horaires">Accès et horaires</a></main>`

function menu(): HTMLDetailsElement {
  const details = document.querySelector<HTMLDetailsElement>('details.menu')
  if (details === null) throw new Error('menu absent')
  return details
}

function element(selecteur: string): HTMLElement {
  const trouve = document.querySelector<HTMLElement>(selecteur)
  if (trouve === null) throw new Error(`${selecteur} absent`)
  return trouve
}

/** Envoie la touche à la cible, par défaut l'élément qui a le focus. */
function appuyer(touche: string, cible: EventTarget = document.activeElement ?? document): void {
  cible.dispatchEvent(
    new KeyboardEvent('keydown', { key: touche, bubbles: true, cancelable: true }),
  )
}

describe('menu du téléphone : Échap le ferme (amélioration progressive)', () => {
  beforeAll(() => installerFermetureMenu(window))
  beforeEach(() => {
    document.body.innerHTML = MENU
  })

  it('ferme le menu ouvert et rend le focus au bouton quand il était dans le menu', () => {
    menu().open = true
    element('.menu__lien').focus()
    appuyer('Escape')
    expect(menu().open).toBe(false)
    expect(document.activeElement).toBe(element('.menu__bouton'))
  })

  it('depuis le bouton lui-même, ferme le menu et garde le focus sur le bouton', () => {
    menu().open = true
    element('.menu__bouton').focus()
    appuyer('Escape')
    expect(menu().open).toBe(false)
    expect(document.activeElement).toBe(element('.menu__bouton'))
  })

  it('ferme le menu sans voler le focus posé ailleurs dans la page', () => {
    menu().open = true
    element('#ailleurs').focus()
    appuyer('Escape')
    expect(menu().open).toBe(false)
    expect(document.activeElement).toBe(element('#ailleurs'))
  })

  it('ne fait rien pour une autre touche, ni quand le menu est fermé', () => {
    menu().open = true
    element('.menu__lien').focus()
    appuyer('Enter')
    expect(menu().open).toBe(true)
    menu().open = false
    element('#ailleurs').focus()
    appuyer('Escape')
    expect(menu().open).toBe(false)
    expect(document.activeElement).toBe(element('#ailleurs'))
  })

  it('laisse la touche à un composant qui l’a déjà traitée', () => {
    menu().open = true
    const lien = element('.menu__lien')
    lien.focus()
    const consommer = (evenement: Event) => evenement.preventDefault()
    lien.addEventListener('keydown', consommer)
    appuyer('Escape', lien)
    lien.removeEventListener('keydown', consommer)
    expect(menu().open).toBe(true)
  })
})

// @vitest-environment happy-dom
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ATTRIBUT_ENVOI_UNIQUE, installerEnvoiUnique } from './envoi-unique.js'

function soumettre(formulaire: HTMLFormElement): boolean {
  // `dispatchEvent` renvoie false quand un écouteur a annulé l'envoi.
  return formulaire.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function creerFormulaire(envoiUnique: boolean): HTMLFormElement {
  const formulaire = document.createElement('form')
  if (envoiUnique) formulaire.setAttribute(ATTRIBUT_ENVOI_UNIQUE, '')
  document.body.append(formulaire)
  return formulaire
}

describe('envoi unique des formulaires', () => {
  beforeAll(() => installerEnvoiUnique(window))
  beforeEach(() => document.body.replaceChildren())

  it('laisse partir le premier envoi et marque le formulaire occupé', () => {
    const formulaire = creerFormulaire(true)
    expect(soumettre(formulaire)).toBe(true)
    expect(formulaire.getAttribute('aria-busy')).toBe('true')
  })

  it('bloque le second envoi du même formulaire', () => {
    const formulaire = creerFormulaire(true)
    soumettre(formulaire)
    expect(soumettre(formulaire)).toBe(false)
  })

  it('ne touche pas à un formulaire qui ne le demande pas', () => {
    const formulaire = creerFormulaire(false)
    expect(soumettre(formulaire)).toBe(true)
    expect(soumettre(formulaire)).toBe(true)
    expect(formulaire.hasAttribute('aria-busy')).toBe(false)
  })

  it('ne marque rien quand un script propre au formulaire a déjà bloqué l’envoi', () => {
    const formulaire = creerFormulaire(true)
    const bloquer = (evenement: Event) => evenement.preventDefault()
    formulaire.addEventListener('submit', bloquer)
    soumettre(formulaire)
    formulaire.removeEventListener('submit', bloquer)
    expect(formulaire.hasAttribute('aria-busy')).toBe(false)
    expect(soumettre(formulaire)).toBe(true)
  })

  it('rend le formulaire de nouveau utilisable après un retour arrière', () => {
    const formulaire = creerFormulaire(true)
    soumettre(formulaire)
    const retour = new Event('pageshow')
    Object.defineProperty(retour, 'persisted', { value: true })
    window.dispatchEvent(retour)
    expect(formulaire.hasAttribute('aria-busy')).toBe(false)
    expect(soumettre(formulaire)).toBe(true)
  })
})

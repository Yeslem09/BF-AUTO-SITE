// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ATTRIBUT_IMPRIMER, installerImpression } from './impression.js'

function creerBouton(): HTMLButtonElement {
  const bouton = document.createElement('button')
  bouton.type = 'button'
  bouton.setAttribute(ATTRIBUT_IMPRIMER, '')
  bouton.hidden = true
  document.body.append(bouton)
  return bouton
}

describe('impression de la fiche', () => {
  beforeEach(() => document.body.replaceChildren())

  it('révèle le bouton caché sans script', () => {
    const bouton = creerBouton()
    installerImpression(window)
    expect(bouton.hidden).toBe(false)
  })

  it('ouvre l’impression du navigateur au clic', () => {
    // happy-dom n'imprime pas : on pose une doublure à la place de `window.print`.
    const imprimer = vi.fn()
    Object.defineProperty(window, 'print', { value: imprimer, configurable: true })
    const bouton = creerBouton()
    installerImpression(window)
    expect(imprimer).not.toHaveBeenCalled()
    bouton.click()
    expect(imprimer).toHaveBeenCalledOnce()
  })

  it('laisse tranquille un bouton qui ne le demande pas', () => {
    const autre = document.createElement('button')
    autre.hidden = true
    document.body.append(autre)
    installerImpression(window)
    expect(autre.hidden).toBe(true)
  })
})

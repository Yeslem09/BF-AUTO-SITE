// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { ATTRIBUT_FOCUS, placerLeFocus } from './focus.js'

describe('focus sur la question du pré-diagnostic', () => {
  beforeEach(() => document.body.replaceChildren())

  it('pose le focus sur l’élément marqué, pas sur le haut de la page', () => {
    const lien = document.createElement('a')
    lien.href = '/'
    const question = document.createElement('h1')
    question.tabIndex = -1
    question.setAttribute(ATTRIBUT_FOCUS, '')
    document.body.append(lien, question)
    placerLeFocus(window)
    expect(document.activeElement).toBe(question)
  })

  it('ne fait rien sur une page sans élément marqué', () => {
    const lien = document.createElement('a')
    lien.href = '/'
    document.body.append(lien)
    placerLeFocus(window)
    expect(document.activeElement).toBe(document.body)
  })
})

import { describe, expect, it } from 'vitest'
import { arbreAccepte, creerArbreEssai, relire } from '../essais/arbre-essai.js'
import { estPublie } from './publication.js'

describe('publication du pré-diagnostic', () => {
  const nonRelu = arbreAccepte(creerArbreEssai())
  const relu = arbreAccepte(relire(creerArbreEssai()))

  it('n’est pas publié en production tant que la relecture n’est pas datée', () => {
    expect(estPublie(nonRelu, 'production')).toBe(false)
    expect(estPublie(relu, 'production')).toBe(true)
  })

  it('reste visible en relecture et en démonstration, pour être relu et montré', () => {
    expect(estPublie(nonRelu, 'relecture')).toBe(true)
    expect(estPublie(nonRelu, 'demonstration')).toBe(true)
  })
})

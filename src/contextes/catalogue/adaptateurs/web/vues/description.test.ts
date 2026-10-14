import { describe, expect, it } from 'vitest'
import { LONGUEUR_MAX_DESCRIPTION, resumerPourDescription } from './description.js'

describe('description de page (B-27)', () => {
  it('laisse intacte une description courte', () => {
    expect(resumerPourDescription('Freinage à Choisy-le-Roi.')).toBe('Freinage à Choisy-le-Roi.')
  })

  it('coupe une description longue à la fin d’un mot, sous 155 caractères, avec des points de suspension', () => {
    const longue = `${'mot '.repeat(60)}fin`
    const resume = resumerPourDescription(longue)
    expect(resume.length).toBeLessThanOrEqual(LONGUEUR_MAX_DESCRIPTION)
    expect(resume.endsWith('mot…')).toBe(true)
  })

  it('ne laisse ni virgule ni deux-points avant les points de suspension', () => {
    const texte = `${'a'.repeat(150)}, suite qui dépasse`
    expect(resumerPourDescription(texte)).toBe(`${'a'.repeat(150)}…`)
  })
})

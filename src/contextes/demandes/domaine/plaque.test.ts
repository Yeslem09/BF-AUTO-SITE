import { describe, expect, it } from 'vitest'
import { normaliserPlaque } from './plaque.js'

describe('plaque d’immatriculation (US-28)', () => {
  it.each([
    ['AB-123-CD', 'AB-123-CD'],
    ['ab123cd', 'AB-123-CD'],
    ['AB 123 CD', 'AB-123-CD'],
    [' ab-123 cd ', 'AB-123-CD'],
    ['1234 AB 56', '1234 AB 56'],
    ['1234ab56', '1234 AB 56'],
    ['12 ABC 2A', '12 ABC 2A'],
    ['7 A 972', '7 A 972'],
  ])('« %s » est enregistrée sous la forme « %s »', (saisie, attendue) => {
    expect(normaliserPlaque(saisie)).toBe(attendue)
  })

  it.each([['12-AB'], ['ABC-12-DE'], ['AB-1234-CD'], ['1234 AB 99A'], ['12345 AB 56'], ['']])(
    'refuse « %s »',
    (saisie) => {
      expect(normaliserPlaque(saisie)).toBeNull()
    },
  )
})

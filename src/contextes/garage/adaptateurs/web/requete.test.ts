import { describe, expect, it } from 'vitest'
import { champ } from './requete.js'

describe('champ de formulaire', () => {
  it('lit un texte, et rend vide ce qui manque ou se répète', () => {
    expect(champ({ du: '2026-09-28' }, 'du')).toBe('2026-09-28')
    expect(champ({ du: ['a', 'b'] }, 'du')).toBe('')
    expect(champ({}, 'du')).toBe('')
    expect(champ(undefined, 'du')).toBe('')
  })
})

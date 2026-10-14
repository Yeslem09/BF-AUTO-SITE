import { describe, expect, it } from 'vitest'
import { libelleHeure, lireHeure } from './heure.js'

describe('heures', () => {
  it('lit une heure HH:MM en minutes depuis minuit', () => {
    expect(lireHeure('00:00')).toBe(0)
    expect(lireHeure('09:05')).toBe(545)
    expect(lireHeure('23:59')).toBe(1439)
  })

  it.each(['24:00', '9:00', '09:5', '09h00', ' 09:00'])('refuse %j', (texte) => {
    expect(lireHeure(texte)).toBeNull()
  })

  it('écrit l’heure à la française, sans zéro devant l’heure', () => {
    expect(libelleHeure(540)).toBe('9 h')
    expect(libelleHeure(1140)).toBe('19 h')
    expect(libelleHeure(870)).toBe('14 h 30')
    expect(libelleHeure(510)).toBe('8 h 30')
    expect(libelleHeure(545)).toBe('9 h 05')
    expect(libelleHeure(0)).toBe('0 h')
  })
})

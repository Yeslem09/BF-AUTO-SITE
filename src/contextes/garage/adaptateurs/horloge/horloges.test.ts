import { describe, expect, it } from 'vitest'
import { creerHorlogeFixe } from './horloge-fixe.js'
import { horlogeSysteme } from './horloge-systeme.js'

describe('horloges', () => {
  it('l’horloge fixe rend toujours le même instant, sans partager sa date', () => {
    const horloge = creerHorlogeFixe(new Date('2026-01-05T10:00:00Z'))
    const premiere = horloge.maintenant()
    premiere.setFullYear(2000)
    expect(horloge.maintenant().toISOString()).toBe('2026-01-05T10:00:00.000Z')
  })

  it('l’horloge système suit le temps réel', () => {
    const avant = Date.now()
    const instant = horlogeSysteme.maintenant().getTime()
    expect(instant).toBeGreaterThanOrEqual(avant)
    expect(instant).toBeLessThanOrEqual(Date.now())
  })
})

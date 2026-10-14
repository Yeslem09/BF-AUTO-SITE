import { describe, expect, it } from 'vitest'
import { derniereActivite, estAPurger, limiteDeConservation } from './conservation.js'

const MAINTENANT = new Date('2026-09-16T08:00:00.000Z')

describe('conservation de 12 mois (D5, US-34)', () => {
  it('la limite est le même instant, douze mois plus tôt', () => {
    expect(limiteDeConservation(MAINTENANT)).toEqual(new Date('2025-09-16T08:00:00.000Z'))
  })

  it('une demande à rappeler créée il y a 13 mois et jamais modifiée est à purger', () => {
    expect(estAPurger(new Date('2025-08-16T08:00:00.000Z'), null, MAINTENANT)).toBe(true)
  })

  it('créée il y a 13 mois mais passée à « Traitée » il y a 2 mois, elle est conservée', () => {
    expect(
      estAPurger(
        new Date('2025-08-16T08:00:00.000Z'),
        new Date('2026-07-16T08:00:00.000Z'),
        MAINTENANT,
      ),
    ).toBe(false)
  })

  it('une demande de 11 mois est conservée', () => {
    expect(estAPurger(new Date('2025-10-16T08:00:00.000Z'), null, MAINTENANT)).toBe(false)
  })

  it('la dernière activité est la plus récente des deux dates', () => {
    const recue = new Date('2026-01-01T00:00:00.000Z')
    expect(derniereActivite(recue, null)).toBe(recue)
    expect(derniereActivite(recue, new Date('2025-01-01T00:00:00.000Z'))).toBe(recue)
  })
})

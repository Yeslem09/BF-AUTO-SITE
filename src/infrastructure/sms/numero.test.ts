import { describe, expect, it } from 'vitest'
import { lireNumeroMobile } from './numero.js'

describe('numéro de mobile du destinataire SMS', () => {
  it.each([
    ['06 05 92 28 38', '+33605922838'],
    ['0605922838', '+33605922838'],
    ['06.05.92.28.38', '+33605922838'],
    ['+33 6 05 92 28 38', '+33605922838'],
    ['+33 (0)6 05 92 28 38', '+33605922838'],
    ['0033605922838', '+33605922838'],
    ['07 12 34 56 78', '+33712345678'],
    ['+32 470 12 34 56', '+32470123456'],
  ])('« %s » devient %s', (saisie, international) => {
    expect(lireNumeroMobile(saisie)).toEqual({ valide: true, international })
  })

  it('refuse un fixe français : un SMS n’y arrive pas', () => {
    const lecture = lireNumeroMobile('01 45 00 00 00')
    expect(lecture.valide).toBe(false)
    expect(lecture.valide ? '' : lecture.raison).toContain('fixe')
  })

  it.each(['', 'garage', '06 05 92', '+0 123'])('refuse « %s »', (saisie) => {
    expect(lireNumeroMobile(saisie).valide).toBe(false)
  })
})

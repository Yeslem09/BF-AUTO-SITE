import { describe, expect, it } from 'vitest'
import { normaliserSiret } from './siret.js'

describe('SIRET', () => {
  it('accepte un SIRET dont la clé de Luhn est juste, espaces retirés', () => {
    expect(normaliserSiret('443 061 841 00047')).toBe('44306184100047')
  })

  it.each(['44306184100048', '4430618410004', 'ABCDEFGHIJKLMN', ''])('refuse %j', (texte) => {
    expect(normaliserSiret(texte)).toBeNull()
  })
})

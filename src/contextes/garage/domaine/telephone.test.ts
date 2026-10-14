import { describe, expect, it } from 'vitest'
import { normaliserTelephone } from './telephone.js'

describe('téléphone français', () => {
  it('affiche par paires et produit un lien d’appel international', () => {
    expect(normaliserTelephone('0605922838')).toEqual({
      affichable: '06 05 92 28 38',
      lien: 'tel:+33605922838',
    })
  })

  it('accepte un fixe et un numéro d’outre-mer', () => {
    expect(normaliserTelephone('01 48 90 00 00')?.lien).toBe('tel:+33148900000')
    expect(normaliserTelephone('+33 5 90 00 00 00')?.affichable).toBe('05 90 00 00 00')
  })

  it.each([
    '',
    '06 05 92 28',
    '06 05 92 28 38 00',
    '00 12 34 56 78',
    '+32 470 12 34 56',
    '06a5922838',
  ])('refuse %j', (texte) => {
    expect(normaliserTelephone(texte)).toBeNull()
  })
})

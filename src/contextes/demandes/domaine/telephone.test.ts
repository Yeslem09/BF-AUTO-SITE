import { describe, expect, it } from 'vitest'
import { normaliserTelephoneClient } from './telephone.js'

describe('téléphone du client', () => {
  it.each([
    ['06 12 34 56 78'],
    ['0612345678'],
    ['06.12.34.56.78'],
    ['06-12-34-56-78'],
    ['+33 6 12 34 56 78'],
    ['+33 (0)6 12 34 56 78'],
    ['0033612345678'],
    ['  06 12 34 56 78  '],
  ])('« %s » devient une forme unique, lisible et composable', (saisie) => {
    expect(normaliserTelephoneClient(saisie)).toEqual({
      affichable: '06 12 34 56 78',
      lien: 'tel:+33612345678',
    })
  })

  it('accepte un fixe et un numéro d’outre-mer', () => {
    expect(normaliserTelephoneClient('01 48 90 12 34')?.lien).toBe('tel:+33148901234')
    expect(normaliserTelephoneClient('0690 12 34 56')?.affichable).toBe('06 90 12 34 56')
  })

  it.each([
    ['06 12 34 56'],
    ['06 12 34 56 78 90'],
    ['00 12 34 56 78'],
    ['+44 20 7946 0958'],
    ['06 12 AB 56 78'],
    [''],
  ])('refuse « %s », qui n’est pas un numéro français', (saisie) => {
    expect(normaliserTelephoneClient(saisie)).toBeNull()
  })
})

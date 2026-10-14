import { describe, expect, it } from 'vitest'
import {
  domaineDe,
  estIdentifiantDuSite,
  estReference,
  genererReference,
  identifiantMessage,
  objetAvecReference,
  referencesDansIdentifiants,
  referencesDansObjet,
} from './reference.js'

describe('référence d’une demande', () => {
  it('tire 6 caractères de l’alphabet de Crockford, sans I, L, O ni U', () => {
    let tirage = 0
    const tirer = (borne: number) => {
      expect(borne).toBe(32)
      tirage += 1
      return [7, 20, 3, 23, 9, 13][tirage - 1] ?? 0
    }
    expect(genererReference(tirer)).toBe('BF-7M3Q9D')
    for (let essai = 0; essai < 200; essai += 1) {
      const reference = genererReference()
      expect(estReference(reference)).toBe(true)
      expect(reference.slice(3)).not.toMatch(/[ILOU]/)
    }
  })

  it('n’est pas séquentielle : deux tirages successifs diffèrent', () => {
    const tirees = new Set(Array.from({ length: 100 }, () => genererReference()))
    expect(tirees.size).toBe(100)
  })

  it('se place en fin d’objet, une seule fois', () => {
    expect(objetAvecReference('Ne roulez pas : rappel de Julie', 'BF-7K3Q9D')).toBe(
      'Ne roulez pas : rappel de Julie [BF-7K3Q9D]',
    )
    expect(objetAvecReference('Relance [BF-7K3Q9D]', 'BF-7K3Q9D')).toBe('Relance [BF-7K3Q9D]')
    expect(() => objetAvecReference('Objet', 'BF-1234')).toThrow(RangeError)
  })

  it('se retrouve dans l’objet d’une réponse, quelle que soit la casse ou le préfixe', () => {
    expect(referencesDansObjet('Re: Ne roulez pas : Julie [BF-7K3Q9D]')).toEqual(['BF-7K3Q9D'])
    expect(referencesDansObjet('RE : TR: [bf-7k3q9d] et [BF-AB12CD]')).toEqual([
      'BF-7K3Q9D',
      'BF-AB12CD',
    ])
    expect(referencesDansObjet('Devis pneus BF-7K3Q9D sans crochets')).toEqual([])
    expect(referencesDansObjet('[BF-7K3QIO]')).toEqual([])
    expect(referencesDansObjet(null)).toEqual([])
  })

  it('forme un identifiant de message stable par demande et par rang', () => {
    expect(identifiantMessage('BF-7K3Q9D', 1, 'gmail.com')).toBe('<BF-7K3Q9D.1@gmail.com>')
    expect(identifiantMessage('BF-7K3Q9D', 2, 'gmail.com')).toBe('<BF-7K3Q9D.2@gmail.com>')
    expect(() => identifiantMessage('BF-7K3Q9D', 0, 'gmail.com')).toThrow(RangeError)
    expect(() => identifiantMessage('BF-7K3Q9D', 100, 'gmail.com')).toThrow(RangeError)
  })

  it('reconnaît les identifiants du site dans les en-têtes de fil', () => {
    expect(
      referencesDansIdentifiants(
        '<CAabc@mail.gmail.com> <BF-7K3Q9D.1@gmail.com> <BF-7K3Q9D.2@gmail.com>',
      ),
    ).toEqual(['BF-7K3Q9D'])
    expect(referencesDansIdentifiants('<CAabc@mail.gmail.com>')).toEqual([])
    expect(estIdentifiantDuSite('<BF-7K3Q9D.1@gmail.com>')).toBe(true)
    expect(estIdentifiantDuSite('<CAabc@mail.gmail.com>')).toBe(false)
    expect(estIdentifiantDuSite(null)).toBe(false)
  })

  it('prend le domaine d’une adresse, en minuscules', () => {
    expect(domaineDe('Garage@GMAIL.com')).toBe('gmail.com')
  })
})

import { describe, expect, it } from 'vitest'
import { referenceDeDemande } from './reference.js'

describe('référence d’une demande (Kano connecteurs, C3)', () => {
  it('se tire de l’identifiant : stable, au format BF-XXXXXX de Crockford', () => {
    const id = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
    expect(referenceDeDemande(id)).toBe(referenceDeDemande(id))
    expect(referenceDeDemande(id)).toMatch(/^BF-[0-9A-HJKMNP-TV-Z]{6}$/)
    expect(referenceDeDemande('00000000-0000-4000-8000-000000000000')).toBe('BF-000000')
    expect(referenceDeDemande('ffffffff-0000-4000-8000-000000000000')).toBe('BF-ZZZZZZ')
  })

  it('deux identifiants aléatoires donnent deux références différentes', () => {
    const references = new Set(
      Array.from({ length: 200 }, () => referenceDeDemande(crypto.randomUUID())),
    )
    expect(references.size).toBe(200)
  })
})

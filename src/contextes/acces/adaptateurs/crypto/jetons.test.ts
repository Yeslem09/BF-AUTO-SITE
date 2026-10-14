import { describe, expect, it } from 'vitest'
import { estFormeDeJeton } from '../../domaine/jeton.js'
import { generateurJetonAleatoire, hachageSha256 } from './jetons.js'

describe('jetons aléatoires et empreintes', () => {
  it('tire des jetons de 256 bits en base64url, tous différents', () => {
    const jetons = Array.from({ length: 50 }, () => generateurJetonAleatoire.generer())
    expect(new Set(jetons).size).toBe(50)
    for (const jeton of jetons) {
      expect(jeton).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(estFormeDeJeton(jeton)).toBe(true)
    }
  })

  it('calcule une empreinte SHA-256 stable, qui ne laisse rien voir du jeton', () => {
    const empreinte = hachageSha256.empreinte('jeton-de-test')
    expect(empreinte).toBe('656beb298c0687e5d056852fbeceadf78f5c065604c4a36f1886a406cbb39a5c')
    expect(hachageSha256.empreinte('jeton-de-test')).toBe(empreinte)
    expect(hachageSha256.empreinte('jeton-de-tesu')).not.toBe(empreinte)
  })
})

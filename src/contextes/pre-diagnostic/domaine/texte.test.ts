import { describe, expect, it } from 'vitest'
import { contientExpression, estUnePhrase, motsTrouves, normaliser } from './texte.js'

const LISTE = new Set(['certain', 'surement', 'avis'])

describe('analyse des textes de l’arbre', () => {
  it('compare sans casse ni accents', () => {
    expect(normaliser('Sûrement Forcément À')).toBe('surement forcement a')
  })

  it('trouve les mots entiers, sans les confondre avec un mot plus long', () => {
    expect(motsTrouves('Sûrement un souci', LISTE)).toEqual(['surement'])
    expect(motsTrouves('Certaines pièces', LISTE)).toEqual([])
    expect(motsTrouves('C’est certain, à votre avis ?', LISTE)).toEqual(['certain', 'avis'])
    expect(motsTrouves('les avisos', LISTE)).toEqual([])
  })

  it('reconnaît une phrase unique terminée par un point', () => {
    expect(estUnePhrase('Des plaquettes usées, qui sifflent.')).toBe(true)
    expect(estUnePhrase('Des plaquettes usées. Et des disques.')).toBe(false)
    expect(estUnePhrase('Des plaquettes usées')).toBe(false)
  })

  it('cherche une expression par mots entiers', () => {
    expect(contientExpression('Autre chose ou je ne sais pas', 'Je ne sais pas')).toBe(true)
    expect(contientExpression('Je ne le sais pas', 'Je ne sais pas')).toBe(false)
  })
})

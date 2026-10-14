import { describe, expect, it } from 'vitest'
import { dateEnLettres, majusculeInitiale } from './dates-francaises.js'

describe('dates en toutes lettres', () => {
  it('écrit le jour de la semaine, le quantième et le mois', () => {
    expect(dateEnLettres({ annee: 2026, mois: 10, jour: 8 })).toBe('jeudi 8 octobre')
  })

  it('écrit « 1er » pour le premier du mois, avec ou sans jour ni année', () => {
    const premier = { annee: 2026, mois: 9, jour: 1 }
    expect(dateEnLettres(premier)).toBe('mardi 1er septembre')
    expect(dateEnLettres(premier, { annee: true })).toBe('mardi 1er septembre 2026')
    expect(dateEnLettres(premier, { annee: true, jourDeSemaine: false })).toBe('1er septembre 2026')
  })

  it('met une majuscule initiale', () => {
    expect(majusculeInitiale('jeudi')).toBe('Jeudi')
    expect(majusculeInitiale('')).toBe('')
  })
})
